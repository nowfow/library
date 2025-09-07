"""
Обработчики поиска произведений и терминов
"""

from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.filters import Command
from loguru import logger

from models.user import User
from services.api_client import api_client
from keyboards.inline import (
    search_type_keyboard, search_results_keyboard, 
    work_details_keyboard, main_menu_keyboard
)
from keyboards.reply import main_menu_reply
from utils.formatters import (
    format_search_results, format_work_info, 
    format_error_message, truncate_text
)
from utils.validators import validate_search_query, clean_search_query

router = Router()


# Команда /search
@router.message(Command("search"))
async def cmd_search(message: Message, user: User):
    """Обработчик команды /search"""
    
    # Извлекаем запрос из команды
    query = message.text[8:].strip()  # Убираем "/search "
    
    if not query:
        await message.answer(
            "🔍 <b>Поиск произведений</b>\n\n"
            "Введите запрос для поиска:\n"
            "• Название произведения\n"
            "• Имя композитора\n"
            "• Категория\n\n"
            "Пример: <code>/search Mozart концерт</code>",
            reply_markup=search_type_keyboard()
        )
        return
    
    await perform_search(message, query, user)


# Обработчик кнопки поиска
@router.callback_query(F.data == "search_works")
@router.message(F.text == "🔍 Поиск")
async def search_works_button(event, user: User):
    """Обработчик кнопки поиска произведений"""
    
    text = (
        "🔍 <b>Поиск произведений</b>\n\n"
        "Отправьте сообщение с запросом для поиска:\n"
        "• Название произведения\n"
        "• Имя композитора\n"
        "• Категория\n\n"
        "💡 <b>Советы:</b>\n"
        "• Можно допускать опечатки\n"
        "• Поиск работает по частичным совпадениям\n"
        "• Используйте ключевые слова"
    )
    
    keyboard = search_type_keyboard()
    
    if hasattr(event, 'answer'):  # CallbackQuery
        await event.answer()
        await event.message.edit_text(text, reply_markup=keyboard)
    else:  # Message
        await event.answer(text, reply_markup=keyboard)


# Обработчик поиска по типу
@router.callback_query(F.data.startswith("search_type_"))
async def search_by_type(callback: CallbackQuery, user: User):
    """Обработчик поиска по типу"""
    
    search_type = callback.data.split("_")[-1]
    
    type_descriptions = {
        "works": "🎵 <b>Поиск произведений</b>\n\nВведите название произведения или композитора:",
        "composers": "👨‍🎼 <b>Поиск композиторов</b>\n\nВведите имя композитора:",
        "categories": "📂 <b>Поиск по категориям</b>\n\nВведите название категории:",
        "terms": "📚 <b>Поиск терминов</b>\n\nВведите музыкальный термин:"
    }
    
    text = type_descriptions.get(search_type, "🔍 Введите поисковый запрос:")
    
    await callback.answer()
    await callback.message.edit_text(text)
    
    # Сохраняем тип поиска в состояние пользователя (можно использовать FSM)
    # Для простоты пока обрабатываем все типы одинаково


# Универсальный поиск по тексту сообщения
@router.message(F.text.regexp(r'^[^/].*'))
async def universal_search(message: Message, user: User):
    """Универсальный поиск по тексту сообщения"""
    
    # Проверяем, не является ли сообщение кнопкой меню
    if message.text in ["🔍 Поиск", "📚 Термины", "📁 Коллекции", "📂 Категории", 
                       "👤 Профиль", "⚙️ Настройки", "❌ Отмена"]:
        return  # Пропускаем обработку кнопок меню
    
    query = message.text.strip()
    
    # Валидация запроса
    is_valid, error_msg = validate_search_query(query)
    if not is_valid:
        await message.answer(f"❌ {error_msg}")
        return
    
    await perform_search(message, query, user)


