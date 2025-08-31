from pydantic_settings import BaseSettings
from pydantic import Field
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings(BaseSettings):
    """Bot configuration settings"""
    
    # Bot Configuration
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
    
    # Backend API
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
        case_sensitive = True

# Global settings instance
settings = Settings()