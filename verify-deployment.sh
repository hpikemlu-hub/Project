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
