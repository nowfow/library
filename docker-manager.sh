#!/bin/bash

# Music Library Docker Management Script
# Unified management for all services: frontend, backend, telegram-bot, database

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_header() { echo -e "${PURPLE}🎵 $1${NC}"; }

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Function to check if .env file exists
check_env() {
    if [ ! -f ".env" ]; then
        log_warning ".env file not found"
        if [ -f ".env.example" ]; then
            log_info "Copying .env.example to .env"
            cp .env.example .env
            log_warning "Please edit .env file with your actual configuration before continuing"
            return 1
        else
            log_error ".env.example file not found"
            return 1
        fi
    fi
    return 0
}

# Function to build all images
build_images() {
    log_header "Building Docker Images"
    
    log_info "Building backend image..."
    docker compose build backend
    
    log_info "Building frontend image..."
    docker compose build frontend
    
    log_info "Building telegram-bot image..."
    docker compose build telegram-bot
    
    log_success "All images built successfully"
}

# Function to start services
start_services() {
    local mode=${1:-production}
    
    log_header "Starting Music Library Services (${mode} mode)"
    
    if [ "$mode" = "development" ]; then
        log_info "Starting in development mode with hot reloading..."
        docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
    elif [ "$mode" = "production" ]; then
        log_info "Starting in production mode..."
        docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    else
        log_info "Starting with default configuration..."
        docker compose up -d
    fi
    
    log_success "Services started successfully"
    show_status
}

# Function to stop services
stop_services() {
    log_header "Stopping Music Library Services"
    
    docker compose down
    
    log_success "All services stopped"
}

# Function to restart services
restart_services() {
    local mode=${1:-production}
    
    log_header "Restarting Music Library Services"
    
    stop_services
    start_services "$mode"
}

# Function to show service status
show_status() {
    log_header "Service Status"
    
    echo ""
    docker compose ps
    
    echo ""
    log_info "Service URLs:"
    echo "  🌐 Frontend:     http://localhost"
    echo "  🔧 Backend API:  http://localhost:3000"
    echo "  🗄️  Database:     External (${DB_HOST:-remote server})"
    echo "  🤖 Telegram Bot: Active (check logs)"
    
    echo ""
    log_info "Useful Commands:"
    echo "  docker compose logs -f [service]     # View logs"
    echo "  docker compose exec [service] sh    # Access container shell"
    echo "  docker compose restart [service]    # Restart specific service"
}

# Function to show logs
show_logs() {
    local service=${1:-}
    
    if [ -z "$service" ]; then
        log_info "Showing logs for all services (use Ctrl+C to exit)"
        docker compose logs -f
    else
        log_info "Showing logs for $service (use Ctrl+C to exit)"
        docker compose logs -f "$service"
    fi
}

# Function to clean up
cleanup() {
    log_header "Cleaning Up Docker Resources"
    
    log_info "Stopping and removing containers..."
    docker compose down -v
    
    log_info "Removing unused images..."
    docker image prune -f
    
    log_info "Removing unused volumes..."
    docker volume prune -f
    
    log_info "Removing unused networks..."
    docker network prune -f
    
    log_success "Cleanup completed"
}

# Function to update services
update_services() {
    log_header "Updating Music Library Services"
    
    log_info "Pulling latest base images..."
    docker compose pull
    
    log_info "Rebuilding images..."
    build_images
    
    log_info "Restarting services..."
    restart_services
    
    log_success "Update completed"
}

# Function to backup database (external)
backup_database() {
    log_header "Database Backup (External)"
    
    log_warning "Database is hosted externally on ${DB_HOST:-remote server}"
    log_info "Please use your database provider's backup tools or contact your database administrator"
    log_info "For MySQL, you can use: mysqldump -h ${DB_HOST} -u ${DB_USER} -p ${DB_NAME} > backup.sql"
    
    return 0
}

# Function to run diagnostics
run_diagnostics() {
    log_header "Running Diagnostics"
    
    if [ -f "./diagnose.sh" ]; then
        chmod +x ./diagnose.sh
        ./diagnose.sh
    else
        log_warning "diagnose.sh script not found"
        log_info "Manual diagnostic steps:"
        echo "  1. Check .env file exists and is configured"
        echo "  2. Check container logs: docker compose logs backend"
        echo "  3. Test database connectivity from host"
        echo "  4. Verify WebDAV credentials"
    fi
}

# Function to show help
show_help() {
    echo "Music Library Docker Management Script"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  build              Build all Docker images"
    echo "  start [mode]       Start services (mode: development|production)"
    echo "  stop               Stop all services"
    echo "  restart [mode]     Restart services"
    echo "  status             Show service status"
    echo "  logs [service]     Show logs (all services or specific service)"
    echo "  cleanup            Clean up Docker resources"
    echo "  update             Update and restart services"
    echo "  backup             Create database backup"
    echo "  diagnose           Run diagnostic checks"
    echo "  help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start development    # Start in development mode"
    echo "  $0 start production     # Start in production mode"
    echo "  $0 logs telegram-bot    # Show telegram bot logs"
    echo "  $0 logs                 # Show all logs"
}

# Main script logic
main() {
    check_docker
    
    case "${1:-help}" in
        build)
            check_env || exit 1
            build_images
            ;;
        start)
            check_env || exit 1
            start_services "${2:-production}"
            ;;
        stop)
            stop_services
            ;;
        restart)
            check_env || exit 1
            restart_services "${2:-production}"
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "${2:-}"
            ;;
        cleanup)
            cleanup
            ;;
        update)
            check_env || exit 1
            update_services
            ;;
        backup)
            backup_database
            ;;
        diagnose)
            run_diagnostics
            ;;
        help)
            show_help
            ;;
        *)
            log_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"