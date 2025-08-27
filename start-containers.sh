#!/bin/bash

echo "Starting Docker containers..."

# Создаем сеть для контейнеров
echo "Ensuring Docker network 'library-network' is ready..."
docker network rm library-network 2>/dev/null || true # Удаляем сеть, если она существует, игнорируем ошибки
docker network create library-network # Создаем сеть

# Запускаем backend контейнер
echo "Starting backend container..."
docker run -d \
  --name library-backend \
  --network library-network \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file ./backend/.env \
  library-backend:latest

# Запускаем frontend контейнер
echo "Starting frontend container..."
docker run -d \
  --name library-frontend \
  --network library-network \
  --restart unless-stopped \
  -p 80:80 \
  library-frontend:latest

echo ""
echo "Containers started successfully!"
echo ""
echo "Frontend available at: http://localhost"
echo "Backend API available at: http://localhost:3000"
echo ""
echo "Container status:"
docker ps | grep library
