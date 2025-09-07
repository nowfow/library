# Makefile для музыкальной библиотеки

.PHONY: help setup install start-local stop-local test deploy health info clean

# Переменные
BACKEND_DIR = backend
FRONTEND_DIR = frontend
TELEGRAM_BOT_DIR = telegram-bot

# Цвета для вывода
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
NC = \033[0m # No Color

# По умолчанию показываем help
help: ## Показать справку по командам
	@echo "${GREEN}Музыкальная библиотека - Система управления${NC}"
	@echo "${YELLOW}Доступные команды:${NC}"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  ${GREEN}%-15s${NC} %s\n", $$1, $$2}' $(MAKEFILE_LIST)

setup: ## Первоначальная настройка проекта
	@echo "${GREEN}🔧 Настройка проекта...${NC}"
	@if [ ! -f $(BACKEND_DIR)/.env ]; then \
		echo "📝 Создание .env файла для backend..."; \
		cp $(BACKEND_DIR)/.env.example $(BACKEND_DIR)/.env; \
		echo "${YELLOW}⚠️  Не забудьте отредактировать $(BACKEND_DIR)/.env${NC}"; \
	fi
	@if [ -d $(TELEGRAM_BOT_DIR) ] && [ ! -f $(TELEGRAM_BOT_DIR)/.env ]; then \
		echo "📝 Создание .env файла для telegram bot..."; \
		cp $(TELEGRAM_BOT_DIR)/.env.example $(TELEGRAM_BOT_DIR)/.env; \
		echo "${YELLOW}⚠️  Не забудьте отредактировать $(TELEGRAM_BOT_DIR)/.env${NC}"; \
	fi
	@echo "${GREEN}✅ Настройка завершена${NC}"

install: ## Установка всех зависимостей
	@echo "${GREEN}📦 Установка зависимостей...${NC}"
	@echo "🔧 Backend зависимости..."
	@cd $(BACKEND_DIR) && npm install
	@if [ -d $(FRONTEND_DIR) ]; then \
		echo "🎨 Frontend зависимости..."; \
		cd $(FRONTEND_DIR) && npm install; \
	fi
	@if [ -d $(TELEGRAM_BOT_DIR) ]; then \
		echo "🤖 Telegram Bot зависимости..."; \
		cd $(TELEGRAM_BOT_DIR) && pip install -r requirements.txt; \
	fi
	@echo "${GREEN}✅ Все зависимости установлены${NC}"

start-local: ## Запуск всех сервисов в режиме разработки
	@echo "${GREEN}🚀 Запуск сервисов в режиме разработки...${NC}"
	@echo "🔧 Запуск Backend..."
	@cd $(BACKEND_DIR) && npm run dev &
	@sleep 3
	@if [ -d $(FRONTEND_DIR) ]; then \
		echo "🎨 Запуск Frontend..."; \
		cd $(FRONTEND_DIR) && npm run dev & \
	fi
	@if [ -d $(TELEGRAM_BOT_DIR) ]; then \
		echo "🤖 Запуск Telegram Bot..."; \
		cd $(TELEGRAM_BOT_DIR) && python bot.py & \
	fi
	@echo "${GREEN}✅ Все сервисы запущены${NC}"
	@echo "${YELLOW}📊 Backend: http://localhost:3000${NC}"
	@echo "${YELLOW}🎨 Frontend: http://localhost:5173${NC}"
	@echo "${YELLOW}🔍 Используйте 'make health' для проверки статуса${NC}"

stop-local: ## Остановка всех локальных сервисов
	@echo "${GREEN}🛑 Остановка локальных сервисов...${NC}"
	@pkill -f "nodemon" || true
	@pkill -f "vite" || true
	@pkill -f "node.*dev" || true
	@pkill -f "python.*bot.py" || true
	@echo "${GREEN}✅ Все сервисы остановлены${NC}"

start-backend: ## Запуск только backend
	@echo "${GREEN}🔧 Запуск Backend...${NC}"
	@cd $(BACKEND_DIR) && npm run dev

start-frontend: ## Запуск только frontend
	@echo "${GREEN}🎨 Запуск Frontend...${NC}"
	@if [ -d $(FRONTEND_DIR) ]; then \
		cd $(FRONTEND_DIR) && npm run dev; \
	else \
		echo "${RED}❌ Frontend директория не найдена${NC}"; \
	fi

start-bot: ## Запуск только Telegram bot
	@echo "${GREEN}🤖 Запуск Telegram Bot...${NC}"
	@if [ -d $(TELEGRAM_BOT_DIR) ]; then \
		cd $(TELEGRAM_BOT_DIR) && python bot.py; \
	else \
		echo "${RED}❌ Telegram Bot директория не найдена${NC}"; \
	fi

health: ## Проверка состояния сервисов
	@echo "${GREEN}🔍 Проверка состояния сервисов...${NC}"
	@echo "🔧 Backend Health Check:"
	@curl -s http://localhost:3000/health | jq '.' 2>/dev/null || curl -s http://localhost:3000/health || echo "${RED}❌ Backend недоступен${NC}"
	@echo ""
	@echo "🎨 Frontend проверка:"
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 2>/dev/null | grep -q "200" && echo "${GREEN}✅ Frontend доступен${NC}" || echo "${RED}❌ Frontend недоступен${NC}"

info: ## Показать информацию о проекте
	@echo "${GREEN}📊 Информация о проекте${NC}"
	@echo "${YELLOW}Backend:${NC}"
	@if [ -f $(BACKEND_DIR)/package.json ]; then \
		cd $(BACKEND_DIR) && node -e "const pkg=require('./package.json'); console.log('  Версия:', pkg.version); console.log('  Node.js:', process.version);"; \
	fi
	@echo "${YELLOW}Сервисы:${NC}"
	@echo "  🔧 Backend: http://localhost:3000"
	@echo "  📊 API Docs: http://localhost:3000/api"
	@echo "  🔍 Health: http://localhost:3000/health"
	@if [ -d $(FRONTEND_DIR) ]; then \
		echo "  🎨 Frontend: http://localhost:5173"; \
	fi
	@echo "${YELLOW}Файлы:${NC}"
	@echo "  📁 Музыкальные файлы: files/"
	@echo "  🗄️  База данных: см. .env файл"

test: ## Запуск тестов
	@echo "${GREEN}🧪 Запуск тестов...${NC}"
	@echo "🔧 Тестирование Backend..."
	@cd $(BACKEND_DIR) && npm test
	@if [ -d $(FRONTEND_DIR) ] && [ -f $(FRONTEND_DIR)/package.json ]; then \
		echo "🎨 Тестирование Frontend..."; \
		cd $(FRONTEND_DIR) && npm test; \
	fi
	@echo "${GREEN}✅ Тесты завершены${NC}"

populate-db: ## Заполнение базы данных из файловой структуры
	@echo "${GREEN}🗄️ Заполнение базы данных...${NC}"
	@cd $(BACKEND_DIR) && node populate-db.js
	@echo "${GREEN}✅ База данных заполнена${NC}"

import-terms: ## Импорт терминов из CSV файла
	@echo "${GREEN}📚 Импорт терминов из files/terms.csv...${NC}"
	@cd $(BACKEND_DIR) && node import-terms.js ../files/terms.csv
	@echo "${GREEN}✅ Термины импортированы${NC}"

check-terms: ## Проверка файла terms.csv
	@echo "${GREEN}🔍 Проверка файла terms.csv...${NC}"
	@node check-terms.js

clean: ## Очистка node_modules и временных файлов
	@echo "${GREEN}🧹 Очистка проекта...${NC}"
	@echo "🔧 Очистка Backend..."
	@cd $(BACKEND_DIR) && rm -rf node_modules package-lock.json
	@if [ -d $(FRONTEND_DIR) ]; then \
		echo "🎨 Очистка Frontend..."; \
		cd $(FRONTEND_DIR) && rm -rf node_modules package-lock.json dist; \
	fi
	@if [ -d $(TELEGRAM_BOT_DIR) ]; then \
		echo "🤖 Очистка Telegram Bot..."; \
		cd $(TELEGRAM_BOT_DIR) && rm -rf __pycache__ *.pyc .pytest_cache; \
	fi
	@echo "${GREEN}✅ Очистка завершена${NC}"

logs-backend: ## Показать логи backend
	@echo "${GREEN}📋 Логи Backend:${NC}"
	@tail -f $(BACKEND_DIR)/logs/*.log 2>/dev/null || echo "${YELLOW}Логи в реальном времени в консоли разработки${NC}"

deploy: ## Подготовка к деплою
	@echo "${GREEN}🚀 Подготовка к деплою...${NC}"
	@echo "🔧 Сборка Backend..."
	@cd $(BACKEND_DIR) && npm ci --production
	@if [ -d $(FRONTEND_DIR) ]; then \
		echo "🎨 Сборка Frontend..."; \
		cd $(FRONTEND_DIR) && npm ci && npm run build; \
	fi
	@if [ -d $(TELEGRAM_BOT_DIR) ]; then \
		echo "🤖 Подготовка Telegram Bot..."; \
		cd $(TELEGRAM_BOT_DIR) && pip install -r requirements.txt; \
	fi
	@echo "${GREEN}✅ Проект готов к деплою${NC}"

dev-full: setup install start-local ## Полная настройка и запуск для разработки

# Проверка статуса процессов
status: ## Показать статус запущенных процессов
	@echo "${GREEN}📊 Статус процессов:${NC}"
	@echo "${YELLOW}Backend процессы:${NC}"
	@pgrep -f "nodemon.*backend" && echo "✅ Backend запущен" || echo "❌ Backend не запущен"
	@echo "${YELLOW}Frontend процессы:${NC}"
	@pgrep -f "vite.*frontend" && echo "✅ Frontend запущен" || echo "❌ Frontend не запущен"
	@echo "${YELLOW}Bot процессы:${NC}"
	@pgrep -f "python.*bot.py" && echo "✅ Bot запущен" || echo "❌ Bot не запущен"

# Быстрый перезапуск
restart: stop-local start-local ## Быстрый перезапуск всех сервисов

# Telegram Bot специфичные команды
setup-telegram-bot: ## Настройка Telegram бота
	@echo "${GREEN}🤖 Настройка Telegram бота...${NC}"
	@if [ ! -f $(TELEGRAM_BOT_DIR)/.env ]; then \
		cp $(TELEGRAM_BOT_DIR)/.env.example $(TELEGRAM_BOT_DIR)/.env; \
		echo "${YELLOW}⚠️  Отредактируйте $(TELEGRAM_BOT_DIR)/.env и добавьте TELEGRAM_BOT_TOKEN${NC}"; \
	else \
		echo "${GREEN}✅ .env файл уже существует${NC}"; \
	fi

install-telegram-bot: ## Установка зависимостей Telegram бота
	@echo "${GREEN}🤖 Установка зависимостей Telegram бота...${NC}"
	@cd $(TELEGRAM_BOT_DIR) && pip install -r requirements.txt
	@echo "${GREEN}✅ Зависимости Telegram бота установлены${NC}"

dev-telegram-bot: ## Запуск Telegram бота в режиме разработки
	@echo "${GREEN}🤖 Запуск Telegram бота в режиме разработки...${NC}"
	@cd $(TELEGRAM_BOT_DIR) && python bot.py

logs-telegram-bot: ## Показать логи Telegram бота
	@echo "${GREEN}📋 Логи Telegram бота:${NC}"
	@tail -f $(TELEGRAM_BOT_DIR)/bot.log 2>/dev/null || echo "${YELLOW}Логи в реальном времени в консоли разработки${NC}"