async def perform_search(message: Message, query: str, user: User, page: int = 1):
    """Выполнение поиска произведений"""
    
    # Очищаем и подготавливаем запрос
    clean_query = clean_search_query(query)
    
    # Показываем индикатор загрузки
    loading_msg = await message.answer("🔍 Ищу произведения...")
    
    try:
        # Используем умный поиск если доступен
        response = await api_client.smart_search_works(
            query=clean_query,
            page=page,
            limit=user.items_per_page,
            jwt_token=user.jwt_token
        )
        
        if not response:
            await loading_msg.edit_text(
                "❌ Ошибка соединения с сервером",
                reply_markup=main_menu_keyboard()
            )
            return
        
        if response.get("error"):
            error_text = format_error_message(
                response.get("error", "unknown"),
                response.get("message", "")
            )
            await loading_msg.edit_text(
                error_text,
                reply_markup=main_menu_keyboard()
            )
            return
        
        # Обрабатываем результаты
        results = response.get("results", [])
        total = response.get("total", 0)
        current_page = response.get("pagination", {}).get("page", page)
        total_pages = response.get("pagination", {}).get("total_pages", 1)
        
        if not results:
            await loading_msg.edit_text(
                f"🔍 По запросу <b>'{query}'</b> ничего не найдено.\n\n"
                "💡 Попробуйте:\n"
                "• Изменить запрос\n"
                "• Использовать ключевые слова\n"
                "• Проверить правописание",
                reply_markup=search_type_keyboard()
            )
            return
        
        # Форматируем результаты
        results_text = format_search_results(results, query, current_page, total)
        results_text = truncate_text(results_text)
        
        # Создаем клавиатуру с результатами
        keyboard = search_results_keyboard(
            results=results,
            page=current_page,
            total_pages=total_pages,
            search_query=query
        )
        
        await loading_msg.edit_text(
            results_text,
            reply_markup=keyboard
        )
        
    except Exception as e:
        logger.error(f"Ошибка поиска для запроса '{query}': {e}")
        await loading_msg.edit_text(
            "❌ Произошла ошибка при поиске. Попробуйте позже.",
            reply_markup=main_menu_keyboard()
        )


# Обработчик пагинации результатов поиска
@router.callback_query(F.data.startswith("search_page_"))
async def search_pagination(callback: CallbackQuery, user: User):
    """Обработчик пагинации результатов поиска"""
    
    try:
        parts = callback.data.split("_")
        page = int(parts[2])
        query = "_".join(parts[3:])  # Восстанавливаем запрос
        
        await callback.answer()
        
        # Выполняем поиск для новой страницы
        await perform_search_callback(callback, query, user, page)
        
    except (ValueError, IndexError) as e:
        logger.error(f"Ошибка парсинга callback данных: {callback.data} | {e}")
        await callback.answer("❌ Ошибка навигации")


async def perform_search_callback(callback: CallbackQuery, query: str, user: User, page: int = 1):
    """Выполнение поиска для callback запроса"""
    
    try:
        # Используем умный поиск
        response = await api_client.smart_search_works(
            query=query,
            page=page,
            limit=user.items_per_page,
            jwt_token=user.jwt_token
        )
        
        if not response or response.get("error"):
            await callback.message.edit_text(
                "❌ Ошибка при загрузке результатов",
                reply_markup=main_menu_keyboard()
            )
            return
        
        # Обрабатываем результаты
        results = response.get("results", [])
        total = response.get("total", 0)
        current_page = response.get("pagination", {}).get("page", page)
        total_pages = response.get("pagination", {}).get("total_pages", 1)
        
        # Форматируем результаты
        results_text = format_search_results(results, query, current_page, total)
        results_text = truncate_text(results_text)
        
        # Создаем клавиатуру с результатами
        keyboard = search_results_keyboard(
            results=results,
            page=current_page,
            total_pages=total_pages,
            search_query=query
        )
        
        await callback.message.edit_text(
            results_text,
            reply_markup=keyboard
        )
        
    except Exception as e:
        logger.error(f"Ошибка поиска в callback для запроса '{query}': {e}")
        await callback.message.edit_text(
            "❌ Произошла ошибка при поиске",
            reply_markup=main_menu_keyboard()
        )


