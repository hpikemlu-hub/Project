#!/bin/bash

# Deployment Script for HPI Workload to Coolify PC Kantor
# This script provides manual deployment steps and verification

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COOLIFY_URL="https://e94a60bd2c2f.ngrok-free.app"
COOLIFY_TOKEN="9UBQU0M8zWp2w8aUq2bMRspZN0Ltl9gQ2aQ4Mn6e75acde3b"
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

# Step 3: Check Node.js and Docker
check_dependencies() {
    log "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
        exit 1
    fi
    success "Node.js found: $(node --version)"
    
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi
    success "Docker found: $(docker --version)"
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
        exit 1
    fi
    success "Docker Compose found: $(docker-compose --version)"
}

# Step 4: Test application locally
test_local() {
    log "Testing application locally..."
    
    # Stop any existing container
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # Build and start the application
    log "Building Docker image..."
    docker-compose build
    
    log "Starting application..."
    docker-compose up -d
    
    # Wait for application to start
    log "Waiting for application to start..."
    sleep 10
    
    # Test if application is running
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        success "Application is running locally on port 3000"
    else
        error "Application failed to start locally"
        docker-compose logs app
        exit 1
    fi
    
    # Stop local application
    docker-compose down
}

# Step 5: Create deployment package
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
    
    # Create .dockerignore if not exists
    if [ ! -f .dockerignore ]; then
        cat > .dockerignore << EOF
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
EOF
    fi
    
    success "Deployment package created"
}

# Step 6: Instructions for Coolify deployment
coolify_instructions() {
    log "Coolify Deployment Instructions:"
    echo ""
    echo "1. Access Coolify Dashboard: $COOLIFY_URL"
    echo "2. Login with your credentials"
    echo "3. Create a new application with name: $APP_NAME"
    echo "4. Configure the following:"
    echo "   - Repository: Local Git or upload the deployment-package"
    echo "   - Build Method: Docker"
    echo "   - Dockerfile: Use the provided Dockerfile"
    echo "   - Port: 3000"
    echo "   - Environment: Production"
    echo ""
    echo "5. Set Environment Variables from .env.production:"
    echo "   - NODE_ENV=production"
    echo "   - PORT=3000"
    echo "   - SUPABASE_URL (from .env.production)"
    echo "   - SUPABASE_ANON_KEY (from .env.production)"
    echo "   - SUPABASE_SERVICE_KEY (from .env.production)"
    echo "   - JWT_SECRET (from .env.production)"
    echo ""
    echo "6. Configure Resources:"
    echo "   - Memory: 1-2 GB (limit 3 GB)"
    echo "   - CPU: 1.0-1.5 cores (limit 2.0)"
    echo "   - Storage: 2 GB"
    echo ""
    echo "7. Enable Health Checks:"
    echo "   - Endpoint: http://localhost:3000/"
    echo "   - Interval: 30 seconds"
    echo "   - Timeout: 10 seconds"
    echo "   - Retries: 3"
    echo ""
    echo "8. Deploy the application"
    echo "9. Monitor deployment progress"
    echo ""
}

# Step 7: Test Coolify connection
test_coolify() {
    log "Testing connection to Coolify..."
    
    if curl -f "$COOLIFY_URL" > /dev/null 2>&1; then
        success "Coolify is accessible at: $COOLIFY_URL"
    else
        warning "Cannot reach Coolify at: $COOLIFY_URL"
        warning "Please check if Coolify is running and the URL is correct"
    fi
}

# Step 8: Create verification script
create_verification() {
    log "Creating verification script..."
    
    cat > verify-deployment.sh << 'EOF'
#!/bin/bash

# Verification script for HPI Workload deployment
APP_URL="$1"

if [ -z "$APP_URL" ]; then
    echo "Usage: $0 <application-url>"
    exit 1
fi

echo "Verifying deployment at: $APP_URL"

# Test basic connectivity
if curl -f "$APP_URL" > /dev/null 2>&1; then
    echo "✅ Application is accessible"
else
    echo "❌ Application is not accessible"
    exit 1
fi

# Test API endpoints
echo "Testing API endpoints..."

# Test login
LOGIN_RESPONSE=$(curl -s -X POST "$APP_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}')

if echo "$LOGIN_RESPONSE" | grep -q "success"; then
    echo "✅ Login API working"
else
    echo "❌ Login API failed"
    echo "$LOGIN_RESPONSE"
fi

# Test data endpoints
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$TOKEN" ]; then
    # Test perjalanan dinas endpoint
    DATA_RESPONSE=$(curl -s "$APP_URL/api/perjalanan-dinas/table-data" \
        -H "Authorization: Bearer $TOKEN")
    
    if echo "$DATA_RESPONSE" | grep -q "success"; then
        echo "✅ Data API working"
    else
        echo "❌ Data API failed"
        echo "$DATA_RESPONSE"
    fi
else
    echo "❌ Could not extract token from login response"
fi

echo "Verification completed!"
EOF

    chmod +x verify-deployment.sh
    success "Verification script created: verify-deployment.sh"
}

# Main execution
main() {
    echo "🚀 HPI Workload Deployment to Coolify PC Kantor"
    echo "=================================================="
    
    check_directory
    check_files
    check_dependencies
    test_local
    create_package
    test_coolify
    create_verification
    coolify_instructions
    
    echo ""
    success "Deployment preparation completed!"
    echo ""
    echo "Next steps:"
    echo "1. Follow the Coolify instructions above"
    echo "2. After deployment, run: ./verify-deployment.sh <your-app-url>"
    echo ""
}

# Run main function
main "$@"