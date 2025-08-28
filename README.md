# 🎵 Music Library - Complete Digital Music Management System

A comprehensive full-stack music library management system with web interface, REST API, and Telegram bot integration. Perfect for managing personal music collections with advanced search, file browsing, and multi-platform access.

## 🏗️ System Architecture

### Core Components

- **🌐 Frontend**: Vue.js 3 SPA with PWA support
- **🔧 Backend**: Node.js + Express REST API  
- **🗄️ Database**: External MySQL server
- **☁️ File Storage**: WebDAV integration (Yandex, cloud.mail.ru)
- **🤖 Telegram Bot**: Search and navigation via Telegram
- **🐳 Docker**: Full containerization with Docker Compose

### Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Frontend  │    │  Telegram Bot   │    │   Mobile PWA    │
│    (Vue.js)     │    │   (Telegraf)    │    │   (Vue + PWA)   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │     Backend API Server    │
                    │      (Node.js/Express)    │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   External MySQL Server   │
                    │   (Composers, Works,      │
                    │    Terms, Collections)    │
                    └───────────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │      WebDAV Storage       │
                    │    (Music Files: PDF,     │
                    │     MP3, SIB, MUS)       │
                    └───────────────────────────┘
```

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Clone and setup
git clone <repository-url>
cd music-library

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start everything with Docker
./docker-manager.sh start production

# Access the application
# Web: http://localhost
# API: http://localhost:3000
# Bot: Active in Telegram
```

### Option 2: Development Mode

```bash
# Start with hot reloading
./docker-manager.sh start development

# Or manually:
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Option 3: Local Development

```bash
# Start all services locally
./start.sh

# Or individual services:
cd backend && npm run dev
cd frontend && npm run dev  
cd telegram-bot && npm run dev
```

## 📦 Project Structure

```
music-library/
├── 🌐 frontend/                 # Vue.js Web Application
│   ├── src/
│   │   ├── components/         # Vue components
│   │   ├── services/          # API integration
│   │   └── App.vue           # Main app component
│   ├── public/               # Static assets & PWA
│   ├── Dockerfile           # Production container
│   ├── Dockerfile.dev       # Development container
│   └── package.json
│
├── 🔧 backend/                  # Node.js API Server
│   ├── src/
│   │   ├── routes/           # API endpoints
│   │   ├── middleware/       # Auth & validation
│   │   ├── db.js            # Database connection
│   │   └── webdav-client.js # File storage
│   ├── Dockerfile
│   └── package.json
│
├── 🤖 telegram-bot/             # Telegram Bot
│   ├── src/
│   │   ├── commands/         # Bot commands
│   │   ├── handlers/         # Callback handlers
│   │   ├── services/         # API integration
│   │   └── utils/           # Utilities & keyboards
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── package.json
│
├── 🐳 Docker Configuration
│   ├── docker-compose.yml       # Main compose file
│   ├── docker-compose.dev.yml   # Development overrides
│   ├── docker-compose.prod.yml  # Production overrides
│   └── docker-manager.sh        # Management script
│
├── 📜 Configuration
│   ├── .env.example            # Environment template
│   ├── start.sh               # Local startup script
│   ├── stop.sh                # Local stop script
│   └── README.md              # This file
│
└── 📚 Documentation
    ├── telegram-bot/README.md  # Bot documentation
    └── DOCKER_README.md        # Docker guide
```

## 🔧 Configuration

### Centralized Environment Configuration

Весь проект использует единый `.env` файл в корневой директории для всех сервисов:

#### Main .env file (project root)
```env
# External Database Configuration (your remote MySQL server)
DB_HOST=your_remote_database_host
DB_PORT=3306
DB_NAME=music_library
DB_USER=your_db_username
DB_PASSWORD=your_db_password

# WebDAV Configuration (required for file storage)
WEBDAV_URL=https://webdav.yandex.ru
WEBDAV_USER=your_webdav_username
WEBDAV_PASSWORD=your_webdav_password

# Telegram Bot Configuration (required for bot functionality)
BOT_TOKEN=your_telegram_bot_token_from_botfather

