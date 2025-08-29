#!/bin/bash

# Music Library Project Stop Script
# Stops backend, frontend, and Telegram bot

echo "🛑 Stopping Music Library Project..."
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to stop a service
stop_service() {
    local service_name=$1
    local pid_file=$2
    
    if [ -f "$pid_file" ]; then
        PID=$(cat $pid_file)
        
        if ps -p $PID > /dev/null 2>&1; then
            echo "🔄 Stopping $service_name (PID: $PID)..."
            kill $PID
            
            # Wait for graceful shutdown
            sleep 2
            
            # Check if still running, force kill if necessary
            if ps -p $PID > /dev/null 2>&1; then
                echo "💥 Force stopping $service_name..."
                kill -9 $PID
            fi
            
            print_status "$service_name stopped"
        else
            print_warning "$service_name process not found (PID: $PID)"
        fi
        
        rm $pid_file
    else
        print_warning "No PID file found for $service_name"
    fi
}

# Stop Telegram bot
stop_service "Telegram Bot" "telegram-bot.pid"

# Stop frontend
stop_service "Frontend" "frontend.pid"

# Stop backend
stop_service "Backend" "backend.pid"

# Additional cleanup - kill any remaining processes
echo "🧹 Cleaning up remaining processes..."

# Kill any remaining node processes for this project
pkill -f "frontend.*vite" 2>/dev/null || true
pkill -f "backend.*nodemon" 2>/dev/null || true
pkill -f "telegram-bot.*nodemon" 2>/dev/null || true

# Clean up any orphaned processes
pkill -f "library.*node" 2>/dev/null || true

print_status "All services stopped successfully!"
echo ""
echo "🏁 Music Library Project shutdown complete!"
echo ""
echo "To restart the project, run: ./start.sh"