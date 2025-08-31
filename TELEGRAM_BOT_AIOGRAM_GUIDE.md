# 🤖 Music Library Telegram Bot - Complete Guide with aiogram

## 📋 Overview

Comprehensive documentation for building a Telegram bot using **aiogram 3.x** that provides the same functionality as the Music Library website through intuitive commands and interactive interfaces.

## 🛠 Technology Stack

### Core Technologies
- **aiogram 3.x** - Modern async Telegram Bot framework
- **Python 3.11+** - Programming language
- **asyncio** - Asynchronous programming
- **aiohttp** - HTTP client for API calls
- **aiomysql** - Async MySQL database driver
- **aioredis** - Redis for sessions and caching
- **pydantic** - Data validation and settings

### Additional Libraries
- **python-dotenv** - Environment management
- **Pillow** - Image processing
- **python-magic** - File type detection
- **pytest** - Testing framework

## 🏗 Project Structure

```
telegram-bot-aiogram/
├── app/
│   ├── main.py                    # Bot entry point
│   ├── config/settings.py         # Configuration
│   ├── handlers/
│   │   ├── commands/              # Command handlers
│   │   │   ├── start.py
│   │   │   ├── search.py
│   │   │   ├── browse.py
│   │   │   └── collections.py
│   │   ├── callbacks/             # Callback handlers
│   │   └── messages/              # Message handlers
│   ├── services/
│   │   ├── api_client.py          # Backend API client
│   │   ├── database.py            # Database operations
│   │   └── webdav_client.py       # File storage
│   ├── keyboards/                 # Inline keyboards
│   ├── models/                    # Data models
│   ├── middlewares/               # Bot middlewares
│   └── utils/                     # Utilities
├── requirements.txt
├── .env.example
└── docker-compose.yml
```

## 🚀 Installation & Setup

### 1. Environment Setup
```bash
# Create project
mkdir music-library-bot && cd music-library-bot
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate

# Install dependencies
pip install aiogram[fast] aiohttp aiomysql aioredis pydantic-settings python-dotenv
```

### 2. Environment Configuration (.env)
```env
# Bot Configuration
BOT_TOKEN=your_telegram_bot_token
BOT_USERNAME=your_bot_username

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=music_library
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Redis
REDIS_URL=redis://localhost:6379/0

# Backend API
API_BASE_URL=http://localhost:3000
API_TIMEOUT=30

# WebDAV
WEBDAV_URL=https://webdav.yandex.ru
WEBDAV_USER=your_username
WEBDAV_PASSWORD=your_password

# Features
MAX_SEARCH_RESULTS=50
PAGINATION_SIZE=10
ENABLE_CACHING=true
```

## 🎛 Bot Commands

### Basic Commands
| Command | Description | Example |
|---------|-------------|---------|
| `/start` | Start bot and show menu | `/start` |
| `/help` | Show help information | `/help` |
| `/menu` | Main navigation menu | `/menu` |

### Search Commands
| Command | Description | Example |
|---------|-------------|---------|
| `/search <query>` | Universal search | `/search Beethoven` |
| `/composer <name>` | Search by composer | `/composer Bach` |
| `/work <title>` | Search by work | `/work Moonlight Sonata` |
| `/term <term>` | Search musical terms | `/term allegro` |

### File Management
| Command | Description | Example |
|---------|-------------|---------|
| `/browse` | Browse file directory | `/browse` |
| `/download <path>` | Download file | `/download /bach/invention.pdf` |
| `/recent` | Show recent files | `/recent` |

### Collections
| Command | Description | Example |
|---------|-------------|---------|
| `/collections` | Manage collections | `/collections` |
| `/create <name>` | Create collection | `/create "Piano Music"` |
| `/add <id> <work>` | Add to collection | `/add 1 "Sonata"` |

### Authentication
| Command | Description | Example |
|---------|-------------|---------|
| `/login` | User login | `/login` |
| `/register` | User registration | `/register` |
| `/profile` | View profile | `/profile` |
| `/logout` | Logout | `/logout` |

## 💻 Core Implementation

### 1. Main Bot File (app/main.py)
```python
import asyncio
import logging
from aiogram import Bot, Dispatcher
from aiogram.enums import ParseMode
from aiogram.client.bot import DefaultBotProperties
from aiogram.fsm.storage.redis import RedisStorage

from app.config.settings import settings
from app.handlers import register_handlers
from app.middlewares import register_middlewares

async def main():
    # Initialize bot
    bot = Bot(
        token=settings.BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML)
    )
    
    # Redis storage for FSM
    storage = RedisStorage.from_url(settings.REDIS_URL)
    dp = Dispatcher(storage=storage)
    
    # Register components
    register_middlewares(dp)
    register_handlers(dp)
    
    # Start polling
    await dp.start_polling(bot, skip_updates=True)

if __name__ == "__main__":
    asyncio.run(main())
```