# Optional: Custom ports (uncomment to override defaults)
# FRONTEND_PORT=80
# BACKEND_PORT=3000

# Development vs Production
COMPOSE_PROJECT_NAME=music-library
```

### Service Configuration

Все сервисы автоматически получают необходимые переменные окружения через Docker Compose:

- **Frontend**: Получает `VITE_API_URL` через Docker Compose
- **Backend**: Получает все DB_* и WEBDAV_* переменные
- **Telegram Bot**: Получает BOT_TOKEN, DB_*, WEBDAV_* и API_BASE_URL

**Примечание**: Больше нет необходимости в отдельных `.env` файлах в папках сервисов.

## 🎯 Features & Capabilities

### 🌐 Web Interface
- **Modern Vue.js 3** with Composition API
- **Progressive Web App** - install on mobile/desktop
- **Responsive Design** - works on all screen sizes
- **Real-time Search** - find composers, works, terms
- **File Management** - browse and download music files
- **Collection Management** - organize personal collections

### 🤖 Telegram Bot
- **Smart Search Commands**:
  - `/search_composer Bach` - find all Bach works
  - `/search_work Sonata` - search by piece title
  - `/search_term chord` - music theory lookup
- **File Navigation** - browse WebDAV with inline keyboards
- **Download Links** - direct access to music files
- **Rich Formatting** - professional message appearance
- **Session Management** - remembers navigation state

### 🔧 Backend API
- **RESTful Endpoints** - `/api/works`, `/api/terms`, `/api/files`
- **Advanced Search** - partial matching, case-insensitive
- **File Streaming** - efficient WebDAV integration
- **Authentication** - JWT-based user sessions
- **Database Optimization** - connection pooling, utf8mb4

### 📁 File Management
- **Multi-format Support**:
  - 📄 **PDF** - sheet music
  - 🎵 **Audio** - MP3, WAV, FLAC
  - 🎼 **Notation** - Sibelius (.sib), Finale (.mus)
  - 📦 **Archives** - ZIP, RAR
- **Cloud Storage** - WebDAV integration
- **Thumbnails** - automatic PDF preview generation
- **Direct Downloads** - secure file access

## 🐳 Docker Deployment

### Production Deployment

```bash
# Quick production start
./docker-manager.sh start production

# Manual production deployment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# View status
./docker-manager.sh status
```

### Development Environment

```bash
# Development with hot reloading
./docker-manager.sh start development

# View logs
./docker-manager.sh logs telegram-bot
```

### Management Commands

```bash
# Build all images
./docker-manager.sh build

# Update services
./docker-manager.sh update

# Backup database
./docker-manager.sh backup

# Clean up resources
./docker-manager.sh cleanup

# Show help
./docker-manager.sh help
```

## 🌐 Service URLs & Access

| Service | URL | Description |
|---------|-----|-------------|
| **Web Frontend** | http://localhost | Main web interface |
| **Backend API** | http://localhost:3000 | REST API endpoints |
| **Database** | External Server | Remote MySQL database |
| **Telegram Bot** | @your_bot_name | Bot in Telegram |

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/works` | GET | Search musical works |
| `/api/works/files` | GET | Get files for work |
| `/api/terms` | GET | All musical terms |
| `/api/terms/search` | GET | Search terms |
| `/api/files/cloud/list` | GET | Browse WebDAV files |
| `/api/files/pdf` | GET | Download file |
| `/api/auth/login` | POST | User authentication |
| `/api/collections` | GET/POST | Manage collections |

## 🛠️ Development

### Technology Stack

**Frontend**:
- Vue.js 3 + Composition API
- Vite (build tool)
- Tailwind CSS + Vuetify
- Vue Router
- Axios
- PWA support

**Backend**:
- Node.js 18+
- Express.js
- MySQL2 (database)
- WebDAV client
- JWT authentication
- CORS support

**Telegram Bot**:
- Telegraf 4.16+ (modern bot framework)
- Rich message formatting
- Inline keyboards
- Session management
- Error handling

