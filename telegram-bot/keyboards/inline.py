"""
Inline клавиатуры для Telegram бота
"""

from typing import List, Dict, Any, Optional
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton


def main_menu_keyboard() -> InlineKeyboardMarkup:
    """Главное меню бота"""
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="🔍 Поиск произведений", callback_data="search_works"),
            InlineKeyboardButton(text="📚 Поиск терминов", callback_data="search_terms")
        ],
        [
            InlineKeyboardButton(text="📂 Категории", callback_data="categories"),
            InlineKeyboardButton(text="👨‍🎼 Композиторы", callback_data="composers")
        ],
        [
            InlineKeyboardButton(text="📁 Мои коллекции", callback_data="my_collections"),
            InlineKeyboardButton(text="📊 Статистика", callback_data="stats")
        ],
        [
            InlineKeyboardButton(text="👤 Профиль", callback_data="profile"),
            InlineKeyboardButton(text="⚙️ Настройки", callback_data="settings")
        ]
    ])
    
    return keyboard


def auth_keyboard() -> InlineKeyboardMarkup:
    """Клавиатура для неавторизованных пользователей"""
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="🔐 Войти в аккаунт", callback_data="login"),
            InlineKeyboardButton(text="📝 Зарегистрироваться", callback_data="register")
        ],
        [
            InlineKeyboardButton(text="🔍 Поиск без регистрации", callback_data="search_guest")
        ]
    ])
    
    return keyboard


def search_type_keyboard() -> InlineKeyboardMarkup:
    """Клавиатура выбора типа поиска"""
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="🎵 Произведения", callback_data="search_type_works"),
            InlineKeyboardButton(text="📚 Термины", callback_data="search_type_terms")
        ],
        [
            InlineKeyboardButton(text="👨‍🎼 Композиторы", callback_data="search_type_composers"),
            InlineKeyboardButton(text="📂 Категории", callback_data="search_type_categories")
        ],
        [
            InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_main")
        ]
    ])
    
    return keyboard


