#!/bin/bash

echo "Stopping Docker containers..."

# Останавливаем и удаляем контейнеры
echo "Stopping and removing containers..."
docker stop library-frontend library-backend 2>/dev/null || echo "Some containers were not running"
docker rm library-frontend library-backend 2>/dev/null || echo "Some containers were not found"

echo ""
echo "Containers stopped and removed successfully!"
echo ""
echo "Remaining containers:"
docker ps -a | grep library || echo "No library containers found"