**Infrastructure**:
- Docker & Docker Compose
- Nginx (frontend proxy)
- MySQL 8.0
- Alpine Linux (containers)

### Development Setup

1. **Prerequisites**:
   ```bash
   # Required
   Node.js 18+
   Docker & Docker Compose
   Git
   
   # Optional
   MySQL client
   Telegram account
   ```

2. **Clone & Configure**:
   ```bash
   git clone <repository-url>
   cd music-library
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Choose Development Method**:

   **A) Docker Development (Recommended)**:
   ```bash
   ./docker-manager.sh start development
   ```

   **B) Local Development**:
   ```bash
   # Terminal 1: Backend
   cd backend && npm install && npm run dev
   
   # Terminal 2: Frontend  
   cd frontend && npm install && npm run dev
   
   # Terminal 3: Bot
   cd telegram-bot && npm install && npm run dev
   ```

### Adding New Features

1. **New API Endpoint**:
   ```javascript
   // backend/src/routes/newRoute.js
   router.get('/new-endpoint', async (req, res) => {
     // Implementation
   });
   ```

2. **New Bot Command**:
   ```javascript
   // telegram-bot/src/commands/newCommand.js
   export const newCommand = async (ctx) => {
     await ctx.reply('New command!');
   };
   ```

3. **New Frontend Page**:
   ```vue
   <!-- frontend/src/components/NewPage.vue -->
   <template>
     <div>New page content</div>
   </template>
   ```

## 🔐 Security

### Production Security
- **Environment Variables** - no secrets in code
- **Docker Secrets** - secure credential management
- **Non-root Containers** - reduced attack surface
- **Health Checks** - automatic service monitoring
- **JWT Authentication** - secure API access
- **Input Validation** - SQL injection prevention

### Security Checklist
- [ ] Change default passwords
- [ ] Configure HTTPS (production)
- [ ] Set up firewall rules
- [ ] Regular security updates
- [ ] Backup strategy
- [ ] Monitor logs

## 📊 Monitoring & Logs

### Viewing Logs
```bash
# All services
./docker-manager.sh logs

# Specific service
./docker-manager.sh logs telegram-bot
./docker-manager.sh logs backend
./docker-manager.sh logs frontend

# Follow logs in real-time
docker-compose logs -f telegram-bot
```

### Health Checks
```bash
# Service status
./docker-manager.sh status

# Docker health
docker-compose ps

# Manual health check
curl http://localhost:3000/api/terms
```

## 🔧 Troubleshooting

### Common Issues

**🐳 Docker Issues**:
```bash
# Permission denied
sudo chmod +x docker-manager.sh

# Port already in use
docker-compose down
sudo lsof -i :3000  # Find process using port

# Build failures
docker system prune -f  # Clean up
./docker-manager.sh build
```

**🗄️ Database Issues**:
```bash
# Connection refused
docker-compose logs database

# Reset database
docker-compose down -v
docker-compose up database
```

**🤖 Bot Issues**:
```bash
# Bot not responding
docker-compose logs telegram-bot

# Invalid token
echo $BOT_TOKEN  # Check token

# API connection
curl http://localhost:3000/api/terms
```

**🌐 Frontend Issues**:
```bash
# Build failures
docker-compose logs frontend

# API connection
# Check VITE_API_URL in frontend/.env
```

### Performance Optimization

- **Database**: Configure MySQL for your data size
- **WebDAV**: Use CDN for file delivery
- **Frontend**: Enable gzip compression
- **Bot**: Implement rate limiting
- **Docker**: Adjust resource limits

## 📚 Documentation

- **[Telegram Bot Guide](telegram-bot/README.md)** - Detailed bot documentation
- **[Docker Guide](DOCKER_README.md)** - Container deployment
- **[API Documentation](docs/API.md)** - REST API reference
- **[Frontend Guide](frontend/README.md)** - Vue.js development

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎵 Support

For support and questions:
- 📧 Email: support@musiclibrary.com
- 💬 Telegram: @music_library_support
- 🐛 Issues: GitHub Issues
- 📖 Wiki: GitHub Wiki

---

**🎶 Happy Music Management! 🎼** 