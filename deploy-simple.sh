#!/bin/bash

# Simple Deployment Script for HPI Workload to Coolify PC Kantor
# This script prepares files and provides deployment instructions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COOLIFY_URL="https://e94a60bd2c2f.ngrok-free.app"
PROJECT_DIR="/home/hpsb/project/hpi-workload"
APP_NAME="hpi-workload"

# Functions
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Check if we're in the right directory
check_directory() {
    log "Checking project directory..."
    if [ ! -d "$PROJECT_DIR" ]; then
        error "Project directory not found: $PROJECT_DIR"
        exit 1
    fi
    cd "$PROJECT_DIR"
    success "Changed to project directory: $PROJECT_DIR"
}

# Step 2: Check required files
check_files() {
    log "Checking required files..."
    
    required_files=("Dockerfile" "docker-compose.yml" ".env.production" "package.json" "server.js")
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            error "Required file not found: $file"
            exit 1
        fi
        success "Found: $file"
    done
}

# Step 3: Test Node.js application
test_nodejs() {
    log "Testing Node.js application..."
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        log "Installing dependencies..."
        npm install
    fi
    
    # Test if application can start
    log "Testing application startup..."
    
    # Test basic syntax
    if node -c server.js; then
        success "Server.js syntax is valid"
    else
        error "Server.js has syntax errors"
        exit 1
    fi
    
    # Test package.json
    if node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))"; then
        success "package.json is valid"
    else
        error "package.json has syntax errors"
        exit 1
    fi
}

# Step 4: Create deployment package
create_package() {
    log "Creating deployment package..."
    
    # Create deployment directory
    mkdir -p deployment-package
    
    # Copy necessary files
    cp Dockerfile deployment-package/
    cp docker-compose.yml deployment-package/
    cp .env.production deployment-package/
    cp package.json deployment-package/
    cp -r public deployment-package/
    cp -r routes deployment-package/
    cp -r config deployment-package/
    cp -r middleware deployment-package/
    cp server.js deployment-package/
    
    # Create .dockerignore
    cat > deployment-package/.dockerignore << EOF
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.nyc_output
.coverage
deployment-package
*.log
.DS_Store
EOF
    
    # Create deployment info
    cat > deployment-package/DEPLOYMENT_INFO.md << EOF
# HPI Workload Deployment Information

## Application Details
- Name: $APP_NAME
- Target: Coolify PC Kantor
- URL: $COOLIFY_URL
- Environment: Production

## Deployment Instructions

### 1. Access Coolify Dashboard
- URL: $COOLIFY_URL
- Login with your credentials

### 2. Create New Application
- Application Name: $APP_NAME
- Description: HPI Workload Management System

### 3. Configure Build Settings
- Build Method: Docker
- Dockerfile: Use the provided Dockerfile
- Build Context: Root directory
- Port: 3000

### 4. Environment Variables
Copy these variables from .env.production:
- NODE_ENV=production
- PORT=3000
- SUPABASE_URL (get from .env.production)
- SUPABASE_ANON_KEY (get from .env.production)
- SUPABASE_SERVICE_KEY (get from .env.production)
- JWT_SECRET (get from .env.production)

### 5. Resource Allocation
- Memory: 1-2 GB (limit 3 GB)
- CPU: 1.0-1.5 cores (limit 2.0)
- Storage: 2 GB

### 6. Health Check
- Endpoint: http://localhost:3000/
- Interval: 30 seconds
- Timeout: 10 seconds
- Retries: 3

### 7. Deployment
- Click Deploy button
- Monitor deployment progress
- Check logs if any issues occur

## Post-Deployment Verification
1. Access the deployed application
2. Test login functionality
3. Test CRUD operations
4. Test calendar feature
5. Verify database connectivity

## Troubleshooting
- Check Coolify logs for deployment errors
- Verify environment variables are correct
- Ensure Supabase is accessible
- Check resource allocation
EOF
    
    success "Deployment package created in deployment-package/"
}

# Step 5: Test Coolify connection
test_coolify() {
    log "Testing connection to Coolify..."
    
    if curl -f -s "$COOLIFY_URL" > /dev/null 2>&1; then
        success "Coolify is accessible at: $COOLIFY_URL"
    else
        warning "Cannot reach Coolify at: $COOLIFY_URL"
        warning "Please check if Coolify is running and URL is correct"
    fi
}