### 2. Settings Configuration (app/config/settings.py)
```python
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    # Bot
    BOT_TOKEN: str = Field(..., description="Telegram Bot Token")
    BOT_USERNAME: str = Field("", description="Bot Username")
    
    # Database
    DB_HOST: str = Field("localhost")
    DB_PORT: int = Field(3306)
    DB_NAME: str = Field("music_library")
    DB_USER: str = Field(...)
    DB_PASSWORD: str = Field(...)
    
    # Redis
    REDIS_URL: str = Field("redis://localhost:6379/0")
    
    # API
    API_BASE_URL: str = Field("http://localhost:3000")
    API_TIMEOUT: int = Field(30)
    
    # WebDAV
    WEBDAV_URL: str = Field(...)
    WEBDAV_USER: str = Field(...)
    WEBDAV_PASSWORD: str = Field(...)
    
    # Features
    MAX_SEARCH_RESULTS: int = Field(50)
    PAGINATION_SIZE: int = Field(10)
    ENABLE_CACHING: bool = Field(True)
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### 3. Search Handler (app/handlers/commands/search.py)
```python
from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup

from app.services.api_client import APIClient
from app.keyboards.inline import SearchKeyboard
from app.utils.formatters import format_search_results

router = Router()

class SearchStates(StatesGroup):
    waiting_for_query = State()

@router.message(Command("search"))
async def cmd_search(message: Message):
    args = message.text.split(maxsplit=1)
    
    if len(args) > 1:
        await perform_search(message, args[1], "universal")
    else:
        await message.answer(
            "🔍 <b>Поиск в музыкальной библиотеке</b>\\n\\n"
            "Введите запрос или выберите тип поиска:",
            reply_markup=SearchKeyboard.get_search_types()
        )

@router.message(Command("composer"))
async def cmd_search_composer(message: Message):
    args = message.text.split(maxsplit=1)
    if len(args) > 1:
        await perform_search(message, args[1], "composer")
    else:
        await message.answer("🎼 Укажите имя композитора")

@router.message(Command("work"))
async def cmd_search_work(message: Message):
    args = message.text.split(maxsplit=1)
    if len(args) > 1:
        await perform_search(message, args[1], "work")
    else:
        await message.answer("🎹 Укажите название произведения")

async def perform_search(message: Message, query: str, search_type: str):
    try:
        await message.bot.send_chat_action(message.chat.id, "typing")
        
        api_client = APIClient()
        
        if search_type == "composer":
            results = await api_client.search_works(composer=query)
            title = f"🎼 Композитор: {query}"
        elif search_type == "work":
            results = await api_client.search_works(work=query)
            title = f"🎹 Произведение: {query}"
        else:  # universal
            works = await api_client.search_works(composer=query)
            works.extend(await api_client.search_works(work=query))
            results = works
            title = f"🔍 Поиск: {query}"
        
        if not results:
            await message.answer(f"❌ По запросу '{query}' ничего не найдено")
            return
        
        formatted_results = format_search_results(results, search_type)
        keyboard = SearchKeyboard.get_results_keyboard(results)
        
        await message.answer(f"{title}\\n\\n{formatted_results}", reply_markup=keyboard)
        
    except Exception as e:
        await message.answer("❌ Ошибка поиска. Попробуйте позже.")
        logging.exception(f"Search error: {e}")
```

### 4. API Client (app/services/api_client.py)
```python
import aiohttp
from typing import List, Dict, Any, Optional
from app.config.settings import settings

