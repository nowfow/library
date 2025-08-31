# Music Library Project Makefile
# Convenient commands for local development and deployment

.PHONY: help setup install start-local stop-local test

# Default target
help:
	@echo "🎵 Music Library Project Management"
	@echo "=================================="
	@echo ""
	@echo "Available commands:"
	@echo "  setup       - Initial project setup"
	@echo "  install     - Install dependencies locally"
	@echo "  start-local - Start local development"
	@echo "  stop-local  - Stop local development"
	@echo "  test        - Run tests"
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
	@echo "✅ Setup complete!"

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
	@echo "You can now run: make start-local"

# Production deployment
deploy: setup install start-local
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
	@echo "  📦 Node.js: $(shell node --version 2>/dev/null || echo 'Not installed')"
	@echo "  📊 NPM: $(shell npm --version 2>/dev/null || echo 'Not installed')"
	@echo ""

# View project structure
tree:
	@echo "🌳 Project Structure:"
	@tree -I 'node_modules|.git|dist|build' -L 3 2>/dev/null || \
	 find . -type d -name "node_modules" -prune -o -type d -name ".git" -prune -o -type f -print | \
	 head -30 | sed 's|./||' | sort

# Note: Database is external - use your database provider's tools for access