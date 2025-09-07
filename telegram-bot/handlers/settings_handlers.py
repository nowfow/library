"""
Обработчики настроек бота
"""

from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.filters import Command
from loguru import logger

from models.user import User
from services.api_client import api_client
from keyboards.inline import main_menu_keyboard, settings_keyboard
from utils.formatters import format_stats

router = Router()


@router.callback_query(F.data == "settings")
@router.message(F.text == "⚙️ Настройки")
async def bot_settings(event, user: User):
    """Настройки бота"""
    
    text = "⚙️ <b>Настройки бота</b>\n\n🚧 Раздел в разработке..."
    
    if hasattr(event, 'answer'):  # CallbackQuery
        await event.answer()
        await event.message.edit_text(text, reply_markup=settings_keyboard())
    else:  # Message
        await event.answer(text, reply_markup=settings_keyboard())


@router.callback_query(F.data == "stats")
@router.message(Command("stats"))
async def show_stats(event, user: User):
    """Показать статистику библиотеки"""
    
    if hasattr(event, 'answer'):  # CallbackQuery
        await event.answer()
        await event.message.edit_text("📊 Загружаю статистику...")
    else:  # Message
        loading_msg = await event.answer("📊 Загружаю статистику...")
    
    try:
        # Получаем статистику произведений
        stats_response = await api_client.get_works_stats(user.jwt_token)
        
        if stats_response and not stats_response.get("error"):
            stats_text = format_stats(stats_response)
        else:
            stats_text = "📊 <b>Статистика библиотеки</b>\n\n❌ Ошибка загрузки данных"
        
        if hasattr(event, 'answer'):  # CallbackQuery
            await event.message.edit_text(stats_text, reply_markup=main_menu_keyboard())
        else:  # Message
            await loading_msg.edit_text(stats_text, reply_markup=main_menu_keyboard())
        
    except Exception as e:
        logger.error(f"Ошибка получения статистики: {e}")
        error_text = "📊 <b>Статистика библиотеки</b>\n\n❌ Ошибка загрузки статистики"
        
        if hasattr(event, 'answer'):  # CallbackQuery
            await event.message.edit_text(error_text, reply_markup=main_menu_keyboard())
        else:  # Message
            await loading_msg.edit_text(error_text, reply_markup=main_menu_keyboard())


@router.callback_query(F.data == "main_menu")
@router.callback_query(F.data == "back_to_main")
async def back_to_main_menu(callback: CallbackQuery, user: User):
    """Возврат в главное меню"""
    
    await callback.answer()
    
    if user.is_authenticated:
        text = f"🎼 <b>Главное меню</b>\n\nДобро пожаловать, {user.full_name}!"
        keyboard = main_menu_keyboard()
    else:
        text = "🎼 <b>Главное меню</b>\n\nВыберите действие:"
        from keyboards.inline import auth_keyboard
        keyboard = auth_keyboard()
    
    await callback.message.edit_text(text, reply_markup=keyboard)