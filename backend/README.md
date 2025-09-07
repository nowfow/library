# Backend музыкальной библиотеки

Backend API для системы управления музыкальной библиотекой нот для валторны.

## 🚀 Функциональность

- **REST API** для управления произведениями, терминами и коллекциями
- **JWT авторизация** и управление пользователями
- **Полнотекстовый поиск** по произведениям и терминам
- **Файловая система** для доступа к PDF файлам нот
- **Пользовательские коллекции** с возможностью создания и управления
- **Статистика и аналитика** библиотеки

## 📋 Требования

- Node.js 18+
- MySQL 8.0+
- npm или yarn

## ⚙️ Установка

1. **Клонирование и переход в директорию:**
```bash
cd backend
```

2. **Установка зависимостей:**
```bash
npm install
```

3. **Настройка окружения:**
```bash
cp .env.example .env
# Отредактируйте .env файл с вашими настройками
```

4. **Создание базы данных:**
```sql
CREATE DATABASE music_library CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

5. **Заполнение базы данных:**
```bash
node populate-db.js
```

## 🔧 Конфигурация

Основные переменные окружения в файле `.env`:

```env
# База данных
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=music_library

# Сервер
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:5173

# Файлы
FILES_PATH=../files
```

## 🏃‍♂️ Запуск

### Режим разработки
```bash
npm run dev
```

### Продакшн режим
```bash
npm start
```

## 📚 API Документация

### Базовый URL
```
http://localhost:3000/api
```

### 🔍 Эндпоинты

#### Health Check
```http
GET /health
```

#### Произведения
```http
GET /api/works                    # Список произведений с фильтрацией
GET /api/works/:id                # Конкретное произведение
GET /api/works/categories         # Список категорий
GET /api/works/composers          # Список композиторов
GET /api/works/search/advanced    # Расширенный поиск
GET /api/works/stats/summary      # Статистика произведений
```

#### Термины
```http
GET /api/terms                    # Список терминов
GET /api/terms/search            # Поиск терминов
GET /api/terms/:id               # Конкретный термин
POST /api/terms                  # Добавление термина
GET /api/terms/stats/summary     # Статистика терминов
```

#### Файлы
```http
GET /api/files/structure         # Структура файлов
GET /api/files/download/:path    # Скачивание файла
GET /api/files/info/:path        # Информация о файле
GET /api/files/search            # Поиск файлов
GET /api/files/stats             # Статистика файлов
```

#### Авторизация
```http
POST /api/auth/register          # Регистрация
POST /api/auth/login             # Вход
GET /api/auth/me                 # Информация о пользователе
PUT /api/auth/profile            # Обновление профиля
POST /api/auth/verify-token      # Проверка токена
POST /api/auth/refresh-token     # Обновление токена
POST /api/auth/logout            # Выход
```

#### Коллекции
```http
GET /api/collections             # Коллекции пользователя
GET /api/collections/public      # Публичные коллекции
POST /api/collections            # Создание коллекции
GET /api/collections/:id         # Конкретная коллекция
PUT /api/collections/:id         # Обновление коллекции
DELETE /api/collections/:id      # Удаление коллекции
POST /api/collections/:id/works  # Добавление произведения
DELETE /api/collections/:id/works/:work_id  # Удаление произведения
```

## 🗄️ Структура базы данных

### Таблицы

#### `works` - Произведения
- `id` - ID произведения
- `category` - Категория (Джаз, Соната, и т.д.)
- `subcategory` - Подкатегория
- `composer` - Композитор
- `work_title` - Название произведения
- `file_path` - Путь к файлу
- `file_type` - Тип файла (pdf, mp3, sib, mus)
- `file_size` - Размер файла
- `pages_count` - Количество страниц (для PDF)

#### `terms` - Музыкальные термины
- `id` - ID термина
- `term` - Термин
- `definition` - Определение

#### `users` - Пользователи
- `id` - ID пользователя
- `email` - Email
- `password_hash` - Хеш пароля
- `name` - Имя
- `role` - Роль (user, admin)
- `is_active` - Активность

#### `user_collections` - Коллекции пользователей
- `id` - ID коллекции
- `user_id` - ID пользователя
- `name` - Название коллекции
- `description` - Описание
- `is_public` - Публичная коллекция

#### `collection_works` - Связь коллекций с произведениями
- `collection_id` - ID коллекции
- `work_id` - ID произведения
- `added_at` - Дата добавления

## 🔒 Авторизация

API использует JWT токены для авторизации. Токен передается в заголовке:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

## 📊 Примеры запросов

### Поиск произведений
```bash
curl "http://localhost:3000/api/works?search=Mozart&category=Концерт&limit=10"
```

### Получение файла
```bash
curl "http://localhost:3000/api/files/download/Концерты/Mozart/Концерт_4.pdf"
```

### Создание коллекции
```bash
curl -X POST "http://localhost:3000/api/collections" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Мои избранные", "description": "Любимые произведения"}'
```

## 🐛 Отладка

### Логи
Все логи выводятся в консоль. В режиме разработки включено детальное логирование запросов.

### Health Check
Проверить состояние API:
```bash
curl http://localhost:3000/health
```

### Статистика
Получить статистику по произведениям:
```bash
curl http://localhost:3000/api/works/stats/summary
```

## 🔧 Разработка

### Структура проекта
```
backend/
├── src/
│   ├── routes/          # Маршруты API
│   │   ├── auth.js      # Авторизация
│   │   ├── works.js     # Произведения
│   │   ├── terms.js     # Термины
│   │   ├── files.js     # Файлы
│   │   └── collections.js # Коллекции
│   ├── db.js           # Подключение к БД
│   └── index.js        # Основной файл сервера
├── populate-db.js      # Скрипт заполнения БД
├── package.json
└── .env.example
```

### Добавление новых эндпоинтов
1. Создайте маршрут в соответствующем файле в `src/routes/`
2. Импортируйте и подключите маршрут в `src/index.js`
3. Добавьте обработку ошибок
4. Обновите документацию

## 🚀 Деплой

1. Установите переменные окружения для продакшена
2. Настройте HTTPS
3. Настройте прокси-сервер (nginx)
4. Запустите с PM2 или аналогом:

```bash
npm install -g pm2
pm2 start src/index.js --name music-library-backend
```

## 📝 Лицензия

MIT License