class APIClient:
    def __init__(self, jwt_token: Optional[str] = None):
        self.base_url = settings.API_BASE_URL
        self.jwt_token = jwt_token
        self.timeout = aiohttp.ClientTimeout(total=settings.API_TIMEOUT)
    
    @property
    def headers(self):
        headers = {"Content-Type": "application/json"}
        if self.jwt_token:
            headers["Authorization"] = f"Bearer {self.jwt_token}"
        return headers
    
    async def _request(self, method: str, endpoint: str, **kwargs):
        url = f"{self.base_url}{endpoint}"
        
        async with aiohttp.ClientSession(
            timeout=self.timeout, 
            headers=self.headers
        ) as session:
            async with session.request(method, url, **kwargs) as response:
                response.raise_for_status()
                return await response.json()
    
    # Authentication
    async def login_user(self, email: str, password: str):
        return await self._request(
            "POST", "/api/auth/login",
            json={"email": email, "password": password}
        )
    
    # Search
    async def search_works(self, composer: str = None, work: str = None):
        params = {}
        if composer:
            params["composer"] = composer
        if work:
            params["work"] = work
        return await self._request("GET", "/api/works", params=params)
    
    async def search_terms(self, query: str):
        return await self._request("GET", "/api/terms/search", params={"q": query})
    
    # Files
    async def list_cloud_files(self, path: str = "/"):
        return await self._request("GET", "/api/files/cloud/list", params={"path": path})
    
    async def download_file(self, file_path: str):
        return await self._request("GET", "/api/files/pdf", params={"pdf_path": file_path})
    
    # Collections
    async def get_collections(self):
        return await self._request("GET", "/api/collections")
    
    async def create_collection(self, name: str):
        return await self._request("POST", "/api/collections", json={"name": name})
```

### 5. Inline Keyboards (app/keyboards/inline.py)
```python
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.utils.keyboard import InlineKeyboardBuilder

class SearchKeyboard:
    @staticmethod
    def get_search_types():
        builder = InlineKeyboardBuilder()
        builder.row(
            InlineKeyboardButton(text="🎼 Композитор", callback_data="search:composer"),
            InlineKeyboardButton(text="🎹 Произведение", callback_data="search:work")
        )
        builder.row(
            InlineKeyboardButton(text="📖 Термин", callback_data="search:term")
        )
        return builder.as_markup()
    
    @staticmethod
    def get_results_keyboard(results):
        builder = InlineKeyboardBuilder()
        
        for i, result in enumerate(results[:10]):  # Show first 10
            text = f"🎵 {result['composer']} - {result['title']}"
            callback_data = f"work:show:{result['work_id']}"
            builder.row(InlineKeyboardButton(text=text, callback_data=callback_data))
        
        builder.row(
            InlineKeyboardButton(text="🔍 Новый поиск", callback_data="search:new")
        )
        return builder.as_markup()

class MainKeyboard:
    @staticmethod
    def get_main_menu(is_authenticated: bool = False):
        builder = InlineKeyboardBuilder()
        
        builder.row(
            InlineKeyboardButton(text="🔍 Поиск", callback_data="search:start"),
            InlineKeyboardButton(text="📁 Файлы", callback_data="browse:start")
        )
        
        if is_authenticated:
            builder.row(
                InlineKeyboardButton(text="📚 Коллекции", callback_data="collections:list"),
                InlineKeyboardButton(text="📊 Статистика", callback_data="stats:show")
            )
        else:
            builder.row(
                InlineKeyboardButton(text="🔐 Войти", callback_data="auth:login"),
                InlineKeyboardButton(text="📝 Регистрация", callback_data="auth:register")
            )
        
        return builder.as_markup()
```

## 🔧 API Integration

The bot integrates with the Music Library backend API:

### Endpoints Used
- **Authentication**: `/api/auth/login`, `/api/auth/register`
- **Search**: `/api/works`, `/api/terms/search`
- **Files**: `/api/files/cloud/list`, `/api/files/pdf`
- **Collections**: `/api/collections/*`

### Authentication Flow
1. User sends `/login` command
2. Bot requests email/password
3. API call to `/api/auth/login`
4. Store JWT token in user session
5. Include token in subsequent API calls

## 🚀 Quick Start

```bash
# 1. Install dependencies
pip install aiogram[fast] aiohttp aiomysql aioredis pydantic-settings

# 2. Create bot with @BotFather
# Get bot token

# 3. Setup environment
cp .env.example .env
# Edit .env with your settings

# 4. Run bot
python -m app.main
```

## 📋 Command Summary

| Category | Commands | Features |
|----------|----------|----------|
| **Navigation** | `/start`, `/help`, `/menu` | Basic bot navigation |
| **Search** | `/search`, `/composer`, `/work`, `/term` | Comprehensive search |
| **Files** | `/browse`, `/download`, `/recent` | File management |
| **Collections** | `/collections`, `/create`, `/add`, `/remove` | Personal collections |
| **Auth** | `/login`, `/register`, `/profile`, `/logout` | User management |
| **Info** | `/stats`, `/usage` | Statistics and analytics |

This bot provides a complete Telegram interface for the Music Library with intuitive commands, interactive keyboards, and seamless API integration using modern aiogram framework.