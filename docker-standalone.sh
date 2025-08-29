#!/bin/bash

# Docker Standalone Startup Script for Music Library
# Alternative to Docker Compose - runs individual containers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="music-library"
NETWORK_NAME="${PROJECT_NAME}-network"

# Container names
BACKEND_CONTAINER="${PROJECT_NAME}-backend"
FRONTEND_CONTAINER="${PROJECT_NAME}-frontend"
BOT_CONTAINER="${PROJECT_NAME}-telegram-bot"

# Image names
BACKEND_IMAGE="${PROJECT_NAME}/backend:latest"
FRONTEND_IMAGE="${PROJECT_NAME}/frontend:latest"
BOT_IMAGE="${PROJECT_NAME}/telegram-bot:latest"

# Ports
BACKEND_PORT="3000"
FRONTEND_PORT="80"
FRONTEND_HTTPS_PORT="443"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if .env file exists
check_env_file() {
    if [ ! -f ".env" ]; then
        print_error ".env file not found!"
        print_status "Creating .env from .env.example..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_warning "Please edit .env file with your actual configuration before continuing"
            exit 1
        else
            print_error ".env.example file not found!"
            exit 1
        fi
    fi
}

# Function to load environment variables
load_env() {
    print_status "Loading environment variables from .env file..."
    set -a  # automatically export all variables
    source .env
    set +a  # stop auto-export
}

# Function to create Docker network
create_network() {
    print_status "Creating Docker network: $NETWORK_NAME"
    
    if docker network ls | grep -q "$NETWORK_NAME"; then
        print_warning "Network $NETWORK_NAME already exists"
    else
        docker network create --driver bridge $NETWORK_NAME
        print_success "Network $NETWORK_NAME created"
    fi
}

# Function to build Docker images
build_images() {
    print_status "Building Docker images..."
    
    # Build backend image
    print_status "Building backend image..."
    docker build -t $BACKEND_IMAGE ./backend
    print_success "Backend image built: $BACKEND_IMAGE"
    
    # Build frontend image
    print_status "Building frontend image..."
    docker build -t $FRONTEND_IMAGE ./frontend
    print_success "Frontend image built: $FRONTEND_IMAGE"
    
    # Build telegram bot image
    print_status "Building telegram bot image..."
    docker build -t $BOT_IMAGE ./telegram-bot
    print_success "Telegram bot image built: $BOT_IMAGE"
}

# Function to stop and remove existing containers
cleanup_containers() {
    print_status "Cleaning up existing containers..."
    
    containers=($BACKEND_CONTAINER $FRONTEND_CONTAINER $BOT_CONTAINER)
    
    for container in "${containers[@]}"; do
        if docker ps -a | grep -q "$container"; then
            print_status "Stopping and removing container: $container"
            docker stop "$container" 2>/dev/null || true
            docker rm "$container" 2>/dev/null || true
        fi
    done
}

# Function to start backend container
start_backend() {
    print_status "Starting backend container..."
    
    docker run -d \
        --name $BACKEND_CONTAINER \
        --network $NETWORK_NAME \
        --restart unless-stopped \
        -p $BACKEND_PORT:3000 \
        -e NODE_ENV=production \
        -e DB_HOST="$DB_HOST" \
        -e DB_PORT="${DB_PORT:-3306}" \
        -e DB_NAME="$DB_NAME" \
        -e DB_USER="$DB_USER" \
        -e DB_PASSWORD="$DB_PASSWORD" \
        -e WEBDAV_URL="$WEBDAV_URL" \
        -e WEBDAV_USER="$WEBDAV_USER" \
        -e WEBDAV_PASSWORD="$WEBDAV_PASSWORD" \
        -e PORT=3000 \
        -v "$(pwd)/backend/logs:/app/logs" \
        -v "/etc/localtime:/etc/localtime:ro" \
        --memory=512m \
        --cpus="0.5" \
        $BACKEND_IMAGE
    
    print_success "Backend container started: $BACKEND_CONTAINER"
}

# Function to wait for backend to be healthy
wait_for_backend() {
    print_status "Waiting for backend to be healthy..."
    
    max_attempts=30
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "http://localhost:$BACKEND_PORT/health" >/dev/null 2>&1; then
            print_success "Backend is healthy!"
            return 0
        fi
        
        print_status "Attempt $attempt/$max_attempts - Backend not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "Backend failed to become healthy within timeout"
    return 1
}

# Function to start frontend container
start_frontend() {
    print_status "Starting frontend container..."
    
    docker run -d \
        --name $FRONTEND_CONTAINER \
        --network $NETWORK_NAME \
        --restart unless-stopped \
        -p $FRONTEND_PORT:8080 \
        -p $FRONTEND_HTTPS_PORT:8080 \
        -e VITE_API_URL="http://localhost:$BACKEND_PORT" \
        -v "/etc/localtime:/etc/localtime:ro" \
        --memory=256m \
        --cpus="0.25" \
        $FRONTEND_IMAGE
    
    print_success "Frontend container started: $FRONTEND_CONTAINER"
}

