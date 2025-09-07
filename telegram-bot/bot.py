"""
Главный файл Telegram бота для музыкальной библиотеки
"""

import asyncio
import sys
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from loguru import logger

# Импорты конфигурации
from config.settings import settings
from config.database import db_manager

# Импорты middleware
from middleware.auth import auth_middleware
from middleware.logging import logging_middleware

# Импорты обработчиков
from handlers import (
    auth_handlers,
    search_handlers,
    collections_handlers,
    files_handlers,
    terms_handlers,
    settings_handlers
)

# Импорты сервисов
from services.api_client import api_client


async def on_startup() -> None:
    """Функция запуска бота"""
    logger.info("🚀 Запуск Telegram бота музыкальной библиотеки")
    
    # Инициализация базы данных
    try:
        await db_manager.init_db()
        logger.info("✅ База данных инициализирована")
    except Exception as e:
        logger.error(f"❌ Ошибка инициализации БД: {e}")
        raise
    
    # Проверка соединения с Backend API
    try:
        health = await api_client.health_check()
        if health and health.get("status") == "healthy":
            logger.info("✅ Backend API доступен")
        else:
            logger.warning("⚠️ Backend API недоступен или нездоров")
    except Exception as e:
        logger.error(f"❌ Ошибка проверки Backend API: {e}")
    
    logger.info("🎉 Бот успешно запущен!")


async def on_shutdown() -> None:
    """Функция остановки бота"""
    logger.info("🛑 Остановка Telegram бота")
    
    # Закрытие соединений
    try:
        await db_manager.close()
        logger.info("✅ База данных закрыта")
    except Exception as e:
        logger.error(f"❌ Ошибка закрытия БД: {e}")
    
    try:
        await api_client.close()
        logger.info("✅ API клиент закрыт")
    except Exception as e:
        logger.error(f"❌ Ошибка закрытия API клиента: {e}")
    
    logger.info("👋 Бот остановлен")


def setup_logging() -> None:
    """Настройка логирования"""
    
    # Удаляем стандартный обработчик
    logger.remove()
    
    # Добавляем консольный обработчик
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
               "<level>{level: <8}</level> | "
               "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
               "<level>{message}</level>",
        level=settings.LOG_LEVEL,
        colorize=True
    )
    
    # Добавляем файловый обработчик
    logger.add(
        settings.LOG_FILE,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} | {message}",
        level=settings.LOG_LEVEL,
        rotation="10 MB",
        retention="7 days",
        compression="zip",
        encoding="utf-8"
    )


def register_handlers(dp: Dispatcher) -> None:
    """Регистрация обработчиков"""
    
    # Регистрируем обработчики по приоритету
    dp.include_router(auth_handlers.router)
    dp.include_router(search_handlers.router)
    dp.include_router(collections_handlers.router)
    dp.include_router(files_handlers.router)
    dp.include_router(terms_handlers.router)
    dp.include_router(settings_handlers.router)
    
    logger.info("✅ Обработчики зарегистрированы")


def register_middleware(dp: Dispatcher) -> None:
    """Регистрация middleware"""
    
    # Middleware должен регистрироваться в правильном порядке
    dp.message.middleware(logging_middleware)
    dp.callback_query.middleware(logging_middleware)
    
    dp.message.middleware(auth_middleware)
    dp.callback_query.middleware(auth_middleware)
    
    logger.info("✅ Middleware зарегистрированы")


async def main() -> None:
    """Главная функция"""
    
    # Настройка логирования
    setup_logging()
    logger.info("🔧 Настройка Telegram бота")
    
    # Создание бота и диспетчера
    bot = Bot(
        token=settings.TELEGRAM_BOT_TOKEN,
        default=DefaultBotProperties(
            parse_mode=ParseMode.HTML,
            disable_web_page_preview=True
        )
    )
    
    dp = Dispatcher()
    
    # Регистрация middleware и обработчиков
    register_middleware(dp)
    register_handlers(dp)
    
    # Регистрация функций запуска и остановки
    dp.startup.register(on_startup)
    dp.shutdown.register(on_shutdown)
    
    try:
        # Запуск polling
        logger.info("🔄 Запуск polling...")
        await dp.start_polling(
            bot,
            allowed_updates=["message", "callback_query", "inline_query"],
            drop_pending_updates=True
        )
    except KeyboardInterrupt:
        logger.info("👋 Получен сигнал остановки")
    except Exception as e:
        logger.error(f"💥 Критическая ошибка: {e}")
        raise
    finally:
        await bot.session.close()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("👋 Программа остановлена пользователем")
    except Exception as e:
        logger.error(f"💥 Неожиданная ошибка: {e}")
        sys.exit(1)