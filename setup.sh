#!/bin/bash

# Music Library Quick Setup Script
# This script helps new users get started quickly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

log_header() { echo -e "${PURPLE}🎵 $1${NC}"; }
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

echo ""
log_header "Music Library Quick Setup"
echo "=========================="
echo ""

# Check prerequisites
log_info "Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed. Please install Docker first:"
    log_info "https://docs.docker.com/get-docker/"
    exit 1
fi

if ! docker info &> /dev/null; then
    log_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check Docker Compose v2
if ! docker compose version &> /dev/null; then
    log_error "Docker Compose v2 is not available. Please install Docker Compose v2:"
    log_info "https://docs.docker.com/compose/install/"
    log_info "Note: Use 'docker compose' (with space) instead of 'docker-compose' (with hyphen)"
    exit 1
fi

log_success "Prerequisites check passed"

# Create .env file if not exists
if [ ! -f ".env" ]; then
    log_info "Creating .env configuration file..."
    cp .env.example .env
    log_warning "Please edit .env file with your actual configuration!"
    echo ""
    log_info "Required settings:"
    echo "  - BOT_TOKEN: Get from @BotFather in Telegram"
    echo "  - DB_ROOT_PASSWORD: Set a secure database password"
    echo "  - DB_PASSWORD: Set a secure user password"
    echo "  - WEBDAV_URL: Your WebDAV storage URL"
    echo "  - WEBDAV_USER: Your WebDAV username"
    echo "  - WEBDAV_PASSWORD: Your WebDAV password"
    echo ""
    
    read -p "Press Enter to continue after editing .env file..." 
fi

# Make scripts executable
log_info "Making scripts executable..."
chmod +x docker-manager.sh
chmod +x start.sh
chmod +x stop.sh

# Choose setup method
echo ""
log_header "Setup Options"
echo "1. Full Docker setup (recommended for production)"
echo "2. Development setup with hot reloading"
echo "3. Local development (without Docker)"
echo "4. Just show me the commands"
echo ""

read -p "Choose option (1-4): " choice

case $choice in
    1)
        log_header "Full Docker Setup (Production)"
        log_info "Building Docker images..."
        ./docker-manager.sh build
        
        log_info "Starting services..."
        ./docker-manager.sh start production
        
        log_success "Setup complete!"
        ;;
    2)
        log_header "Development Setup with Hot Reloading"
        log_info "Building Docker images..."
        ./docker-manager.sh build
        
        log_info "Starting development environment..."
        ./docker-manager.sh start development
        
        log_success "Development setup complete!"
        ;;
    3)
        log_header "Local Development Setup"
        
        # Check Node.js
        if ! command -v node &> /dev/null; then
            log_error "Node.js is not installed. Please install Node.js 18+ first:"
            log_info "https://nodejs.org/"
            exit 1
        fi
        
        log_info "Installing dependencies..."
        cd backend && npm install && cd ..
        cd frontend && npm install && cd ..
        cd telegram-bot && npm install && cd ..
        
        log_info "Starting local development..."
        ./start.sh
        
        log_success "Local development setup complete!"
        ;;
    4)
        log_header "Quick Command Reference"
        echo ""
        echo "Docker Commands:"
        echo "  ./docker-manager.sh start production   # Start production"
        echo "  ./docker-manager.sh start development  # Start development"
        echo "  ./docker-manager.sh stop               # Stop all services"
        echo "  ./docker-manager.sh status             # Show status"
        echo "  ./docker-manager.sh logs               # Show logs"
        echo ""
        echo "Local Commands:"
        echo "  ./start.sh                             # Start locally"
        echo "  ./stop.sh                              # Stop local"
        echo ""
        echo "Make Commands (if make is installed):"
        echo "  make start                             # Start production"
        echo "  make start-dev                         # Start development"
        echo "  make stop                              # Stop services"
        echo "  make help                              # Show all commands"
        ;;
    *)
        log_error "Invalid option selected"
        exit 1
        ;;
esac

echo ""
log_header "Service URLs"
echo "🌐 Web Interface: http://localhost"
echo "🔧 Backend API:   http://localhost:3000"
echo "🗄️  Database:      localhost:3306"
echo "🤖 Telegram Bot:  Active (search @your_bot_name)"

echo ""
log_header "Useful Commands"
echo "View logs:     ./docker-manager.sh logs [service]"
echo "Stop services: ./docker-manager.sh stop"
echo "Restart:       ./docker-manager.sh restart"
echo "Status:        ./docker-manager.sh status"
echo "Help:          ./docker-manager.sh help"

echo ""
log_header "Next Steps"
echo "1. 📱 Create Telegram bot: Chat with @BotFather"
echo "2. 🔧 Configure .env file with your settings"
echo "3. 🗄️  Set up your MySQL database"
echo "4. ☁️  Configure WebDAV storage"
echo "5. 🎵 Start uploading your music collection!"

echo ""
log_success "Music Library setup complete! Enjoy managing your music collection! 🎶"