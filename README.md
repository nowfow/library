# 🎵 Music Library

Система управления персональной коллекцией музыки с веб-интерфейсом, PWA и Telegram-ботом.

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

### Prerequisites

```
# Required
Node.js 18+
MySQL Database (external)
WebDAV storage account

# Optional  
Telegram account (for bot)
```

### Option 1: Local Development

```bash
# Clone repository
git clone <repository-url>
cd music-library

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Install dependencies
make install

# Start all services
make start-local
```

### Option 2: Individual Services

```bash
# Start backend only
cd backend && npm run dev

# Start frontend only  
cd frontend && npm run dev

# Start bot only
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
│   └── package.json
│
├── 🔧 backend/                  # Node.js API Server
│   ├── src/
│   │   ├── routes/           # API endpoints
│   │   ├── middleware/       # Auth & validation
│   │   ├── db.js            # Database connection
│   │   └── webdav-client.js # File storage
│   └── package.json
│
├── 🤖 telegram-bot/             # Telegram Bot
│   ├── src/
│   │   ├── commands/         # Bot commands
│   │   ├── handlers/         # Callback handlers
│   │   ├── services/         # API integration
│   │   └── utils/           # Utilities & keyboards
│   └── package.json
│
├── 📜 Configuration
│   ├── .env.example            # Environment template
│   ├── start.sh               # Local startup script
│   ├── stop.sh                # Local stop script
│   ├── Makefile               # Build automation
│   └── README.md              # This file
│
└── 📚 Documentation
    └── telegram-bot/README.md  # Bot documentation
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

```

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
- Node.js local runtime
- MySQL 8.0 (external)
- WebDAV cloud storage

### Development Setup

1. **Prerequisites**:
   ```bash
   # Required
   Node.js 18+
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

3. **Local Development**:
   ```bash
   # Install all dependencies
   make install
   
   # Start all services
   make start-local
   
   # Or individual services:
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
```
# Check application logs in terminal outputs or log files
# Backend logs: see terminal running backend
# Frontend logs: see browser developer console
# Bot logs: see terminal running bot
```

### Health Checks
```bash
# Manual health check
curl http://localhost:3000/api/terms
```

## 🔧 Troubleshooting

### Common Issues

**🗄️ Database Issues**:
```bash
# Connection refused - check your .env database settings
# Verify DB_HOST, DB_PORT, DB_USER, DB_PASSWORD
```

**🤖 Bot Issues**:
```bash
# Bot not responding - check BOT_TOKEN in .env
# API connection - verify backend is running on port 3000
curl http://localhost:3000/api/terms
```

**🌐 Frontend Issues**:
```bash
# Build failures - check Node.js version (18+ required)
# API connection - verify VITE_API_URL points to backend
```

### Performance Optimization

- **Database**: Configure MySQL for your data size
- **WebDAV**: Use CDN for file delivery
- **Frontend**: Enable gzip compression
- **Bot**: Implement rate limiting

## 📚 Documentation

- **[Telegram Bot Guide](telegram-bot/README.md)** - Detailed bot documentation

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