# Function to start telegram bot container
start_telegram_bot() {
    print_status "Starting telegram bot container..."
    
    if [ -z "$BOT_TOKEN" ]; then
        print_warning "BOT_TOKEN not set, skipping telegram bot container"
        return 0
    fi
    
    docker run -d \
        --name $BOT_CONTAINER \
        --network $NETWORK_NAME \
        --restart unless-stopped \
        -e NODE_ENV=production \
        -e BOT_TOKEN="$BOT_TOKEN" \
        -e API_BASE_URL="http://$BACKEND_CONTAINER:3000" \
        -e DB_HOST="$DB_HOST" \
        -e DB_PORT="${DB_PORT:-3306}" \
        -e DB_NAME="$DB_NAME" \
        -e DB_USER="$DB_USER" \
        -e DB_PASSWORD="$DB_PASSWORD" \
        -e WEBDAV_URL="$WEBDAV_URL" \
        -e WEBDAV_USER="$WEBDAV_USER" \
        -e WEBDAV_PASSWORD="$WEBDAV_PASSWORD" \
        -v "$(pwd)/telegram-bot/logs:/app/logs" \
        -v "/etc/localtime:/etc/localtime:ro" \
        --memory=256m \
        --cpus="0.25" \
        $BOT_IMAGE
    
    print_success "Telegram bot container started: $BOT_CONTAINER"
}

# Function to show container status
show_status() {
    print_status "Container Status:"
    echo ""
    
    containers=($BACKEND_CONTAINER $FRONTEND_CONTAINER $BOT_CONTAINER)
    
    for container in "${containers[@]}"; do
        if docker ps | grep -q "$container"; then
            status=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null || echo "not found")
            health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "no health check")
            echo -e "${GREEN}✓${NC} $container: $status ($health)"
        else
            echo -e "${RED}✗${NC} $container: not running"
        fi
    done
    
    echo ""
    print_status "Service URLs:"
    echo "  🌐 Web Frontend: http://localhost:$FRONTEND_PORT"
    echo "  🔧 Backend API: http://localhost:$BACKEND_PORT"
    echo "  📊 Health Check: http://localhost:$BACKEND_PORT/health"
    echo "  🤖 Telegram Bot: Active in Telegram (if BOT_TOKEN configured)"
}

# Function to show logs
show_logs() {
    container_name=$1
    if [ -z "$container_name" ]; then
        print_error "Please specify container name: backend, frontend, or bot"
        return 1
    fi
    
    case $container_name in
        "backend")
            docker logs -f $BACKEND_CONTAINER
            ;;
        "frontend")
            docker logs -f $FRONTEND_CONTAINER
            ;;
        "bot")
            docker logs -f $BOT_CONTAINER
            ;;
        *)
            print_error "Unknown container: $container_name"
            print_status "Available containers: backend, frontend, bot"
            ;;
    esac
}

# Function to stop all containers
stop_containers() {
    print_status "Stopping all containers..."
    
    containers=($BACKEND_CONTAINER $FRONTEND_CONTAINER $BOT_CONTAINER)
    
    for container in "${containers[@]}"; do
        if docker ps | grep -q "$container"; then
            print_status "Stopping container: $container"
            docker stop "$container"
        fi
    done
    
    print_success "All containers stopped"
}

# Function to remove all containers and network
cleanup_all() {
    print_status "Cleaning up all resources..."
    
    # Stop and remove containers
    cleanup_containers
    
    # Remove network
    if docker network ls | grep -q "$NETWORK_NAME"; then
        docker network rm $NETWORK_NAME
        print_success "Network $NETWORK_NAME removed"
    fi
    
    # Remove images (optional)
    if [ "$1" = "--remove-images" ]; then
        images=($BACKEND_IMAGE $FRONTEND_IMAGE $BOT_IMAGE)
        for image in "${images[@]}"; do
            if docker images | grep -q "$image"; then
                docker rmi "$image"
                print_success "Image removed: $image"
            fi
        done
    fi
    
    print_success "Cleanup completed"
}

# Function to show help
show_help() {
    echo "Docker Standalone Management Script for Music Library"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start         Start all services"
    echo "  stop          Stop all containers"
    echo "  restart       Restart all services"
    echo "  build         Build all Docker images"
    echo "  status        Show container status"
    echo "  logs <name>   Show logs for specific container (backend|frontend|bot)"
    echo "  cleanup       Remove containers and network"
    echo "  cleanup --remove-images  Remove containers, network, and images"
    echo "  help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start          # Start all services"
    echo "  $0 logs backend   # Show backend logs"
    echo "  $0 status         # Check service status"
}

# Main script logic
main() {
    case "${1:-start}" in
        "start")
            check_env_file
            load_env
            create_network
            cleanup_containers
            build_images
            start_backend
            wait_for_backend
            start_frontend
            start_telegram_bot
            echo ""
            show_status
            ;;
        "stop")
            stop_containers
            ;;
        "restart")
            stop_containers
            sleep 2
            main start
            ;;
        "build")
            build_images
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs "$2"
            ;;
        "cleanup")
            cleanup_all "$2"
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"