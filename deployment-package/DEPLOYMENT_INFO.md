# HPI Workload Deployment Information

## Application Details
- Name: hpi-workload
- Target: Coolify PC Kantor
- URL: https://e94a60bd2c2f.ngrok-free.app
- Environment: Production

## Deployment Instructions

### 1. Access Coolify Dashboard
- URL: https://e94a60bd2c2f.ngrok-free.app
- Login with your credentials

### 2. Create New Application
- Application Name: hpi-workload
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
