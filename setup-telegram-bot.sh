#!/bin/bash

# Telegram Bot Setup Script for Music Library

echo "🎵 Настройка Telegram Bot для музыкальной библиотеки 🎵"
echo "=================================================="

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Функция для печати сообщений
print_message() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Проверка Python
echo -e "\n🐍 Проверка Python..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    print_message "Python $PYTHON_VERSION найден"
    
    # Проверка версии Python (требуется >=3.11)
    if python3 -c "import sys; exit(0 if sys.version_info >= (3, 11) else 1)"; then
        print_message "Версия Python подходит (>=3.11)"
    else
        print_error "Требуется Python 3.11 или выше. Текущая версия: $PYTHON_VERSION"
        exit 1
    fi
else
    print_error "Python3 не найден. Установите Python 3.11+"
    exit 1
fi

# Проверка pip
echo -e "\n📦 Проверка pip..."
if command -v pip3 &> /dev/null; then
    print_message "pip найден"
else
    print_error "pip не найден. Установите pip"
    exit 1
fi

# Переход в директорию telegram-bot
cd telegram-bot || {
    print_error "Директория telegram-bot не найдена"
    exit 1
}

# Создание виртуального окружения
echo -e "\n🏗️  Создание виртуального окружения..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    print_message "Виртуальное окружение создано"
else
    print_warning "Виртуальное окружение уже существует"
fi

# Активация виртуального окружения
echo -e "\n⚡ Активация виртуального окружения..."
source venv/bin/activate
print_message "Виртуальное окружение активировано"

# Обновление pip
echo -e "\n⬆️  Обновление pip..."
pip install --upgrade pip

# Установка зависимостей
echo -e "\n📥 Установка зависимостей..."
pip install -r requirements.txt
print_message "Зависимости установлены"

# Создание .env файла
echo -e "\n⚙️  Настройка конфигурации..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    print_message ".env файл создан"
    print_warning "Отредактируйте .env файл и добавьте TELEGRAM_BOT_TOKEN"
    print_warning "Получить токен можно у @BotFather в Telegram"
else
    print_warning ".env файл уже существует"
fi

# Создание директорий
echo -e "\n📁 Создание необходимых директорий..."
mkdir -p data logs
print_message "Директории созданы"

# Проверка конфигурации
echo -e "\n🔍 Проверка конфигурации..."
if python -c "from config.settings import settings; settings.validate()" 2>/dev/null; then
    print_message "Базовая конфигурация в порядке"
else
    print_warning "Конфигурация требует внимания. Проверьте .env файл"
fi

# Финальные инструкции
echo -e "\n🎉 Настройка завершена!"
echo -e "\n📋 Следующие шаги:"
echo -e "1. Отредактируйте файл ${YELLOW}.env${NC} и добавьте токен бота"
echo -e "2. Убедитесь, что Backend API запущен (${YELLOW}make start-backend${NC})"
echo -e "3. Запустите бот: ${YELLOW}make dev-telegram-bot${NC}"
echo -e "\n💡 Полезные команды:"
echo -e "   ${YELLOW}make setup-telegram-bot${NC}     - повторная настройка"
echo -e "   ${YELLOW}make install-telegram-bot${NC}   - переустановка зависимостей"
echo -e "   ${YELLOW}make dev-telegram-bot${NC}       - запуск в режиме разработки"
echo -e "   ${YELLOW}make logs-telegram-bot${NC}      - просмотр логов"

echo -e "\n🔗 Получение токена бота:"
echo -e "1. Найдите @BotFather в Telegram"
echo -e "2. Отправьте команду /newbot"
echo -e "3. Следуйте инструкциям и получите токен"
echo -e "4. Добавьте токен в .env файл: TELEGRAM_BOT_TOKEN=ваш_токен"

print_message "Все готово! 🚀"