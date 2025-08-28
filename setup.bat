@echo off
setlocal EnableDelayedExpansion

:: Music Library Quick Setup Script for Windows
:: This script helps new users get started quickly on Windows

echo.
echo 🎵 Music Library Quick Setup
echo ==========================
echo.

:: Check prerequisites
echo ℹ️  Checking prerequisites...

:: Check Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker Desktop first:
    echo    https://docs.docker.com/desktop/windows/
    pause
    exit /b 1
)

:: Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

:: Check Docker Compose
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not available. Please ensure Docker Desktop is properly installed.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

:: Create .env file if not exists
if not exist ".env" (
    echo ℹ️  Creating .env configuration file...
    copy .env.example .env >nul
    echo ⚠️  Please edit .env file with your actual configuration!
    echo.
    echo Required settings:
    echo   - BOT_TOKEN: Get from @BotFather in Telegram
    echo   - DB_ROOT_PASSWORD: Set a secure database password
    echo   - DB_PASSWORD: Set a secure user password
    echo   - WEBDAV_URL: Your WebDAV storage URL
    echo   - WEBDAV_USER: Your WebDAV username
    echo   - WEBDAV_PASSWORD: Your WebDAV password
    echo.
    
    pause
)

:: Choose setup method
echo.
echo 🎵 Setup Options
echo 1. Full Docker setup (recommended for production)
echo 2. Development setup with hot reloading
echo 3. Local development (without Docker)
echo 4. Just show me the commands
echo.

set /p choice="Choose option (1-4): "

if "%choice%"=="1" (
    echo 🎵 Full Docker Setup (Production)
    echo ℹ️  Building Docker images...
    docker-compose build
    
    echo ℹ️  Starting services...
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    
    echo ✅ Setup complete!
) else if "%choice%"=="2" (
    echo 🎵 Development Setup with Hot Reloading
    echo ℹ️  Building Docker images...
    docker-compose build
    
    echo ℹ️  Starting development environment...
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
    
    echo ✅ Development setup complete!
) else if "%choice%"=="3" (
    echo 🎵 Local Development Setup
    
    :: Check Node.js
    node --version >nul 2>&1
    if errorlevel 1 (
        echo ❌ Node.js is not installed. Please install Node.js 18+ first:
        echo    https://nodejs.org/
        pause
        exit /b 1
    )
    
    echo ℹ️  Installing dependencies...
    cd backend && npm install && cd ..
    cd frontend && npm install && cd ..
    cd telegram-bot && npm install && cd ..
    
    echo ℹ️  You can now start services manually:
    echo    cd backend && npm run dev
    echo    cd frontend && npm run dev
    echo    cd telegram-bot && npm run dev
    
    echo ✅ Local development setup complete!
) else if "%choice%"=="4" (
    echo 🎵 Quick Command Reference
    echo.
    echo Docker Commands:
    echo   docker-compose up -d                                    # Start services
    echo   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d   # Production
    echo   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d    # Development
    echo   docker-compose down                                     # Stop services
    echo   docker-compose ps                                       # Show status
    echo   docker-compose logs -f [service]                        # Show logs
    echo.
    echo Local Commands:
    echo   cd backend && npm run dev                               # Start backend
    echo   cd frontend && npm run dev                              # Start frontend  
    echo   cd telegram-bot && npm run dev                          # Start bot
) else (
    echo ❌ Invalid option selected
    pause
    exit /b 1
)

echo.
echo 🎵 Service URLs
echo 🌐 Web Interface: http://localhost
echo 🔧 Backend API:   http://localhost:3000
echo 🗄️  Database:      localhost:3306
echo 🤖 Telegram Bot:  Active (search @your_bot_name)

echo.
echo 🎵 Useful Commands
echo View logs:     docker-compose logs -f [service]
echo Stop services: docker-compose down
echo Restart:       docker-compose restart
echo Status:        docker-compose ps

echo.
echo 🎵 Next Steps
echo 1. 📱 Create Telegram bot: Chat with @BotFather
echo 2. 🔧 Configure .env file with your settings
echo 3. 🗄️  Set up your MySQL database
echo 4. ☁️  Configure WebDAV storage
echo 5. 🎵 Start uploading your music collection!

echo.
echo ✅ Music Library setup complete! Enjoy managing your music collection! 🎶
pause