# Обработчик деталей произведения
@router.callback_query(F.data.startswith("work_details_"))
async def work_details(callback: CallbackQuery, user: User):
    """Обработчик просмотра деталей произведения"""
    
    try:
        work_id = int(callback.data.split("_")[-1])
        
        await callback.answer()
        
        # Показываем индикатор загрузки
        await callback.message.edit_text("🔄 Загружаю информацию о произведении...")
        
        # Получаем информацию о произведении
        response = await api_client.get_work_by_id(work_id, user.jwt_token)
        
        if not response or response.get("error"):
            await callback.message.edit_text(
                "❌ Произведение не найдено",
                reply_markup=main_menu_keyboard()
            )
            return
        
        work_data = response
        if "data" in response:
            work_data = response["data"]
        
        # Форматируем информацию о произведении
        work_text = format_work_info(work_data, show_full=True)
        work_text = truncate_text(work_text)
        
        # Создаем клавиатуру с действиями
        keyboard = work_details_keyboard(work_id)
        
        await callback.message.edit_text(
            work_text,
            reply_markup=keyboard
        )
        
    except (ValueError, IndexError) as e:
        logger.error(f"Ошибка парсинга work_id: {callback.data} | {e}")
        await callback.answer("❌ Ошибка загрузки произведения")
    except Exception as e:
        logger.error(f"Ошибка получения деталей произведения: {e}")
        await callback.message.edit_text(
            "❌ Ошибка загрузки произведения",
            reply_markup=main_menu_keyboard()
        )


# Обработчик новый поиск
@router.callback_query(F.data == "new_search")
async def new_search(callback: CallbackQuery, user: User):
    """Обработчик кнопки нового поиска"""
    
    await callback.answer()
    await callback.message.edit_text(
        "🔍 <b>Новый поиск</b>\n\n"
        "Введите поисковый запрос:",
        reply_markup=search_type_keyboard()
    )


# Обработчик возврата к поиску
@router.callback_query(F.data == "back_to_search")
async def back_to_search(callback: CallbackQuery, user: User):
    """Обработчик возврата к результатам поиска"""
    
    await callback.answer()
    await callback.message.edit_text(
        "🔍 <b>Поиск</b>\n\n"
        "Введите новый поисковый запрос:",
        reply_markup=search_type_keyboard()
    )


# Команда /composer
@router.message(Command("composer"))
async def cmd_composer(message: Message, user: User):
    """Поиск произведений композитора"""
    
    composer_name = message.text[10:].strip()  # Убираем "/composer "
    
    if not composer_name:
        await message.answer(
            "👨‍🎼 <b>Поиск по композитору</b>\n\n"
            "Введите имя композитора:\n"
            "Пример: <code>/composer Mozart</code>"
        )
        return
    
    await search_composer_works(message, composer_name, user)


async def search_composer_works(message: Message, composer_name: str, user: User):
    """Поиск произведений композитора"""
    
    loading_msg = await message.answer(f"🔍 Ищу произведения композитора {composer_name}...")
    
    try:
        # Поиск произведений композитора
        response = await api_client.smart_search_works(
            query=composer_name,
            page=1,
            limit=user.items_per_page,
            jwt_token=user.jwt_token
        )
        
        if not response or response.get("error"):
            await loading_msg.edit_text(
                f"❌ Произведения композитора '{composer_name}' не найдены",
                reply_markup=main_menu_keyboard()
            )
            return
        
        results = response.get("results", [])
        
        if not results:
            await loading_msg.edit_text(
                f"🔍 Произведения композитора <b>{composer_name}</b> не найдены.\n\n"
                "💡 Попробуйте:\n"
                "• Проверить правописание\n"
                "• Использовать часть имени\n"
                "• Поиск через /search",
                reply_markup=search_type_keyboard()
            )
            return
        
        # Форматируем результаты
        results_text = format_search_results(results, f"Композитор: {composer_name}", 1, len(results))
        results_text = truncate_text(results_text)
        
        keyboard = search_results_keyboard(
            results=results,
            page=1,
            total_pages=1,
            search_query=composer_name
        )
        
        await loading_msg.edit_text(
            results_text,
            reply_markup=keyboard
        )
        
    except Exception as e:
        logger.error(f"Ошибка поиска композитора '{composer_name}': {e}")
        await loading_msg.edit_text(
            f"❌ Ошибка поиска композитора '{composer_name}'",
            reply_markup=main_menu_keyboard()
        )