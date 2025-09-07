"""
Обработчики поиска терминов
"""

from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.filters import Command
from loguru import logger

from models.user import User
from services.api_client import api_client
from keyboards.inline import main_menu_keyboard, search_type_keyboard
from utils.formatters import format_term_info, format_error_message

router = Router()


@router.callback_query(F.data == "search_terms")
@router.message(F.text == "📚 Термины")
async def search_terms(event, user: User):
    """Поиск музыкальных терминов"""
    
    text = (
        "📚 <b>Поиск музыкальных терминов</b>\n\n"
        "Введите термин для поиска:\n"
        "• Название термина\n"
        "• Часть определения\n\n"
        "Пример: валторна, стаккато, концерт"
    )
    
    if hasattr(event, 'answer'):  # CallbackQuery
        await event.answer()
        await event.message.edit_text(text, reply_markup=search_type_keyboard())
    else:  # Message
        await event.answer(text, reply_markup=search_type_keyboard())


@router.message(Command("term"))
async def cmd_term(message: Message, user: User):
    """Поиск конкретного термина"""
    
    term = message.text[6:].strip()  # Убираем "/term "
    
    if not term:
        await message.answer(
            "📚 <b>Поиск термина</b>\n\n"
            "Введите термин для поиска:\n"
            "Пример: <code>/term валторна</code>"
        )
        return
    
    await search_specific_term(message, term, user)


async def search_specific_term(message: Message, term: str, user: User):
    """Поиск конкретного термина"""
    
    loading_msg = await message.answer(f"📚 Ищу термин '{term}'...")
    
    try:
        # Поиск термина через API
        response = await api_client.search_terms(
            query=term,
            page=1,
            limit=5,
            jwt_token=user.jwt_token
        )
        
        if not response or response.get("error"):
            await loading_msg.edit_text(
                f"❌ Термин '{term}' не найден",
                reply_markup=main_menu_keyboard()
            )
            return
        
        terms = response.get("data", response.get("results", []))
        
        if not terms:
            await loading_msg.edit_text(
                f"📚 Термин <b>'{term}'</b> не найден.\n\n"
                "💡 Попробуйте:\n"
                "• Проверить правописание\n"
                "• Использовать синонимы\n"
                "• Поиск по части слова",
                reply_markup=search_type_keyboard()
            )
            return
        
        # Показываем первый найденный термин
        first_term = terms[0]
        term_text = format_term_info(first_term)
        
        await loading_msg.edit_text(
            term_text,
            reply_markup=main_menu_keyboard()
        )
        
        # Если найдено больше терминов, показываем их
        if len(terms) > 1:
            other_terms = terms[1:]
            other_text = f"\n\n📚 <b>Другие найденные термины:</b>\n"
            
            for i, other_term in enumerate(other_terms[:3], 2):
                term_name = other_term.get("term", "")
                other_text += f"{i}. {term_name}\n"
            
            if len(terms) > 4:
                other_text += f"... и еще {len(terms) - 4}"
            
            await message.answer(other_text, reply_markup=main_menu_keyboard())
        
    except Exception as e:
        logger.error(f"Ошибка поиска термина '{term}': {e}")
        await loading_msg.edit_text(
            f"❌ Ошибка поиска термина '{term}'",
            reply_markup=main_menu_keyboard()
        )