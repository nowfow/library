# Музыкальная библиотека - Telegram бот

Telegram бот для поиска и скачивания нот валторны с интеграцией с Backend API.

## Функциональность

- 🔐 **Авторизация**: Регистрация и вход через уникальный код
- 🔍 **Поиск**: Умный поиск композиторов, произведений и терминов
- 📚 **Коллекции**: Управление личными коллекциями нот
- 📄 **Ноты**: Просмотр и скачивание PDF файлов прямо в чат
- 🎵 **Термины**: Поиск музыкальных терминов
- ⚙️ **Настройки**: Управление профилем пользователя

## Технологии

- **Python 3.8+**
- **Aiogram 3.x** - Асинхронный фреймворк для Telegram ботов
- **aiohttp** - HTTP клиент для взаимодействия с Backend API
- **SQLite** - Локальная база данных для кеширования
- **Docker** - Контейнеризация

## Установка и запуск

### Локальная разработка

1. Установка зависимостей:
```bash
pip install -r requirements.txt
```

2. Настройка переменных окружения:
```bash
cp .env.example .env
# Отредактируйте .env файл
```

3. Запуск бота:
```bash
python bot.py
```

### Docker

1. Сборка образа:
```bash
docker build -t music-library-bot .
```

2. Запуск контейнера:
```bash
docker run --env-file .env music-library-bot
```

### Docker Compose

```bash
docker-compose up telegram-bot
```

## Конфигурация

Основные переменные окружения:

```env
# Telegram Bot Token
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Backend API
BACKEND_API_URL=http://localhost:3000/api
BACKEND_API_KEY=optional_api_key

# База данных
DATABASE_URL=sqlite:///bot_cache.db

# Логирование
LOG_LEVEL=INFO
```

## Структура проекта

```
telegram-bot/
├── bot.py              # Точка входа
├── config/
│   ├── __init__.py
│   ├── settings.py     # Конфигурация
│   └── database.py     # Настройка БД
├── handlers/
│   ├── __init__.py
│   ├── auth.py         # Авторизация
│   ├── search.py       # Поиск
│   ├── collections.py  # Коллекции
│   ├── files.py        # Работа с файлами
│   ├── terms.py        # Термины
│   └── settings.py     # Настройки
├── keyboards/
│   ├── __init__.py
│   ├── inline.py       # Inline клавиатуры
│   └── reply.py        # Reply клавиатуры
├── middleware/
│   ├── __init__.py
│   ├── auth.py         # Middleware авторизации
│   └── logging.py      # Логирование
├── services/
│   ├── __init__.py
│   ├── api_client.py   # Клиент для Backend API
│   ├── auth_service.py # Сервис авторизации
│   └── cache_service.py # Кеширование
├── utils/
│   ├── __init__.py
│   ├── formatters.py   # Форматирование сообщений
│   └── validators.py   # Валидация данных
├── models/
│   ├── __init__.py
│   └── user.py         # Модели пользователя
├── requirements.txt
├── Dockerfile
├── .env.example
└── README.md
```

## Команды бота

### Основные команды
- `/start` - Начало работы с ботом
- `/help` - Помощь по командам
- `/login` - Авторизация в системе
- `/logout` - Выход из системы
- `/profile` - Просмотр профиля

### Поиск
- `/search <запрос>` - Поиск произведений
- `/composer <имя>` - Поиск по композитору
- `/term <термин>` - Поиск термина
- `/categories` - Список категорий

### Коллекции
- `/collections` - Мои коллекции
- `/create_collection <название>` - Создать коллекцию
- `/add_to_collection` - Добавить в коллекцию

## API Интеграция

Бот использует Backend API для:
- Авторизации пользователей
- Поиска произведений и терминов
- Управления коллекциями
- Скачивания файлов

Все запросы к API проходят через сервисный слой с обработкой ошибок и кешированием.