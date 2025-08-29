# Music Library Project Makefile
# Convenient commands for development and deployment

.PHONY: help setup build start stop restart status logs clean update backup test

# Default target
help:
	@echo "🎵 Music Library Project Management"
	@echo "=================================="
	@echo ""
	@echo "Available commands:"
	@echo "  setup       - Initial project setup"
	@echo "  build       - Build all Docker images"
	@echo "  start       - Start all services (production)"
	@echo "  start-dev   - Start all services (development)"
	@echo "  stop        - Stop all services"
	@echo "  restart     - Restart all services"
	@echo "  status      - Show service status"
	@echo "  logs        - Show logs for all services"
	@echo "  logs-bot    - Show Telegram bot logs"
	@echo "  logs-api    - Show backend API logs"
	@echo "  logs-web    - Show frontend logs"
	@echo "  clean       - Clean up Docker resources"
	@echo "  update      - Update and restart services"
	@echo "  test        - Run tests"
	@echo "  install     - Install dependencies locally"
	@echo ""
	@echo "Docker commands:"
	@echo "  docker-build   - Build Docker images"
	@echo "  docker-up      - Start with Docker Compose"
	@echo "  docker-down    - Stop Docker services"
	@echo "  docker-logs    - View Docker logs"
	@echo ""
	@echo "Note: Database is hosted externally - no local DB commands available"
	@echo ""

# Initial setup
setup:
	@echo "🔧 Setting up Music Library project..."
	@if [ ! -f .env ]; then \
		echo "📝 Creating .env file..."; \
		cp .env.example .env; \
		echo "⚠️  Please edit .env file with your configuration"; \
	fi
	@chmod +x docker-manager.sh
	@chmod +x start.sh
	@chmod +x stop.sh
	@echo "✅ Setup complete!"

# Build Docker images
build:
	@echo "🐳 Building Docker images..."
	./docker-manager.sh build

# Start services (production)
start:
	@echo "🚀 Starting Music Library (production)..."
	./docker-manager.sh start production

# Start services (development)
start-dev:
	@echo "🚀 Starting Music Library (development)..."
	./docker-manager.sh start development

# Stop services
stop:
	@echo "🛑 Stopping Music Library..."
	./docker-manager.sh stop

# Restart services
restart:
	@echo "🔄 Restarting Music Library..."
	./docker-manager.sh restart

# Show status
status:
	@echo "📊 Service Status:"
	./docker-manager.sh status

# Show logs
logs:
	@echo "📝 Showing logs for all services..."
	./docker-manager.sh logs

# Show bot logs
logs-bot:
	@echo "🤖 Showing Telegram bot logs..."
	./docker-manager.sh logs telegram-bot

# Show backend logs
logs-api:
	@echo "🔧 Showing backend API logs..."
	./docker-manager.sh logs backend

# Show frontend logs
logs-web:
	@echo "🌐 Showing frontend logs..."
	./docker-manager.sh logs frontend

# Clean up Docker resources
clean:
	@echo "🧹 Cleaning up Docker resources..."
	./docker-manager.sh cleanup

# Update services
update:
	@echo "📦 Updating services..."
	./docker-manager.sh update

# Docker-specific commands
docker-build:
	@echo "🐳 Building Docker images..."
	docker compose build

docker-up:
	@echo "🐳 Starting with Docker Compose..."
	docker compose up -d

docker-up-dev:
	@echo "🐳 Starting development environment..."
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

docker-down:
	@echo "🐳 Stopping Docker services..."
	docker compose down

docker-logs:
	@echo "🐳 Showing Docker logs..."
	docker compose logs -f

# Install dependencies locally
install:
	@echo "📦 Installing dependencies..."
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Installing bot dependencies..."
	cd telegram-bot && npm install
	@echo "✅ All dependencies installed!"

# Local development (without Docker)
start-local:
	@echo "🚀 Starting local development..."
	./start.sh

stop-local:
	@echo "🛑 Stopping local development..."
	./stop.sh

# Test commands
test:
	@echo "🧪 Running tests..."
	@echo "Testing bot configuration..."
	cd telegram-bot && npm run test
	@echo "✅ Tests complete!"

test-bot:
	@echo "🤖 Testing Telegram bot configuration..."
	cd telegram-bot && npm run test

# Quick development setup
dev-setup: setup install
	@echo "🎯 Development setup complete!"
	@echo "You can now run: make start-dev"

# Production deployment
deploy: setup build start
	@echo "🎉 Production deployment complete!"
	@echo "Services available at:"
	@echo "  🌐 Web: http://localhost"
	@echo "  🔧 API: http://localhost:3000"
	@echo "  🤖 Bot: Active in Telegram"
	@echo "  🗄️ Database: External (configured in .env)"

# Health check
health:
	@echo "🏥 Checking service health..."
	@curl -s http://localhost:3000/api/terms > /dev/null && echo "✅ Backend: OK" || echo "❌ Backend: Failed"
	@curl -s http://localhost > /dev/null && echo "✅ Frontend: OK" || echo "❌ Frontend: Failed"
	@docker compose ps | grep -q "Up" && echo "✅ Docker: OK" || echo "❌ Docker: Failed"

# Show environment info
info:
	@echo "🎵 Music Library Project Information"
	@echo "==================================="
	@echo "Project: Music Library Management System"
	@echo "Version: 1.0.0"
	@echo ""
	@echo "Services:"
	@echo "  📱 Frontend: Vue.js 3 + PWA"
	@echo "  🔧 Backend: Node.js + Express"
	@echo "  🤖 Bot: Telegraf (Telegram)"
	@echo "  🗄️  Database: MySQL 8.0"
	@echo "  ☁️  Storage: WebDAV"
	@echo ""
	@echo "Development:"
	@echo "  🐳 Docker: $(shell docker --version 2>/dev/null || echo 'Not installed')"
	@echo "  📦 Node.js: $(shell node --version 2>/dev/null || echo 'Not installed')"
	@echo "  📊 NPM: $(shell npm --version 2>/dev/null || echo 'Not installed')"
	@echo ""

# View project structure
tree:
	@echo "🌳 Project Structure:"
	@tree -I 'node_modules|.git|dist|build' -L 3 2>/dev/null || \
	 find . -type d -name "node_modules" -prune -o -type d -name ".git" -prune -o -type f -print | \
	 head -30 | sed 's|./||' | sort

# Container shell access
shell-backend:
	@echo "🔧 Opening backend container shell..."
	docker compose exec backend sh

shell-frontend:
	@echo "🌐 Opening frontend container shell..."
	docker compose exec frontend sh

shell-bot:
	@echo "🤖 Opening bot container shell..."
	docker compose exec telegram-bot sh

# Note: Database is external - use your database provider's tools for access