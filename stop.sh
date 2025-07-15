#!/bin/bash

# Скрипт для остановки проекта Music Library
# Останавливает все процессы frontend и backend

echo "🛑 Остановка проекта Music Library..."
echo "=================================="

# Останавливаем процессы Node.js, связанные с проектом
echo "🔍 Поиск процессов Node.js..."

# Останавливаем процессы на портах 3000 и 5173
FRONTEND_PROCESSES=$(lsof -ti:5173 2>/dev/null || true)
BACKEND_PROCESSES=$(lsof -ti:3000 2>/dev/null || true)

if [ ! -z "$FRONTEND_PROCESSES" ]; then
    echo "🛑 Остановка frontend процессов (порт 5173)..."
    kill -9 $FRONTEND_PROCESSES 2>/dev/null || true
    echo "✅ Frontend процессы остановлены"
else
    echo "ℹ️  Frontend процессы не найдены"
fi

if [ ! -z "$BACKEND_PROCESSES" ]; then
    echo "🛑 Остановка backend процессов (порт 3000)..."
    kill -9 $BACKEND_PROCESSES 2>/dev/null || true
    echo "✅ Backend процессы остановлены"
else
    echo "ℹ️  Backend процессы не найдены"
fi

# Дополнительно ищем процессы nodemon и vite
NODEMON_PROCESSES=$(pgrep -f "nodemon" 2>/dev/null || true)
VITE_PROCESSES=$(pgrep -f "vite" 2>/dev/null || true)

if [ ! -z "$NODEMON_PROCESSES" ]; then
    echo "🛑 Остановка nodemon процессов..."
    kill -9 $NODEMON_PROCESSES 2>/dev/null || true
    echo "✅ Nodemon процессы остановлены"
fi

if [ ! -z "$VITE_PROCESSES" ]; then
    echo "🛑 Остановка vite процессов..."
    kill -9 $VITE_PROCESSES 2>/dev/null || true
    echo "✅ Vite процессы остановлены"
fi

echo ""
echo "✅ Все процессы проекта остановлены!"
echo "==================================" 