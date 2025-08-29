#!/bin/bash

# Telegram Bot startup script for Music Library
# This script starts the Telegram bot along with the main application

echo "🤖 Starting Music Library Telegram Bot..."

# Check if we're in the correct directory
if [ ! -d "telegram-bot" ]; then
    echo "❌ Error: telegram-bot directory not found!"
    echo "Make sure you're running this script from the library root directory"
    exit 1
fi

# Check if .env file exists in telegram-bot directory
if [ ! -f "telegram-bot/.env" ]; then
    echo "❌ Error: telegram-bot/.env file not found!"
    echo "Please copy telegram-bot/.env.example to telegram-bot/.env and configure it"
    exit 1
fi

# Check if node_modules exists in telegram-bot directory
if [ ! -d "telegram-bot/node_modules" ]; then
    echo "📦 Installing bot dependencies..."
    cd telegram-bot
    npm install
    cd ..
fi

# Function to start telegram bot in background
start_telegram_bot() {
    echo "🚀 Starting Telegram bot..."
    cd telegram-bot
    npm run dev &
    BOT_PID=$!
    cd ..
    echo "✅ Telegram bot started with PID: $BOT_PID"
    echo $BOT_PID > telegram-bot.pid
}

# Function to check if backend is running
check_backend() {
    if curl -s http://localhost:3000/api/terms > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Start the telegram bot
start_telegram_bot

# Wait a moment for the bot to initialize
sleep 2

# Check if bot started successfully
if ps -p $BOT_PID > /dev/null 2>&1; then
    echo "✅ Telegram bot is running successfully!"
    echo "🎵 Bot is ready to help users search the music library"
    echo ""
    echo "📊 Bot Status:"
    echo "  • PID: $BOT_PID"
    echo "  • Backend API: http://localhost:3000"
    echo "  • Bot logs: telegram-bot/logs"
    echo ""
    echo "To stop the bot, run: ./stop-bot.sh"
else
    echo "❌ Failed to start Telegram bot"
    exit 1
fi

echo "🎭 Telegram Bot is now active and listening for commands!"