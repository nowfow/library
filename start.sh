#!/bin/bash

# Music Library Project Startup Script
# Starts backend, frontend, and Telegram bot

echo "🎵 Starting Music Library Project..."
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if required directories exist
if [ ! -d "backend" ]; then
    print_error "Backend directory not found!"
    exit 1
fi

if [ ! -d "frontend" ]; then
    print_error "Frontend directory not found!"
    exit 1
fi

if [ ! -d "telegram-bot" ]; then
    print_warning "Telegram bot directory not found. Skipping bot startup."
    SKIP_BOT=true
fi

# Check for .env files
if [ ! -f "backend/.env" ]; then
    print_warning "Backend .env file not found. Make sure to configure it."
fi

if [ ! -f "frontend/.env" ]; then
    print_warning "Frontend .env file not found. Make sure to configure it."
fi

if [ ! -f "telegram-bot/.env" ] && [ "$SKIP_BOT" != "true" ]; then
    print_warning "Telegram bot .env file not found. Bot will not start."
    SKIP_BOT=true
fi

# Function to install dependencies
install_deps() {
    local dir=$1
    local name=$2
    
    if [ ! -d "$dir/node_modules" ]; then
        print_info "Installing $name dependencies..."
        cd $dir
        npm install
        cd ..
    fi
}

# Install dependencies
print_info "Checking and installing dependencies..."
install_deps "backend" "backend"
install_deps "frontend" "frontend"

if [ "$SKIP_BOT" != "true" ]; then
    install_deps "telegram-bot" "telegram bot"
fi

# Start backend
print_info "Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..
echo $BACKEND_PID > backend.pid
print_status "Backend started (PID: $BACKEND_PID)"

# Wait a moment for backend to initialize
sleep 3

# Start frontend
print_info "Starting frontend development server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..
echo $FRONTEND_PID > frontend.pid
print_status "Frontend started (PID: $FRONTEND_PID)"

# Wait for frontend to initialize
sleep 3

# Start Telegram bot (if available and configured)
if [ "$SKIP_BOT" != "true" ]; then
    print_info "Starting Telegram bot..."
    cd telegram-bot
    npm run dev &
    BOT_PID=$!
    cd ..
    echo $BOT_PID > telegram-bot.pid
    print_status "Telegram bot started (PID: $BOT_PID)"
fi

# Wait a moment for all services to stabilize
sleep 2

print_status "All services started successfully!"
echo ""
echo "🎵 Music Library Project is now running:"
echo "======================================="
echo "📱 Frontend:      http://localhost:5173"
echo "🔧 Backend API:   http://localhost:3000"
if [ "$SKIP_BOT" != "true" ]; then
    echo "🤖 Telegram Bot:  Active and listening"
fi
echo ""
echo "📊 Process Information:"
echo "  • Backend PID:  $BACKEND_PID"
echo "  • Frontend PID: $FRONTEND_PID"
if [ "$SKIP_BOT" != "true" ]; then
    echo "  • Bot PID:      $BOT_PID"
fi
echo ""
echo "📝 Logs:"
echo "  • Backend:  backend/logs (if configured)"
echo "  • Frontend: Check terminal output"
if [ "$SKIP_BOT" != "true" ]; then
    echo "  • Bot:      telegram-bot/logs (if configured)"
fi
echo ""
echo "🛑 To stop all services, run: ./stop.sh"
echo ""
print_status "Project is ready for use! 🎉"