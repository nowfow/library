# Music Library Project

Проект музыкальной библиотеки с Vue.js frontend и Node.js backend.

## Архитектура

- **Frontend:** Vue.js (SPA, PWA) с Vite
- **Backend:** Node.js + Express
- **База данных:** MySQL
- **Файлы:** WebDAV (cloud.mail.ru)

## Быстрый запуск

### Автоматический запуск (рекомендуется)

```bash
# Запуск всего проекта
./start.sh

# Остановка всех процессов
./stop.sh
```

### Ручной запуск

#### 1. Backend
```bash
cd backend
npm install
npm run dev
```

#### 2. Frontend (в новом терминале)
```bash
cd frontend
npm install
npm run dev
```

## Порты

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3000

## Требования

- Node.js (версия 16 или выше)
- npm
- MySQL база данных (настроена отдельно)

## Структура проекта

```
library/
├── frontend/          # Vue.js приложение
│   ├── src/          # Исходный код
│   ├── package.json  # Зависимости frontend
│   └── vite.config.js
├── backend/           # Node.js сервер
│   ├── src/          # Исходный код
│   └── package.json  # Зависимости backend
├── start.sh          # Скрипт запуска
├── stop.sh           # Скрипт остановки
└── README.md         # Этот файл
```

## Переменные окружения

### Backend (.env в папке backend)
```env
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database
WEBDAV_URL=https://webdav.yandex.ru
WEBDAV_USERNAME=your_username
WEBDAV_PASSWORD=your_password
```

### Frontend (.env в папке frontend)
```env
VITE_API_URL=http://localhost:3000
```

## Разработка

### Frontend
- Vue.js 3 с Composition API
- Vue Router для навигации
- Tailwind CSS для стилей
- Axios для HTTP запросов
- PWA поддержка

### Backend
- Express.js сервер
- MySQL2 для работы с базой данных
- WebDAV клиент для работы с файлами
- CORS поддержка

## Команды

```bash
# Установка зависимостей
cd frontend && npm install
cd backend && npm install

# Сборка для продакшена
cd frontend && npm run build

# Просмотр собранного frontend
cd frontend && npm run preview
``` 