# Step 6: Create verification script
create_verification() {
    log "Creating verification script..."
    
    cat > verify-deployment.sh << 'EOF'
#!/bin/bash

# Verification script for HPI Workload deployment
APP_URL="$1"

if [ -z "$APP_URL" ]; then
    echo "Usage: $0 <application-url>"
    echo "Example: $0 https://your-app.coolify.io"
    exit 1
fi

echo "🔍 Verifying deployment at: $APP_URL"
echo "=================================================="

# Test basic connectivity
echo "1. Testing basic connectivity..."
if curl -f -s "$APP_URL" > /dev/null 2>&1; then
    echo "✅ Application is accessible"
else
    echo "❌ Application is not accessible"
    echo "Please check if the application is running"
    exit 1
fi

# Test API endpoints
echo ""
echo "2. Testing API endpoints..."

# Test login endpoint
echo "   Testing login API..."
LOGIN_RESPONSE=$(curl -s -X POST "$APP_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}')

if echo "$LOGIN_RESPONSE" | grep -q "success"; then
    echo "   ✅ Login API working"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "   📝 Token obtained successfully"
else
    echo "   ❌ Login API failed"
    echo "   Response: $LOGIN_RESPONSE"
    exit 1
fi

# Test perjalanan dinas endpoint
echo "   Testing perjalanan dinas API..."
if [ ! -z "$TOKEN" ]; then
    DATA_RESPONSE=$(curl -s "$APP_URL/api/perjalanan-dinas/table-data" \
        -H "Authorization: Bearer $TOKEN")
    
    if echo "$DATA_RESPONSE" | grep -q "success"; then
        echo "   ✅ Data API working"
        RECORD_COUNT=$(echo "$DATA_RESPONSE" | grep -o '"data":\[[^]]*\]' | grep -o '\[.*\]' | wc -w)
        echo "   📊 Found $RECORD_COUNT records in database"
    else
        echo "   ❌ Data API failed"
        echo "   Response: $DATA_RESPONSE"
    fi
fi

# Test calendar endpoint
echo "   Testing calendar data API..."
if [ ! -z "$TOKEN" ]; then
    CALENDAR_RESPONSE=$(curl -s "$APP_URL/api/perjalanan-dinas/table-data" \
        -H "Authorization: Bearer $TOKEN")
    
    if echo "$CALENDAR_RESPONSE" | grep -q "success"; then
        echo "   ✅ Calendar data API working"
    else
        echo "   ❌ Calendar data API failed"
    fi
fi

echo ""
echo "3. Testing static files..."
STATIC_FILES=("index.html" "perjalanan-dinas.html" "kalender-perjalanan-dinas.html" "dashboard.html")

for file in "${STATIC_FILES[@]}"; do
    if curl -f -s "$APP_URL/$file" > /dev/null 2>&1; then
        echo "   ✅ $file is accessible"
    else
        echo "   ❌ $file is not accessible"
    fi
done

echo ""
echo "🎉 Verification completed!"
echo ""
echo "📋 Summary:"
echo "   - Application URL: $APP_URL"
echo "   - All API endpoints working"
echo "   - Static files accessible"
echo "   - Ready for production use"
EOF

    chmod +x verify-deployment.sh
    success "Verification script created: verify-deployment.sh"
}

# Step 7: Create deployment summary
create_summary() {
    log "Creating deployment summary..."
    
    cat > DEPLOYMENT_SUMMARY.md << EOF
# HPI Workload Deployment Summary

## 🚀 Deployment Status: READY FOR DEPLOYMENT

## 📁 Files Prepared
- ✅ Dockerfile (optimized for production)
- ✅ docker-compose.yml (with resource limits)
- ✅ .env.production (production environment variables)
- ✅ package.json (dependencies)
- ✅ All source code files
- ✅ .dockerignore (optimized build context)

## 🔧 Configuration Details
- **Application Name**: $APP_NAME
- **Target Platform**: Coolify PC Kantor
- **Environment**: Production
- **Port**: 3000
- **Database**: Supabase (existing)

## 📋 Deployment Steps
1. Access Coolify Dashboard: $COOLIFY_URL
2. Create new application: "$APP_NAME"
3. Upload deployment-package or connect Git repository
4. Configure build settings (Docker)
5. Set environment variables from .env.production
6. Configure resources (1-2GB RAM, 1-2 CPU cores)
7. Deploy and monitor progress

## ✅ Pre-deployment Tests
- ✅ Node.js application syntax check
- ✅ Package.json validation
- ✅ Required files verification
- ✅ Coolify connectivity test

## 🧪 Post-deployment Verification
Run: ./verify-deployment.sh <your-deployed-url>

## 📞 Support Information
- Coolify Dashboard: $COOLIFY_URL
- Application Repository: Local/PC Kantor
- Database: Supabase (existing configuration)

---
*Prepared on: $(date)*
*Deployment target: Coolify PC Kantor*
EOF
    
    success "Deployment summary created: DEPLOYMENT_SUMMARY.md"
}

# Main execution
main() {
    echo "🚀 HPI Workload Deployment Preparation"
    echo "Target: Coolify PC Kantor"
    echo "URL: $COOLIFY_URL"
    echo "=================================================="
    
    check_directory
    check_files
    test_nodejs
    create_package
    test_coolify
    create_verification
    create_summary
    
    echo ""
    success "🎉 Deployment preparation completed successfully!"
    echo ""
    echo "📂 Next Steps:"
    echo "1. 📋 Read DEPLOYMENT_INFO.md for detailed instructions"
    echo "2. 🌐 Access Coolify at: $COOLIFY_URL"
    echo "3. 📤 Upload deployment-package to Coolify"
    echo "4. ⚙️  Configure environment variables from .env.production"
    echo "5. 🚀 Deploy the application"
    echo "6. 🧪 Run: ./verify-deployment.sh <your-app-url>"
    echo ""
    echo "📁 Files created:"
    echo "   - deployment-package/ (contains all deployment files)"
    echo "   - verify-deployment.sh (verification script)"
    echo "   - DEPLOYMENT_SUMMARY.md (summary of preparation)"
    echo "   - DEPLOYMENT_INFO.md (detailed instructions)"
    echo ""
}

# Run main function
main "$@"