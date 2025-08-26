#!/bin/bash

# Скрипт для остановки проекта Music Library (Ubuntu 22.04)
# Останавливает процессы backend и frontend аккуратно (TERM → KILL)

set -euo pipefail

echo "🛑 Остановка проекта Music Library..."
echo "=================================="

# Порты можно переопределить переменными окружения
FRONTEND_PORT=${FRONTEND_PORT:-5173}
BACKEND_PORT=${BACKEND_PORT:-3000}

_kill_pids_gracefully() {
    local pids="$1"
    local label="$2"
    if [ -z "$pids" ]; then
        echo "ℹ️  $label процессы не найдены"
        return 0
    fi
    echo "🛑 Остановка $label (TERM)..."
    kill $pids 2>/dev/null || true
    sleep 1
    # Проверяем, остались ли живые
    local still_alive
    still_alive=$(ps -o pid= -p $pids 2>/dev/null || true)
    if [ -n "$still_alive" ]; then
        echo "⚠️  Не все $label завершились, отправляю KILL..."
        kill -9 $pids 2>/dev/null || true
    fi
    echo "✅ $label остановлены"
}

_pids_by_port() {
    local port="$1"
    # Предпочтительно lsof, если нет — используем ss/grep
    if command -v lsof >/dev/null 2>&1; then
        lsof -ti:"$port" 2>/dev/null || true
    else
        ss -ltnp 2>/dev/null | awk -v p=":$port" '$4 ~ p {print $6}' | sed -E 's/.*pid=([0-9]+).*/\1/' | tr '\n' ' ' || true
    fi
}

echo "🔍 Поиск процессов на портах $BACKEND_PORT (backend) и $FRONTEND_PORT (frontend)..."
FRONTEND_PIDS=$(_pids_by_port "$FRONTEND_PORT")
BACKEND_PIDS=$(_pids_by_port "$BACKEND_PORT")

_kill_pids_gracefully "$FRONTEND_PIDS" "frontend (порт $FRONTEND_PORT)"
_kill_pids_gracefully "$BACKEND_PIDS" "backend (порт $BACKEND_PORT)"

# Дополнительно останавливаем по имени процессов (vite preview, node, nodemon)
VITE_PIDS=$(pgrep -f "vite preview" 2>/dev/null || true)
NODEMON_PIDS=$(pgrep -f "nodemon" 2>/dev/null || true)

if [ -n "${VITE_PIDS:-}" ]; then
    _kill_pids_gracefully "$VITE_PIDS" "vite preview"
fi
if [ -n "${NODEMON_PIDS:-}" ]; then
    _kill_pids_gracefully "$NODEMON_PIDS" "nodemon"
fi

echo ""
echo "✅ Все процессы проекта остановлены!"
echo "=================================="