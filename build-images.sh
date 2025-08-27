#!/bin/bash

echo "Building Docker images..."

# Сборка backend образа
echo "Building backend image..."
cd backend
docker build -t library-backend:latest .
cd ..

# Сборка frontend образа
echo "Building frontend image..."
cd frontend
docker build -t library-frontend:latest .
cd ..

echo "All images built successfully!"
echo ""
echo "Available images:"
docker images | grep library
