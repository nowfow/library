# Makefile для музыкальной библиотеки Backend

.PHONY: help install dev start test clean setup db-init db-populate logs

# Цвета для вывода
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Показать эту справку
	@echo "$(GREEN)Доступные команды:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Установить зависимости
	@echo "$(GREEN)📦 Установка зависимостей...$(NC)"
	npm install

setup: install ## Полная настройка проекта
	@echo "$(GREEN)🔧 Настройка проекта...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)⚠️  Создание .env файла из примера...$(NC)"; \
		cp .env.example .env; \
		echo "$(RED)❗ Не забудьте настроить .env файл!$(NC)"; \
	fi
	@echo "$(GREEN)✅ Настройка завершена!$(NC)"

dev: ## Запустить сервер в режиме разработки
	@echo "$(GREEN)🚀 Запуск сервера в режиме разработки...$(NC)"
	npm run dev

start: ## Запустить сервер в продакшн режиме
	@echo "$(GREEN)🚀 Запуск сервера в продакшн режиме...$(NC)"
	npm start

test: ## Запустить тесты
	@echo "$(GREEN)🧪 Запуск тестов...$(NC)"
	@if ! curl -s http://localhost:3000/health > /dev/null; then \
		echo "$(RED)❌ Сервер не запущен! Запустите 'make dev' в другом терминале$(NC)"; \
		exit 1; \
	fi
	node test/test.js

db-init: ## Инициализировать таблицы базы данных
	@echo "$(GREEN)🗄️  Инициализация таблиц БД...$(NC)"
	node -e "import('./src/db.js').then(db => db.initializeTables().then(() => process.exit(0)))"

db-populate: ## Заполнить базу данных из файловой структуры
	@echo "$(GREEN)📚 Заполнение базы данных...$(NC)"
	node populate-db.js

clean: ## Очистить кеш и логи
	@echo "$(GREEN)🧹 Очистка...$(NC)"
	rm -rf node_modules
	rm -rf logs
	rm -f *.log

logs: ## Показать логи сервера
	@echo "$(GREEN)📋 Последние логи:$(NC)"
	@if [ -d logs ]; then \
		tail -f logs/all.log; \
	else \
		echo "$(YELLOW)Логи не найдены. Запустите сервер для создания логов.$(NC)"; \
	fi

check-env: ## Проверить переменные окружения
	@echo "$(GREEN)🔍 Проверка переменных окружения:$(NC)"
	@if [ -f .env ]; then \
		echo "$(GREEN)✅ .env файл найден$(NC)"; \
		echo "$(YELLOW)Содержимое .env:$(NC)"; \
		cat .env | grep -v "PASSWORD\|SECRET"; \
	else \
		echo "$(RED)❌ .env файл не найден!$(NC)"; \
		echo "$(YELLOW)Выполните: make setup$(NC)"; \
	fi

status: ## Показать статус сервера
	@echo "$(GREEN)📊 Статус сервера:$(NC)"
	@if curl -s http://localhost:3000/health > /dev/null; then \
		echo "$(GREEN)✅ Сервер запущен$(NC)"; \
		curl -s http://localhost:3000/health | python3 -m json.tool; \
	else \
		echo "$(RED)❌ Сервер не запущен$(NC)"; \
	fi

backup-logs: ## Создать архив логов
	@echo "$(GREEN)📦 Создание архива логов...$(NC)"
	@if [ -d logs ]; then \
		tar -czf logs_backup_$(shell date +%Y%m%d_%H%M%S).tar.gz logs/; \
		echo "$(GREEN)✅ Архив создан$(NC)"; \
	else \
		echo "$(YELLOW)Логи не найдены$(NC)"; \
	fi

restart: ## Перезапустить сервер (требует PM2)
	@echo "$(GREEN)🔄 Перезапуск сервера...$(NC)"
	@if command -v pm2 > /dev/null; then \
		pm2 restart music-library || pm2 start src/index.js --name music-library; \
	else \
		echo "$(RED)❌ PM2 не установлен. Используйте: npm install -g pm2$(NC)"; \
	fi

docker-build: ## Собрать Docker образ
	@echo "$(GREEN)🐳 Сборка Docker образа...$(NC)"
	docker build -t music-library-backend .

docker-run: ## Запустить в Docker
	@echo "$(GREEN)🐳 Запуск в Docker...$(NC)"
	docker run -p 3000:3000 --env-file .env music-library-backend

install-global: ## Установить глобальные инструменты
	@echo "$(GREEN)🌍 Установка глобальных инструментов...$(NC)"
	npm install -g nodemon pm2

# Команды для разработчиков
lint: ## Проверить код на ошибки
	@echo "$(GREEN)🔍 Проверка кода...$(NC)"
	@if command -v eslint > /dev/null; then \
		eslint src/; \
	else \
		echo "$(YELLOW)ESLint не установлен$(NC)"; \
	fi

format: ## Форматировать код
	@echo "$(GREEN)✨ Форматирование кода...$(NC)"
	@if command -v prettier > /dev/null; then \
		prettier --write src/; \
	else \
		echo "$(YELLOW)Prettier не установлен$(NC)"; \
	fi