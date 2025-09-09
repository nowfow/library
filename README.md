# 🎵 Музыкальная библиотека

Простая система для управления музыкальными файлами с веб-интерфейсом и Telegram ботом.

## 🚀 Быстрый запуск

1. **Настройка переменных окружения:**
   ```bash
   # Отредактируйте .env файл с параметрами вашей удаленной MySQL базы данных
   nano .env
   ```

2. **Запуск всей системы:**
   ```bash
   docker compose up -d
   ```

3. **Первый запуск:**
   При первом запуске система автоматически:
   - Создаст все необходимые таблицы в базе данных
   - Импортирует музыкальные термины из `files/terms.csv` в базу данных
   - Настроит начальные данные (пользователи, категории, композиторы)

4. **Доступ к сервисам:**
   - Frontend: http://localhost
   - Backend API: http://localhost:3000
   - Здоровье системы: http://localhost:3000/health

## 📋 Структура базы данных

Система автоматически создает следующие таблицы при первом запуске:

- `composers` - композиторы
- `categories` - категории произведений
- `works` - музыкальные произведения
- `users` - пользователи системы
- `collections` - пользовательские коллекции
- `collection_items` - элементы коллекций
- `terms` - музыкальные термины
- `files` - информация о файлах

Также автоматически импортируются музыкальные термины из `files/terms.csv` в таблицу `terms`.

## Управление

```bash
# Запуск
docker-compose up -d

# Остановка
docker-compose down

# Логи
docker-compose logs -f

# Перезапуск
docker-compose restart

# Обновление
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Конфигурация

Основные настройки в `.env`:
- `DB_NAME` - имя базы данных
- `DB_USER` - пользователь БД
- `DB_PASSWORD` - пароль БД
- `JWT_SECRET` - секрет для JWT токенов
- `TELEGRAM_BOT_TOKEN` - токен Telegram бота

## Файлы

- Музыкальные файлы: `./files/`
- Загрузки: `./uploads/`
- База данных: автоматически в Docker volume

## 📋 Структура проекта

```
music-library/
├── backend/              # Backend API (Node.js)
├── telegram-bot/         # Telegram бот (Python + Aiogram)
├── files/               # Библиотека нот (PDF файлы)
└── docker-compose.yml   # Docker конфигурация
```

## 🐳 Docker развертывание

```bash
# Запуск всех сервисов
docker-compose up -d

# Или по отдельности
docker-compose up backend
docker-compose up telegram-bot
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
docker-compose ps

# Просмотр логов
docker-compose logs backend
docker-compose logs telegram-bot

# Проверка конфигурации бота
cd telegram-bot && python check_config.py
```

## 📄 Лицензия

MIT License - см. LICENSE файл для деталей.

## 👥 Команда разработки

Музыкальная библиотека для валторны - специализированная система для музыкантов и педагогов.

---

**🎵 Добро пожаловать в мир музыки! 🎵**