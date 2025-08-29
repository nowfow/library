#!/bin/bash

# Stop Telegram Bot script for Music Library

echo "🛑 Stopping Music Library Telegram Bot..."

# Check if PID file exists
if [ -f "telegram-bot.pid" ]; then
    BOT_PID=$(cat telegram-bot.pid)
    
    # Check if process is running
    if ps -p $BOT_PID > /dev/null 2>&1; then
        echo "🔄 Stopping bot process (PID: $BOT_PID)..."
        kill $BOT_PID
        
        # Wait for graceful shutdown
        sleep 3
        
        # Force kill if still running
        if ps -p $BOT_PID > /dev/null 2>&1; then
            echo "💥 Force stopping bot process..."
            kill -9 $BOT_PID
        fi
        
        echo "✅ Telegram bot stopped successfully"
    else
        echo "⚠️  Bot process not found (PID: $BOT_PID)"
    fi
    
    # Remove PID file
    rm telegram-bot.pid
else
    echo "⚠️  No PID file found. Bot may not be running."
fi

# Kill any remaining node processes related to the bot
echo "🧹 Cleaning up any remaining bot processes..."
pkill -f "telegram-bot/src/index.js" 2>/dev/null || true

echo "🏁 Bot shutdown complete!"