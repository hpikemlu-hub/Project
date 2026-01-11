#!/usr/bin/env node

/**
 * Deployment Script for HPI Workload to Coolify PC Kantor
 * This script automates the deployment process using Coolify API
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const COOLIFY_API_TOKEN = '9UBQU0M8zWp2w8aUq2bMRspZN0Ltl9gQ2aQ4Mn6e75acde3b';
const COOLIFY_BASE_URL = 'https://e94a60bd2c2f.ngrok-free.app';
const APP_NAME = 'hpi-workload';
const PROJECT_PATH = '/home/hpsb/project/hpi-workload';

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
    log(`\n[${step}] ${message}`, 'blue');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

// Make HTTP request to Coolify API
function makeRequest(endpoint, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const url = `${COOLIFY_BASE_URL}/api/v1${endpoint}`;
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${COOLIFY_API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(url, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    resolve({ status: res.statusCode, data: response });
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

// Check if required files exist
function checkRequiredFiles() {
    logStep(1, 'Checking required files...');
    
    const requiredFiles = [
        'Dockerfile',
        'docker-compose.yml',
        '.env.production',
        'package.json'
    ];

    for (const file of requiredFiles) {
        const filePath = path.join(PROJECT_PATH, file);
        if (!fs.existsSync(filePath)) {
            logError(`Required file not found: ${file}`);
            process.exit(1);
        }
        logSuccess(`Found: ${file}`);
    }

    logSuccess('All required files are present');
}

// Test connection to Coolify
async function testCoolifyConnection() {
    logStep(2, 'Testing connection to Coolify...');
    
    try {
        const response = await makeRequest('/applications');
        if (response.status === 200) {
            logSuccess('Connected to Coolify successfully');
            return true;
        } else {
            logError(`Failed to connect to Coolify. Status: ${response.status}`);
            return false;
        }
    } catch (error) {
        logError(`Connection error: ${error.message}`);
        return false;
    }
}

// Create or get application
async function createApplication() {
    logStep(3, 'Setting up application in Coolify...');
    
    try {
        // Check if application already exists
        const listResponse = await makeRequest('/applications');
        if (listResponse.status === 200) {
            const existingApp = listResponse.data.find(app => app.name === APP_NAME);
            if (existingApp) {
                logSuccess(`Application "${APP_NAME}" already exists`);
                return existingApp;
            }
        }

        // Create new application
        const appData = {
            name: APP_NAME,
            description: 'HPI Workload Management System',
            repository: {
                url: 'https://github.com/your-repo/hpi-workload', // Update with actual repo
                branch: 'main'
            },
            build: {
                type: 'docker',
                dockerfilePath: 'Dockerfile',
                buildContext: '.'
            },
            environment: 'production',
            port: 3000
        };

        const createResponse = await makeRequest('/applications', 'POST', appData);
        if (createResponse.status === 201) {
            logSuccess(`Application "${APP_NAME}" created successfully`);
            return createResponse.data;
        } else {
            logError(`Failed to create application: ${JSON.stringify(createResponse.data)}`);
            return null;
        }
    } catch (error) {
        logError(`Error creating application: ${error.message}`);
        return null;
    }
}

// Configure environment variables
async function configureEnvironment(appId) {
    logStep(4, 'Configuring environment variables...');
    
    try {
        const envFile = fs.readFileSync(path.join(PROJECT_PATH, '.env.production'), 'utf8');
        const envVars = {};
        
        // Parse .env file
        envFile.split('\n').forEach(line => {
            if (line.trim() && !line.startsWith('#')) {
                const [key, ...valueParts] = line.split('=');
                if (key && valueParts.length > 0) {
                    envVars[key.trim()] = valueParts.join('=').trim();
                }
            }
        });

        // Set environment variables via API
        const envResponse = await makeRequest(`/applications/${appId}/environment`, 'POST', {
            variables: envVars
        });

        if (envResponse.status === 200) {
            logSuccess('Environment variables configured');
            return true;
        } else {
            logError(`Failed to configure environment: ${JSON.stringify(envResponse.data)}`);
            return false;
        }
    } catch (error) {
        logError(`Error configuring environment: ${error.message}`);
        return false;
    }
}

// Trigger deployment
async function triggerDeployment(appId) {
    logStep(5, 'Triggering deployment...');
    
    try {
        const deployResponse = await makeRequest(`/applications/${appId}/deploy`, 'POST');
        if (deployResponse.status === 200) {
            logSuccess('Deployment triggered successfully');
            return deployResponse.data;
        } else {
            logError(`Failed to trigger deployment: ${JSON.stringify(deployResponse.data)}`);
            return null;
        }
    } catch (error) {
        logError(`Error triggering deployment: ${error.message}`);
        return null;
    }
}

// Monitor deployment status
async function monitorDeployment(deploymentId) {
    logStep(6, 'Monitoring deployment progress...');
    
    const maxAttempts = 60; // 10 minutes max
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        try {
            const statusResponse = await makeRequest(`/deployments/${deploymentId}`);
            if (statusResponse.status === 200) {
                const deployment = statusResponse.data;
                
                switch (deployment.status) {
                    case 'success':
                        logSuccess('Deployment completed successfully!');
                        log(`🌍 Application URL: ${COOLIFY_BASE_URL}`, 'blue');
                        return true;
                    
                    case 'failed':
                        logError('Deployment failed!');
                        log(`Error details: ${deployment.error || 'Unknown error'}`, 'red');
                        return false;
                    
                    case 'running':
                        log(`⏳ Deployment in progress... (${attempts + 1}/${maxAttempts})`, 'yellow');
                        break;
                    
                    default:
                        log(`📋 Status: ${deployment.status}`, 'yellow');
                }
            }
        } catch (error) {
            logError(`Error checking deployment status: ${error.message}`);
        }
        
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    }
    
    logError('Deployment timeout - please check Coolify dashboard manually');
    return false;
}

// Main deployment function
async function deploy() {
    log('🚀 Starting HPI Workload Deployment to Coolify PC Kantor', 'blue');
    log(`📍 Target: ${COOLIFY_BASE_URL}`, 'blue');
    log(`📂 Project: ${PROJECT_PATH}`, 'blue');
    
    // Step 1: Check required files
    checkRequiredFiles();
    
    // Step 2: Test connection
    const connected = await testCoolifyConnection();
    if (!connected) {
        process.exit(1);
    }
    
    // Step 3: Create/get application
    const app = await createApplication();
    if (!app) {
        process.exit(1);
    }
    
    // Step 4: Configure environment
    const envConfigured = await configureEnvironment(app.id);
    if (!envConfigured) {
        process.exit(1);
    }
    
    // Step 5: Trigger deployment
    const deployment = await triggerDeployment(app.id);
    if (!deployment) {
        process.exit(1);
    }
    
    // Step 6: Monitor deployment
    const success = await monitorDeployment(deployment.id);
    
    if (success) {
        log('\n🎉 Deployment completed successfully!', 'green');
        log('📋 Next steps:', 'blue');
        log('   1. Access the application at the URL above');
        log('   2. Test all features (login, CRUD operations, calendar)');
        log('   3. Monitor application health in Coolify dashboard');
        log('   4. Set up monitoring and alerts if needed');
    } else {
        log('\n❌ Deployment failed. Please check the logs above.', 'red');
        process.exit(1);
    }
}

// Handle errors gracefully
process.on('unhandledRejection', (reason, promise) => {
    logError(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    logError(`Uncaught Exception: ${error.message}`);
    process.exit(1);
});

// Run deployment
if (require.main === module) {
    deploy();
}

module.exports = { deploy };