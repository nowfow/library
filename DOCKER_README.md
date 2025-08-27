# Docker Setup для Музыкальной Библиотеки

Этот проект упакован в Docker для простого развертывания без использования docker-compose.

## Структура

- `backend/Dockerfile` - Dockerfile для Node.js backend
- `frontend/Dockerfile` - Dockerfile для Vue.js frontend с nginx
- `frontend/nginx.conf` - Конфигурация nginx для frontend
- `build-images.sh` - Скрипт для сборки Docker-образов
- `start-containers.sh` - Скрипт для запуска контейнеров
- `stop-containers.sh` - Скрипт для остановки контейнеров
- `cleanup.sh` - Скрипт для полной очистки

## Требования

- Docker установлен и запущен
- Порты 80 и 3000 свободны

## Быстрый старт

### 1. Сборка образов

```bash
chmod +x build-images.sh
./build-images.sh
```

### 2. Запуск контейнеров

```bash
chmod +x start-containers.sh
./start-containers.sh
```

### 3. Доступ к приложению

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000

## Управление контейнерами

### Остановка контейнеров

```bash
chmod +x stop-containers.sh
./stop-containers.sh
```

### Полная очистка

```bash
chmod +x cleanup.sh
./cleanup.sh
```

## Ручное управление

### Сборка образов вручную

```bash
# Backend
cd backend
docker build -t library-backend:latest .
cd ..

# Frontend
cd frontend
docker build -t library-frontend:latest .
cd ..
```

### Запуск контейнеров вручную

```bash
# Создание сети
docker network create library-network

# Backend
docker run -d \
  --name library-backend \
  --network library-network \
  --restart unless-stopped \
  -p 3000:3000 \
  -e NODE_ENV=production \
  library-backend:latest

# Frontend
docker run -d \
  --name library-frontend \
  --network library-network \
  --restart unless-stopped \
  -p 80:80 \
  library-frontend:latest
```

### Просмотр логов

```bash
# Backend логи
docker logs library-backend

# Frontend логи
docker logs library-frontend

# Следить за логами в реальном времени
docker logs -f library-backend
docker logs -f library-frontend
```

### Вход в контейнер

```bash
# Backend
docker exec -it library-backend sh

# Frontend
docker exec -it library-frontend sh
```

## Конфигурация

### Переменные окружения

Для backend создайте файл `.env` в папке `backend/` с необходимыми переменными:

```env
NODE_ENV=production
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
JWT_SECRET=your-jwt-secret
WEBDAV_URL=your-webdav-url
WEBDAV_USERNAME=your-webdav-username
WEBDAV_PASSWORD=your-webdav-password
```

### Порт nginx

По умолчанию frontend работает на порту 80. Для изменения порта отредактируйте `start-containers.sh` и `frontend/nginx.conf`.

## Мониторинг

### Статус контейнеров

```bash
docker ps | grep library
```

### Использование ресурсов

```bash
docker stats library-backend library-frontend
```

### Размер образов

```bash
docker images | grep library
```

## Troubleshooting

### Проблемы с портами

Если порты 80 или 3000 заняты, измените их в `start-containers.sh`:

```bash
-p 8080:80  # Вместо -p 80:80
-p 3001:3000  # Вместо -p 3000:3000
```

### Проблемы с сетью

```bash
# Проверить сеть
docker network ls | grep library

# Пересоздать сеть
docker network rm library-network
docker network create library-network
```

### Пересборка образов

```bash
# Остановить контейнеры
./stop-containers.sh

# Удалить старые образы
docker rmi library-frontend:latest library-backend:latest

# Пересобрать
./build-images.sh

# Запустить заново
./start-containers.sh
```

## Безопасность

- Контейнеры запускаются с непривилегированными пользователями
- nginx настроен с security headers
- Backend работает в production режиме
- Все контейнеры изолированы в отдельной сети

## Производительность

- nginx настроен с gzip сжатием
- Статические файлы кэшируются на 1 год
- API ответы кэшируются на 1 день
- PWA файлы обновляются ежедневно
