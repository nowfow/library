#!/bin/bash

echo "Cleaning up Docker resources..."

# Останавливаем и удаляем контейнеры
echo "Stopping and removing containers..."
docker stop library-frontend library-backend 2>/dev/null || echo "Some containers were not running"
docker rm library-frontend library-backend 2>/dev/null || echo "Some containers were not found"

# Удаляем образы
echo "Removing images..."
docker rmi library-frontend:latest library-backend:latest 2>/dev/null || echo "Some images were not found"

# Удаляем сеть
echo "Removing network..."
docker network rm library-network 2>/dev/null || echo "Network was not found"

echo ""
echo "Cleanup completed successfully!"
echo ""
echo "Remaining Docker resources:"
docker images | grep library || echo "No library images found"
docker ps -a | grep library || echo "No library containers found"
docker network ls | grep library || echo "No library networks found"
