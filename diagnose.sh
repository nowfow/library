#!/bin/bash

# Backend Diagnostic Script for Music Library
# This script helps diagnose common backend startup issues

echo "🔍 Music Library Backend Diagnostic"
echo "=================================="
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found in project root"
    echo "   Please create .env file from .env.example"
    exit 1
else
    echo "✅ .env file found"
fi

echo ""
echo "📊 Environment Variables Check:"
echo "-------------------------------"

# Check critical environment variables (without showing sensitive values)
check_env_var() {
    local var_name=$1
    local var_value=$(grep "^${var_name}=" .env 2>/dev/null | cut -d'=' -f2-)
    
    if [ -z "$var_value" ] || [ "$var_value" = "your_placeholder_value" ]; then
        echo "❌ $var_name: Not configured"
        return 1
    else
        echo "✅ $var_name: Configured"
        return 0
    fi
}

# Check all required environment variables
all_good=true

check_env_var "DB_HOST" || all_good=false
check_env_var "DB_PORT" || all_good=false
check_env_var "DB_NAME" || all_good=false
check_env_var "DB_USER" || all_good=false
check_env_var "DB_PASSWORD" || all_good=false
check_env_var "WEBDAV_URL" || all_good=false
check_env_var "WEBDAV_USER" || all_good=false
check_env_var "WEBDAV_PASSWORD" || all_good=false
check_env_var "BOT_TOKEN" || all_good=false

echo ""
if [ "$all_good" = true ]; then
    echo "✅ All environment variables configured"
else
    echo "❌ Some environment variables need configuration"
    echo "   Please check and update your .env file"
fi

echo ""
echo "🐳 Docker Status:"
echo "-----------------"

# Check Docker containers status
if command -v docker &> /dev/null; then
    echo "✅ Docker command available"
    
    # Check if containers are running
    echo ""
    echo "Container Status:"
    docker compose ps 2>/dev/null || echo "No containers running"
    
    echo ""
    echo "Recent Backend Logs:"
    echo "--------------------"
    docker compose logs --tail=20 backend 2>/dev/null || echo "No backend logs available"
    
else
    echo "❌ Docker not available"
fi

echo ""
echo "🔧 Recommendations:"
echo "-------------------"
echo "1. Make sure all environment variables are properly configured in .env"
echo "2. Check that your database server is accessible from Docker containers"
echo "3. Verify WebDAV credentials are correct"
echo "4. Check backend logs with: ./docker-manager.sh logs backend"
echo "5. Test individual services with: docker compose logs [service-name]"

echo ""
echo "📞 Common Solutions:"
echo "--------------------"
echo "• Database connection issues: Check DB_HOST, DB_PORT, and firewall settings"
echo "• WebDAV issues: Verify WEBDAV_URL, WEBDAV_USER, and WEBDAV_PASSWORD"
echo "• Bot issues: Check BOT_TOKEN from @BotFather"
echo "• Rebuild containers: ./docker-manager.sh cleanup && ./docker-manager.sh build"