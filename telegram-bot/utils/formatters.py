"""
Утилиты для форматирования сообщений
"""

from typing import Dict, Any, List, Optional
from datetime import datetime


def format_work_info(work: Dict[str, Any], show_full: bool = False) -> str:
    """Форматирование информации о произведении"""
    
    # Основная информация
    composer = work.get("composer", "Неизвестный композитор")
    title = work.get("work_title", "Без названия")
    category = work.get("category", "")
    subcategory = work.get("subcategory", "")
    
    # Формируем заголовок
    text = f"🎵 <b>{title}</b>\n"
    text += f"👨‍🎼 <b>Композитор:</b> {composer}\n"
    
    # Категория
    if category:
        category_text = category
        if subcategory:
            category_text += f" → {subcategory}"
        text += f"📂 <b>Категория:</b> {category_text}\n"
    
    if show_full:
        # Дополнительная информация
        file_type = work.get("file_type", "").upper()
        if file_type:
            text += f"📄 <b>Тип файла:</b> {file_type}\n"
        
        file_size = work.get("file_size")
        if file_size:
            size_mb = round(file_size / (1024 * 1024), 2)
            text += f"💾 <b>Размер:</b> {size_mb} МБ\n"
        
        pages_count = work.get("pages_count")
        if pages_count:
            text += f"📖 <b>Страниц:</b> {pages_count}\n"
        
        created_at = work.get("created_at")
        if created_at:
            try:
                date = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                text += f"📅 <b>Добавлено:</b> {date.strftime('%d.%m.%Y')}\n"
            except:
                pass
    
    return text


def format_search_results(results: List[Dict[str, Any]], query: str, 
                         page: int = 1, total: int = 0) -> str:
    """Форматирование результатов поиска"""
    
    if not results:
        return f"🔍 По запросу <b>'{query}'</b> ничего не найдено."
    
    text = f"🔍 <b>Результаты поиска:</b> '{query}'\n"
    
    if total > 0:
        text += f"📊 Найдено: <b>{total}</b> произведений\n"
    
    text += f"📄 Страница: <b>{page}</b>\n\n"
    
    for i, work in enumerate(results, 1):
        composer = work.get("composer", "Неизвестный")
        title = work.get("work_title", "Без названия")
        category = work.get("category", "")
        
        text += f"{i}. <b>{title}</b>\n"
        text += f"   👨‍🎼 {composer}"
        
        if category:
            text += f" | 📂 {category}"
        
        # Показываем релевантность если есть
        similarity = work.get("similarity_score")
        if similarity and similarity > 0:
            text += f" | 🎯 {int(similarity * 100)}%"
        
        text += "\n\n"
    
    return text


def format_term_info(term: Dict[str, Any]) -> str:
    """Форматирование информации о термине"""
    
    term_name = term.get("term", "")
    definition = term.get("definition", "")
    
    text = f"📚 <b>{term_name}</b>\n\n"
    text += f"{definition}"
    
    return text


def format_collection_info(collection: Dict[str, Any], works_count: Optional[int] = None) -> str:
    """Форматирование информации о коллекции"""
    
    name = collection.get("name", "Без названия")
    description = collection.get("description", "")
    is_public = collection.get("is_public", False)
    created_at = collection.get("created_at", "")
    
    text = f"📁 <b>{name}</b>\n"
    
    if description:
        text += f"📝 {description}\n"
    
    text += f"🔒 {'Публичная' if is_public else 'Приватная'}\n"
    
    if works_count is not None:
        text += f"🎵 Произведений: <b>{works_count}</b>\n"
    
    if created_at:
        try:
            date = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            text += f"📅 Создана: {date.strftime('%d.%m.%Y')}\n"
        except:
            pass
    
    return text


def format_user_info(user_data: Dict[str, Any]) -> str:
    """Форматирование информации о пользователе"""
    
    name = user_data.get("name", "")
    email = user_data.get("email", "")
    role = user_data.get("role", "user")
    created_at = user_data.get("created_at", "")
    
    text = f"👤 <b>Профиль пользователя</b>\n\n"
    text += f"📧 <b>Email:</b> {email}\n"
    text += f"🏷️ <b>Имя:</b> {name}\n"
    text += f"⭐ <b>Роль:</b> {'Администратор' if role == 'admin' else 'Пользователь'}\n"
    
    if created_at:
        try:
            date = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            text += f"📅 <b>Регистрация:</b> {date.strftime('%d.%m.%Y')}\n"
        except:
            pass
    
    return text


def format_stats(stats: Dict[str, Any]) -> str:
    """Форматирование статистики"""
    
    totals = stats.get("totals", {})
    
    text = f"📊 <b>Статистика библиотеки</b>\n\n"
    
    works = totals.get("works", 0)
    composers = totals.get("composers", 0)
    categories = totals.get("categories", 0)
    
    text += f"🎵 <b>Произведений:</b> {works:,}\n"
    text += f"👨‍🎼 <b>Композиторов:</b> {composers:,}\n"
    text += f"📂 <b>Категорий:</b> {categories:,}\n"
    
    # Топ категории
    top_categories = stats.get("topCategories", [])
    if top_categories:
        text += f"\n🏆 <b>Популярные категории:</b>\n"
        for i, cat in enumerate(top_categories[:5], 1):
            name = cat.get("category", "")
            count = cat.get("works_count", 0)
            text += f"{i}. {name} ({count})\n"
    
    return text


def format_file_size(size_bytes: int) -> str:
    """Форматирование размера файла"""
    
    if size_bytes < 1024:
        return f"{size_bytes} Б"
    elif size_bytes < 1024 * 1024:
        return f"{round(size_bytes / 1024, 1)} КБ"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{round(size_bytes / (1024 * 1024), 1)} МБ"
    else:
        return f"{round(size_bytes / (1024 * 1024 * 1024), 1)} ГБ"


def format_error_message(error_type: str, details: str = "") -> str:
    """Форматирование сообщений об ошибках"""
    
    error_messages = {
        "unauthorized": "🔐 Требуется авторизация. Используйте /login",
        "not_found": "❌ Запрашиваемый ресурс не найден",
        "api_error": "⚠️ Ошибка сервера. Попробуйте позже",
        "connection_error": "🌐 Ошибка соединения с сервером",
        "timeout": "⏱️ Превышен таймаут запроса",
        "validation_error": "📝 Ошибка валидации данных",
        "permission_denied": "🚫 Недостаточно прав для выполнения операции"
    }
    
    message = error_messages.get(error_type, "❌ Произошла ошибка")
    
    if details:
        message += f"\n\n<i>{details}</i>"
    
    return message


def truncate_text(text: str, max_length: int = 4000) -> str:
    """Обрезка текста для Telegram"""
    
    if len(text) <= max_length:
        return text
    
    # Обрезаем и добавляем многоточие
    truncated = text[:max_length - 20]
    
    # Пытаемся обрезать по последнему переносу строки
    last_newline = truncated.rfind('\n')
    if last_newline > max_length * 0.8:  # Если нашли близко к концу
        truncated = truncated[:last_newline]
    
    return truncated + "\n\n<i>... сообщение обрезано</i>"


def escape_markdown(text: str) -> str:
    """Экранирование специальных символов для Markdown"""
    
    special_chars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!']
    
    for char in special_chars:
        text = text.replace(char, f'\\{char}')
    
    return text