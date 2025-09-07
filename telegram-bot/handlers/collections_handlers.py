"""
Обработчики коллекций пользователей
"""

from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.filters import Command
from loguru import logger

from models.user import User
from services.api_client import api_client
from keyboards.inline import main_menu_keyboard, auth_keyboard
from utils.formatters import format_error_message

router = Router()


@router.callback_query(F.data == "my_collections")
@router.message(F.text == "📁 Коллекции")
async def my_collections(event, user: User):
    """Просмотр коллекций пользователя"""
    
    if not user.is_authenticated:
        text = "🔐 Для работы с коллекциями необходимо авторизоваться"
        keyboard = auth_keyboard()
    else:
        text = "📁 <b>Мои коллекции</b>\n\n🚧 Раздел в разработке..."
        keyboard = main_menu_keyboard()
    
    if hasattr(event, 'answer'):  # CallbackQuery
        await event.answer()
        await event.message.edit_text(text, reply_markup=keyboard)
    else:  # Message
        await event.answer(text, reply_markup=keyboard)