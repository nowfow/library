import asyncio
import logging
from aiogram import Bot, Dispatcher
from aiogram.enums import ParseMode
from aiogram.client.bot import DefaultBotProperties
from aiogram.fsm.storage.redis import RedisStorage
from aiogram.fsm.storage.memory import MemoryStorage

from app.config.settings import settings
from app.handlers import register_handlers
from app.middlewares import register_middlewares

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def main():
    """Main bot function"""
    logger.info("Starting Music Library Telegram Bot...")
    
    # Initialize bot
    bot = Bot(
        token=settings.BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML)
    )
    
    # Initialize storage (Redis if available, otherwise memory)
    try:
        storage = RedisStorage.from_url(settings.REDIS_URL)
        logger.info("Using Redis storage for FSM")
    except Exception as e:
        logger.warning(f"Redis not available, using memory storage: {e}")
        storage = MemoryStorage()
    
    # Initialize dispatcher
    dp = Dispatcher(storage=storage)
    
    # Register middlewares and handlers
    register_middlewares(dp)
    register_handlers(dp)
    
    logger.info("Bot components registered successfully")
    
    # Start polling
    try:
        await dp.start_polling(bot, skip_updates=True)
    except Exception as e:
        logger.error(f"Bot polling error: {e}")
    finally:
        await bot.session.close()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Bot stopped by user")
    except Exception as e:
        logger.error(f"Bot startup error: {e}")