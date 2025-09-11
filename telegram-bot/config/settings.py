"""
Конфигурация Telegram бота для музыкальной библиотеки
"""

import os
from typing import List
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()


class Settings:
    """Настройки бота"""
    
    # Telegram Bot настройки
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
    BOT_NAME: str = os.getenv("BOT_NAME", "MusicLibraryBot")
    BOT_USERNAME: str = os.getenv("BOT_USERNAME", "@music_library_bot")
    
    # Backend API настройки
    BACKEND_API_URL: str = os.getenv("BACKEND_API_URL", "http://localhost:3000/api")
    BACKEND_API_KEY: str = os.getenv("BACKEND_API_KEY", "")
    
    # База данных
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///bot_cache.db")
    
    # Логирование
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE: str = os.getenv("LOG_FILE", "logs/bot.log")
    
    # Файлы
    MAX_FILE_SIZE: str = os.getenv("MAX_FILE_SIZE", "50MB")
    ALLOWED_EXTENSIONS: List[str] = os.getenv("ALLOWED_EXTENSIONS", "pdf,mp3,sib,mus").split(",")
    
    # Кеширование
    CACHE_EXPIRE_TIME: int = int(os.getenv("CACHE_EXPIRE_TIME", "3600"))
    ENABLE_CACHE: bool = os.getenv("ENABLE_CACHE", "true").lower() == "true"
    
    # Администраторы
    ADMIN_IDS: List[int] = [
        int(admin_id) for admin_id in os.getenv("ADMIN_IDS", "").split(",") 
        if admin_id.strip().isdigit()
    ]
    
    # Функции
    ENABLE_FILE_DOWNLOAD: bool = os.getenv("ENABLE_FILE_DOWNLOAD", "true").lower() == "true"
    ENABLE_COLLECTIONS: bool = os.getenv("ENABLE_COLLECTIONS", "true").lower() == "true"
    ENABLE_SMART_SEARCH: bool = os.getenv("ENABLE_SMART_SEARCH", "true").lower() == "true"
    
    @classmethod
    def validate(cls) -> None:
        """Проверка обязательных настроек"""
        if not cls.TELEGRAM_BOT_TOKEN:
            raise ValueError("TELEGRAM_BOT_TOKEN не указан")
        
        if not cls.BACKEND_API_URL:
            raise ValueError("BACKEND_API_URL не указан")
    
    @classmethod
    def get_max_file_size_bytes(cls) -> int:
        """Конвертация размера файла в байты"""
        size_str = cls.MAX_FILE_SIZE.upper()
        
        if size_str.endswith("KB"):
            return int(size_str[:-2]) * 1024
        elif size_str.endswith("MB"):
            return int(size_str[:-2]) * 1024 * 1024
        elif size_str.endswith("GB"):
            return int(size_str[:-2]) * 1024 * 1024 * 1024
        else:
            return int(size_str)


# Экземпляр настроек
settings = Settings()

# Проверяем настройки при импорте
settings.validate()