def work_details_keyboard(work_id: int, in_collection: bool = False, 
                         collection_id: Optional[int] = None) -> InlineKeyboardMarkup:
    """Клавиатура для детальной информации о произведении"""
    
    buttons = []
    
    # Кнопки действий с произведением
    action_row = [
        InlineKeyboardButton(text="📥 Скачать", callback_data=f"download_work_{work_id}"),
        InlineKeyboardButton(text="🖼️ Миниатюра", callback_data=f"thumbnail_{work_id}")
    ]
    buttons.append(action_row)
    
    # Управление коллекциями
    if in_collection and collection_id:
        collection_row = [
            InlineKeyboardButton(text="❌ Удалить из коллекции", 
                               callback_data=f"remove_from_collection_{collection_id}_{work_id}")
        ]
    else:
        collection_row = [
            InlineKeyboardButton(text="➕ Добавить в коллекцию", 
                               callback_data=f"add_to_collection_{work_id}")
        ]
    buttons.append(collection_row)
    
    # Дополнительные действия
    additional_row = [
        InlineKeyboardButton(text="👨‍🎼 Другие произведения", 
                           callback_data=f"composer_works_{work_id}"),
        InlineKeyboardButton(text="📂 В категории", 
                           callback_data=f"category_works_{work_id}")
    ]
    buttons.append(additional_row)
    
    # Навигация
    nav_row = [
        InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_search")
    ]
    buttons.append(nav_row)
    
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def search_results_keyboard(results: List[Dict[str, Any]], page: int = 1, 
                          total_pages: int = 1, search_query: str = "") -> InlineKeyboardMarkup:
    """Клавиатура для результатов поиска"""
    
    buttons = []
    
    # Результаты поиска (по 2 в ряд)
    for i in range(0, len(results), 2):
        row = []
        for j in range(2):
            if i + j < len(results):
                work = results[i + j]
                work_id = work.get("id")
                title = work.get("work_title", "Без названия")
                composer = work.get("composer", "Неизвестный")
                
                # Ограничиваем длину текста кнопки
                button_text = f"{title[:15]}... - {composer[:10]}..."
                if len(title) <= 15:
                    button_text = f"{title} - {composer[:15]}..."
                
                row.append(InlineKeyboardButton(
                    text=button_text,
                    callback_data=f"work_details_{work_id}"
                ))
        
        if row:
            buttons.append(row)
    
    # Пагинация
    if total_pages > 1:
        nav_row = []
        
        if page > 1:
            nav_row.append(InlineKeyboardButton(
                text="⬅️ Пред.", 
                callback_data=f"search_page_{page-1}_{search_query}"
            ))
        
        nav_row.append(InlineKeyboardButton(
            text=f"📄 {page}/{total_pages}",
            callback_data="current_page"
        ))
        
        if page < total_pages:
            nav_row.append(InlineKeyboardButton(
                text="След. ➡️",
                callback_data=f"search_page_{page+1}_{search_query}"
            ))
        
        buttons.append(nav_row)
    
    # Кнопки действий
    actions_row = [
        InlineKeyboardButton(text="🔍 Новый поиск", callback_data="new_search"),
        InlineKeyboardButton(text="🔙 Главное меню", callback_data="main_menu")
    ]
    buttons.append(actions_row)
    
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def collections_keyboard(collections: List[Dict[str, Any]]) -> InlineKeyboardMarkup:
    """Клавиатура со списком коллекций"""
    
    buttons = []
    
    # Коллекции пользователя
    for collection in collections:
        collection_id = collection.get("id")
        name = collection.get("name", "Без названия")
        is_public = collection.get("is_public", False)
        
        icon = "🌐" if is_public else "🔒"
        button_text = f"{icon} {name[:30]}..."
        
        buttons.append([InlineKeyboardButton(
            text=button_text,
            callback_data=f"collection_details_{collection_id}"
        )])
    
    # Действия с коллекциями
    actions_row = [
        InlineKeyboardButton(text="➕ Создать коллекцию", callback_data="create_collection"),
        InlineKeyboardButton(text="🌐 Публичные", callback_data="public_collections")
    ]
    buttons.append(actions_row)
    
    # Навигация
    nav_row = [
        InlineKeyboardButton(text="🔙 Главное меню", callback_data="main_menu")
    ]
    buttons.append(nav_row)
    
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def collection_details_keyboard(collection_id: int, is_owner: bool = True) -> InlineKeyboardMarkup:
    """Клавиатура для детальной информации о коллекции"""
    
    buttons = []
    
    # Основные действия
    main_row = [
        InlineKeyboardButton(text="📋 Произведения", 
                           callback_data=f"collection_works_{collection_id}"),
        InlineKeyboardButton(text="🔍 Поиск в коллекции", 
                           callback_data=f"search_in_collection_{collection_id}")
    ]
    buttons.append(main_row)
    
    # Действия владельца
    if is_owner:
        owner_row = [
            InlineKeyboardButton(text="✏️ Редактировать", 
                               callback_data=f"edit_collection_{collection_id}"),
            InlineKeyboardButton(text="❌ Удалить", 
                               callback_data=f"delete_collection_{collection_id}")
        ]
        buttons.append(owner_row)
    
    # Навигация
    nav_row = [
        InlineKeyboardButton(text="🔙 Мои коллекции", callback_data="my_collections")
    ]
    buttons.append(nav_row)
    
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def categories_keyboard(categories: List[Dict[str, Any]]) -> InlineKeyboardMarkup:
    """Клавиатура с категориями"""
    
    buttons = []
    
    # Категории (по 2 в ряд)
    for i in range(0, len(categories), 2):
        row = []
        for j in range(2):
            if i + j < len(categories):
                category = categories[i + j]
                category_name = category.get("category", "")
                works_count = category.get("count", 0)
                
                button_text = f"📂 {category_name} ({works_count})"
                if len(button_text) > 30:
                    button_text = f"📂 {category_name[:20]}... ({works_count})"
                
                row.append(InlineKeyboardButton(
                    text=button_text,
                    callback_data=f"category_{category_name}"
                ))
        
        if row:
            buttons.append(row)
    
    # Навигация
    nav_row = [
        InlineKeyboardButton(text="🔙 Главное меню", callback_data="main_menu")
    ]
    buttons.append(nav_row)
    
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def settings_keyboard() -> InlineKeyboardMarkup:
    """Клавиатура настроек"""
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="🔔 Уведомления", callback_data="settings_notifications"),
            InlineKeyboardButton(text="🔍 Поиск по умолчанию", callback_data="settings_search")
        ],
        [
            InlineKeyboardButton(text="📄 Элементов на странице", callback_data="settings_pagination"),
            InlineKeyboardButton(text="🌐 Язык", callback_data="settings_language")
        ],
        [
            InlineKeyboardButton(text="📱 Экспорт данных", callback_data="export_data"),
            InlineKeyboardButton(text="🗑️ Удалить аккаунт", callback_data="delete_account")
        ],
        [
            InlineKeyboardButton(text="🔙 Главное меню", callback_data="main_menu")
        ]
    ])
    
    return keyboard


def confirmation_keyboard(action: str, item_id: Optional[str] = None) -> InlineKeyboardMarkup:
    """Клавиатура подтверждения действия"""
    
    callback_confirm = f"confirm_{action}"
    callback_cancel = f"cancel_{action}"
    
    if item_id:
        callback_confirm += f"_{item_id}"
        callback_cancel += f"_{item_id}"
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="✅ Да", callback_data=callback_confirm),
            InlineKeyboardButton(text="❌ Нет", callback_data=callback_cancel)
        ]
    ])
    
    return keyboard


def back_button(callback_data: str = "main_menu") -> InlineKeyboardMarkup:
    """Простая кнопка "Назад" """
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🔙 Назад", callback_data=callback_data)]
    ])
    
    return keyboard


def pagination_keyboard(current_page: int, total_pages: int, 
                       callback_prefix: str) -> InlineKeyboardMarkup:
    """Универсальная клавиатура пагинации"""
    
    buttons = []
    
    nav_row = []
    
    if current_page > 1:
        nav_row.append(InlineKeyboardButton(
            text="⬅️",
            callback_data=f"{callback_prefix}_{current_page-1}"
        ))
    
    nav_row.append(InlineKeyboardButton(
        text=f"{current_page}/{total_pages}",
        callback_data="current_page"
    ))
    
    if current_page < total_pages:
        nav_row.append(InlineKeyboardButton(
            text="➡️",
            callback_data=f"{callback_prefix}_{current_page+1}"
        ))
    
    buttons.append(nav_row)
    
    return InlineKeyboardMarkup(inline_keyboard=buttons)