# 🎵 Музыкальная библиотека

Комплексная система для управления библиотекой нот и музыкальных терминов для валторны, включающая веб-сайт и Telegram бот.

## 📋 Структура проекта

```
music-library/
├── backend/              # Backend API (Node.js)
├── telegram-bot/         # Telegram бот (Python + Aiogram)
├── files/               # Библиотека нот (PDF файлы)
├── Makefile            # Команды для управления проектом
├── setup-telegram-bot.sh # Скрипт настройки бота
└── docker-compose.yml   # Docker конфигурация
```

## 🚀 Быстрый старт

### Полная настройка

```bash
# Настройка проекта
make setup

# Установка зависимостей
make install

# Запуск всех сервисов
make start-local
```

### Только Telegram бот

```bash
# Автоматическая настройка бота
./setup-telegram-bot.sh

# Или вручную:
make setup-telegram-bot
make install-telegram-bot
make dev-telegram-bot
```

## 🏗️ Компоненты системы

### 🔧 Backend API (Node.js)
- **Технологии**: Node.js, Express, MySQL
- **Функции**: API для работы с нотами, авторизация, поиск
- **Порт**: 3000
- **Документация**: `backend/README.md`

### 🤖 Telegram Bot (Python)
- **Технологии**: Python 3.11+, Aiogram 3.x, SQLite
- **Функции**: Полный доступ к библиотеке через Telegram
- **Документация**: `telegram-bot/README.md`

### 📁 Файловая система
- **Формат**: Иерархическая структура папок с PDF файлами
- **Организация**: Категория → Подкатегория → Композитор → Произведение
- **Объем**: 8,534 PDF файлов, 1,684 композитора

## 🎯 Функциональность

### Общие возможности
- 🔍 **Умный поиск** с исправлением опечаток
- 📚 **Каталогизация** по композиторам и категориям
- 📖 **Музыкальные термины** с определениями
- 👤 **Личные коллекции** для зарегистрированных пользователей
- 📄 **Просмотр PDF** файлов нот

### Telegram Bot
- 🔐 **Авторизация** через уникальные коды
- 📤 **Отправка файлов** прямо в чат
- 🎵 **Адаптированный UI/UX** для мобильных устройств
- ⚡ **Быстрый доступ** к избранным произведениям

## 📊 Статистика библиотеки

- **Всего категорий**: 12
- **Всего композиторов**: 1,684
- **Всего PDF файлов**: 8,534
- **Директорий**: 7,063

### Основные категории
- Jazz
- Sonata
- Пьесы (786 композиторов)
- С оркестром (119 композиторов)
- Ансамбли валторн (495 композиторов)
- Крупная форма (149 композиторов)
- И другие...

## ⚙️ Установка и настройка

### Системные требования

**Backend:**
- Node.js 18+
- MySQL 8.0+
- npm/yarn

**Telegram Bot:**
- Python 3.11+
- pip
- SQLite (входит в Python)

**Docker:**
- Docker Engine 20.0+
- Docker Compose 2.0+

### Настройка переменных окружения

**Backend (.env):**
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=music_user
DB_PASSWORD=music_password
DB_NAME=music_library
JWT_SECRET=your_jwt_secret
```

**Telegram Bot (.env):**
```env
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
BACKEND_API_URL=http://localhost:3000/api
```

## 🐳 Docker развертывание

```bash
# Запуск всех сервисов
docker-compose up -d

# Или по отдельности
docker-compose up backend
docker-compose up telegram-bot
```

## 📖 Команды Makefile

### Основные команды
```bash
make help                # Справка по командам
make setup              # Первоначальная настройка
make install            # Установка зависимостей
make start-local        # Запуск в режиме разработки
make stop-local         # Остановка сервисов
make health             # Проверка состояния
```

### Backend команды
```bash
make start-backend      # Запуск только backend
make logs-backend       # Логи backend
make populate-db        # Заполнение БД из файлов
```

### Telegram Bot команды
```bash
make setup-telegram-bot     # Настройка бота
make install-telegram-bot   # Установка зависимостей бота
make dev-telegram-bot       # Запуск бота в dev режиме
make logs-telegram-bot      # Логи бота
```

### Утилиты
```bash
make clean              # Очистка временных файлов
make test               # Запуск тестов
make status             # Статус процессов
make restart            # Перезапуск всех сервисов
```

## 🔧 Разработка

### Архитектура

**Backend API:**
- RESTful API с OpenAPI документацией
- Middleware для авторизации и логирования
- Умный поиск с поддержкой опечаток
- Файловый менеджер для PDF файлов

**Telegram Bot:**
- Модульная архитектура с разделением на слои
- Middleware для авторизации и логирования
- Интеграция с Backend API через HTTP
- Локальное кеширование для производительности

### Тестирование

```bash
# Тесты Backend
cd backend && npm test

# Проверка конфигурации Telegram Bot
cd telegram-bot && python check_config.py
```

## 📚 Документация

- **Backend API**: `backend/README.md`
- **Telegram Bot**: `telegram-bot/README.md`
- **Wiki проекта**: `Wiki` (требования и спецификации)

## 🤝 Получение токена для Telegram бота

1. Найдите @BotFather в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям для создания бота
4. Получите токен и добавьте в `.env` файл
5. Настройте команды бота через @BotFather

## 🐛 Решение проблем

### Общие проблемы

**Backend не запускается:**
- Проверьте настройки БД в `.env`
- Убедитесь, что MySQL запущен
- Проверьте порт 3000

**Telegram Bot не отвечает:**
- Проверьте токен в `.env`
- Убедитесь, что Backend API доступен
- Проверьте логи: `make logs-telegram-bot`

**Файлы не загружаются:**
- Проверьте права доступа к папке `files/`
- Убедитесь в корректности путей в БД

### Логи и отладка

```bash
# Проверка состояния всех сервисов
make health

# Просмотр логов
make logs-backend
make logs-telegram-bot

# Проверка конфигурации бота
cd telegram-bot && python check_config.py
```

## 📄 Лицензия

MIT License - см. LICENSE файл для деталей.

## 👥 Команда разработки

Музыкальная библиотека для валторны - специализированная система для музыкантов и педагогов.

---

**🎵 Добро пожаловать в мир музыки! 🎵**