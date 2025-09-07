"""
Обработчики команд для Telegram бота
"""

from . import auth_handlers
from . import search_handlers  
from . import collections_handlers
from . import files_handlers
from . import terms_handlers
from . import settings_handlers

__all__ = [
    "auth_handlers",
    "search_handlers", 
    "collections_handlers",
    "files_handlers",
    "terms_handlers",
    "settings_handlers"
]