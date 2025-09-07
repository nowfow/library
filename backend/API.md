# API Documentation - Музыкальная библиотека

## Общая информация

Backend API для музыкальной библиотеки нот валторны. Система предоставляет RESTful API для управления произведениями, терминами, пользователями и коллекциями.

**Base URL:** `http://localhost:3000/api`

## Аутентификация

API использует JWT токены для аутентификации. Токен должен быть включен в заголовок `Authorization` в формате:
```
Authorization: Bearer <token>
```

## Эндпоинты

### Аутентификация (/api/auth)

#### POST /api/auth/register
Регистрация нового пользователя.

**Запрос:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Имя Пользователя"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Пользователь успешно зарегистрирован",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "Имя Пользователя",
      "role": "user"
    },
    "token": "jwt_token_here"
  }
}
```

#### POST /api/auth/login
Вход в систему.

**Запрос:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### GET /api/auth/me
Получение информации о текущем пользователе. Требует аутентификации.

### Произведения (/api/works)

#### GET /api/works
Получение списка произведений с пагинацией и фильтрацией.

**Параметры запроса:**
- `page` (number): Номер страницы (по умолчанию 1)
- `limit` (number): Количество элементов на странице (по умолчанию 20, максимум 100)
- `category` (string): Фильтр по категории
- `composer` (string): Фильтр по композитору
- `file_type` (string): Фильтр по типу файла (pdf, mp3, sib, mus)

**Пример:** `/api/works?page=1&limit=20&category=Sonata&composer=Mozart`

#### GET /api/works/search
Поиск произведений.

**Параметры запроса:**
- `q` (string): Поисковый запрос
- `page`, `limit`: Параметры пагинации

#### GET /api/works/categories
Получение списка всех категорий.

#### GET /api/works/composers
Получение списка всех композиторов.

**Параметры запроса:**
- `category` (string): Фильтр композиторов по категории

#### GET /api/works/:id
Получение информации о конкретном произведении.

### Термины (/api/terms)

#### GET /api/terms
Получение списка терминов с пагинацией.

**Параметры запроса:**
- `page`, `limit`: Параметры пагинации
- `search` (string): Поиск по термину или определению

#### POST /api/terms
Создание нового термина. Требует права администратора.

**Запрос:**
```json
{
  "term": "Валторна",
  "definition": "Медный духовой музыкальный инструмент..."
}
```

#### PUT /api/terms/:id
Обновление термина. Требует права администратора.

#### DELETE /api/terms/:id
Удаление термина. Требует права администратора.

#### GET /api/terms/stats
Получение статистики по терминам.

### Файлы (/api/files)

#### GET /api/files/browse
Просмотр файловой структуры.

**Параметры запроса:**
- `path` (string): Путь для просмотра (по умолчанию корень)

#### GET /api/files/download/:workId
Скачивание файла произведения.

#### GET /api/files/search
Поиск файлов.

**Параметры запроса:**
- `q` (string): Поисковый запрос
- `type` (string): Тип файла

#### GET /api/files/stats
Статистика файлов.

### Коллекции (/api/collections)

#### GET /api/collections
Получение коллекций пользователя. Требует аутентификации.

**Параметры запроса:**
- `public` (boolean): Показать только публичные коллекции

#### POST /api/collections
Создание новой коллекции. Требует аутентификации.

**Запрос:**
```json
{
  "name": "Моя коллекция",
  "description": "Описание коллекции",
  "is_public": false
}
```

#### GET /api/collections/:id
Получение конкретной коллекции.

#### PUT /api/collections/:id
Обновление коллекции. Требует права владельца.

#### DELETE /api/collections/:id
Удаление коллекции. Требует права владельца.

#### POST /api/collections/:id/works
Добавление произведения в коллекцию.

**Запрос:**
```json
{
  "work_id": 123
}
```

#### DELETE /api/collections/:id/works/:workId
Удаление произведения из коллекции.

#### GET /api/collections/:id/works
Получение произведений коллекции.

## Служебные эндпоинты

### GET /health
Проверка состояния сервера.

**Ответ:**
```json
{
  "status": "healthy",
  "timestamp": "2023-12-07T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "development",
  "database": "connected",
  "uptime": 3600
}
```

### GET /api
Информация об API и доступных эндпоинтах.

## Коды ответов

- **200** - Успешный запрос
- **201** - Ресурс создан
- **400** - Ошибка валидации или неверный запрос
- **401** - Не авторизован
- **403** - Доступ запрещен
- **404** - Ресурс не найден
- **409** - Конфликт (дублирование данных)
- **500** - Внутренняя ошибка сервера

## Формат ответов

### Успешный ответ
```json
{
  "success": true,
  "message": "Описание результата",
  "data": {
    // Данные ответа
  },
  "timestamp": "2023-12-07T10:30:00.000Z"
}
```

### Ответ с пагинацией
```json
{
  "success": true,
  "message": "Данные получены успешно",
  "data": [
    // Массив элементов
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 10,
    "total_items": 200,
    "items_per_page": 20,
    "has_next": true,
    "has_prev": false
  },
  "timestamp": "2023-12-07T10:30:00.000Z"
}
```

### Ответ с ошибкой
```json
{
  "success": false,
  "error": "Описание ошибки",
  "details": "Дополнительные детали ошибки",
  "timestamp": "2023-12-07T10:30:00.000Z"
}
```

### Ошибка валидации
```json
{
  "success": false,
  "error": "Ошибка валидации",
  "validation_errors": [
    {
      "field": "email",
      "message": "Неверный формат email"
    }
  ],
  "timestamp": "2023-12-07T10:30:00.000Z"
}
```

## Ограничения

- **Rate Limiting:** 1000 запросов за 15 минут с одного IP
- **Размер запроса:** Максимум 10MB
- **Пагинация:** Максимум 100 элементов на страницу
- **Поиск:** Минимум 2 символа для поискового запроса

## Примеры использования

### Получение произведений определенного композитора
```bash
curl -X GET "http://localhost:3000/api/works?composer=Mozart&page=1&limit=10" \
  -H "Authorization: Bearer your_token_here"
```

### Поиск произведений
```bash
curl -X GET "http://localhost:3000/api/works/search?q=концерт&page=1" \
  -H "Authorization: Bearer your_token_here"
```

### Создание коллекции
```bash
curl -X POST "http://localhost:3000/api/collections" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{
    "name": "Любимые концерты",
    "description": "Коллекция любимых концертов для валторны",
    "is_public": true
  }'
```

### Добавление произведения в коллекцию
```bash
curl -X POST "http://localhost:3000/api/collections/1/works" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{"work_id": 123}'
```

## Переменные окружения

Обязательные переменные для работы API:

```env
# База данных
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=music_library

# JWT
JWT_SECRET=your_super_secret_key

# Файлы
FILES_PATH=../files

# Сервер
PORT=3000
NODE_ENV=production
```

## Установка и запуск

1. Установка зависимостей:
```bash
npm install
```

2. Настройка переменных окружения:
```bash
cp .env.example .env
# Отредактируйте .env файл
```

3. Инициализация базы данных:
```bash
npm run db:init
```

4. Заполнение данными:
```bash
npm run db:populate
```

5. Запуск сервера:
```bash
npm run dev  # Для разработки
npm start    # Для продакшена
```

6. Тестирование:
```bash
npm test
```