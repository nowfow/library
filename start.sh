#!/bin/bash

# Скрипт для запуска проекта Music Library
# Запускает frontend (Vue.js) и backend (Node.js) одновременно

set -e  # Остановить выполнение при ошибке

echo "🎵 Запуск проекта Music Library..."
echo "=================================="

# Проверяем, установлен ли Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Пожалуйста, установите Node.js"
    exit 1
fi

# Проверяем, установлен ли npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm не установлен. Пожалуйста, установите npm"
    exit 1
fi

echo "✅ Node.js и npm найдены"

# Функция для очистки при выходе
cleanup() {1.
    echo ""
    echo "🛑 Остановка всех процессов..."
    kill $FRONTEND_PID $BACKEND_PID 2>/dev/null || true
    echo "✅ Проект остановлен"
    exit 0
}

# Устанавливаем обработчик сигналов для корректного завершения
trap cleanup SIGINT SIGTERM

# Устанавливаем зависимости для backend
echo ""
echo "📦 Установка зависимостей backend..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ Зависимости backend уже установлены"
fi

# Устанавливаем зависимости для frontend
echo ""
echo "📦 Установка зависимостей frontend..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ Зависимости frontend уже установлены"
fi

# Запускаем backend в фоне
echo ""
echo "🚀 Запуск backend (Node.js + Express)..."
cd ../backend
npm run dev &
BACKEND_PID=$!
echo "✅ Backend запущен (PID: $BACKEND_PID)"

# Ждем немного, чтобы backend успел запуститься
sleep 2

# Запускаем frontend в фоне
echo ""
echo "🚀 Запуск frontend (Vue.js + Vite)..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend запущен (PID: $FRONTEND_PID)"

echo ""
echo "🎉 Проект успешно запущен!"
echo "=================================="
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:3000"
echo ""
echo "💡 Для остановки нажмите Ctrl+C"
echo ""

# Ждем завершения любого из процессов
wait 