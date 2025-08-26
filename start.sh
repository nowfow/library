#!/bin/bash

# Скрипт запуска проекта Music Library на Ubuntu 22.04 (production)
# - Backend: Node.js (npm start)
# - Frontend: сборка Vite и предпросмотр (vite preview)
# - Логи: сохраняются в ./logs

set -euo pipefail

echo "🎵 Запуск проекта Music Library (Ubuntu 22.04, prod)..."
echo "=================================="

# Проверяем зависимости
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Установите Node.js 18+"
    exit 1
fi
if ! command -v npm &> /dev/null; then
    echo "❌ npm не установлен. Установите npm"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Найден Node.js ${NODE_VERSION}"

# Директория логов
mkdir -p logs
BACKEND_LOG=logs/backend.log
FRONTEND_LOG=logs/frontend.log

# Функция для очистки при выходе
cleanup() {
    echo ""
    echo "🛑 Остановка всех процессов..."
    if [[ -n "${BACKEND_PID:-}" ]]; then kill "$BACKEND_PID" 2>/dev/null || true; fi
    if [[ -n "${FRONTEND_PID:-}" ]]; then kill "$FRONTEND_PID" 2>/dev/null || true; fi
    echo "✅ Проект остановлен"
    exit 0
}

# Корректное завершение по сигналам
trap cleanup SIGINT SIGTERM

# --- Backend ---
echo ""
echo "📦 Установка зависимостей backend..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install --no-audit --no-fund
else
    echo "✅ Зависимости backend уже установлены"
fi

# Запуск backend (production)
echo ""
echo "🚀 Запуск backend (npm start)..."
# Убедимся, что переменные окружения подхвачены из ../.env при необходимости
if [ -f "../.env" ]; then
    set -a
    # shellcheck disable=SC1091
    source ../.env
    set +a
fi

# Запускаем в фоне, вывод в лог
npm run start >> "../$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
echo "✅ Backend запущен (PID: $BACKEND_PID), лог: $BACKEND_LOG"

# --- Frontend ---
echo ""
echo "📦 Установка зависимостей frontend..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install --no-audit --no-fund
else
    echo "✅ Зависимости frontend уже установлены"
fi

# Сборка фронтенда
echo ""
echo "🛠️  Сборка frontend (vite build)..."
npm run build >> "../$FRONTEND_LOG" 2>&1
echo "✅ Сборка завершена"

# Запуск предпросмотра (простой прод-сервер Vite) на 0.0.0.0
FRONTEND_HOST=${FRONTEND_HOST:-0.0.0.0}
FRONTEND_PORT=${FRONTEND_PORT:-5173}

echo ""
echo "🚀 Запуск frontend (vite preview) на ${FRONTEND_HOST}:${FRONTEND_PORT}..."
# В prod лучше отдавать через nginx, но для простоты используем vite preview
npm run preview -- --host "${FRONTEND_HOST}" --port "${FRONTEND_PORT}" >> "../$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend запущен (PID: $FRONTEND_PID), лог: $FRONTEND_LOG"

# Резюме
echo ""
echo "🎉 Проект успешно запущен!"
echo "=================================="
echo "📱 Frontend: http://${FRONTEND_HOST}:${FRONTEND_PORT}"
echo "🔧 Backend: http://0.0.0.0:3000"
echo "🗂 Логи: $BACKEND_LOG, $FRONTEND_LOG"
echo ""
echo "💡 Для остановки нажмите Ctrl+C"
echo ""

# Ожидание завершения любого процесса
wait 