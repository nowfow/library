#!/bin/bash

# Backend Diagnostic Script for Music Library
# This script helps diagnose common backend startup issues

echo "🔍 Music Library Backend Diagnostic"
echo "=================================="
echo ""

# Check if containers are running
echo "🐳 Docker Status:"
echo "-----------------"
if command -v docker &> /dev/null; then
    echo "✅ Docker command available"
    
    # Check container status
    echo ""
    echo "Container Status:"
    docker compose ps 2>/dev/null || echo "No containers found"
    
    echo ""
    echo "Backend Container Logs (last 50 lines):"
    echo "----------------------------------------"
    docker compose logs --tail=50 backend 2>/dev/null || echo "No backend logs available"
    
    echo ""
    echo "Backend Health Check:"
    echo "---------------------"
    # Try to check health endpoint
    if docker compose ps | grep -q "music-library-backend.*Up"; then
        echo "Backend container is running"
        # Try health check
        docker compose exec backend wget -qO- http://localhost:3000/health 2>/dev/null || echo "Health check failed"
    else
        echo "Backend container not running"
    fi
    
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