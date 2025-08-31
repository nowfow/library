from aiogram import Dispatcher
from .commands import start, search
from .callbacks import main_callbacks
from .messages import search_messages

def register_handlers(dp: Dispatcher):
    """Register all bot handlers"""
    # Command handlers
    dp.include_router(start.router)
    dp.include_router(search.router)
    
    # Callback handlers
    dp.include_router(main_callbacks.router)
    
    # Message handlers
    dp.include_router(search_messages.router)