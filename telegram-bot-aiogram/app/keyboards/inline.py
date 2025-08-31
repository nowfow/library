from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.utils.keyboard import InlineKeyboardBuilder
from typing import List, Dict, Any

class MainKeyboard:
    """Main navigation keyboards"""
    
    @staticmethod
    def get_main_menu(is_authenticated: bool = False) -> InlineKeyboardMarkup:
        """Get main menu keyboard"""
        builder = InlineKeyboardBuilder()
        
        builder.row(
            InlineKeyboardButton(text="🔍 Search", callback_data="search:start"),
            InlineKeyboardButton(text="📁 Files", callback_data="browse:start")
        )
        
        if is_authenticated:
            builder.row(
                InlineKeyboardButton(text="📚 Collections", callback_data="collections:list"),
                InlineKeyboardButton(text="📊 Statistics", callback_data="stats:show")
            )
            builder.row(
                InlineKeyboardButton(text="👤 Profile", callback_data="profile:show"),
                InlineKeyboardButton(text="🚪 Logout", callback_data="auth:logout")
            )
        else:
            builder.row(
                InlineKeyboardButton(text="🔐 Login", callback_data="auth:login"),
                InlineKeyboardButton(text="📝 Register", callback_data="auth:register")
            )
        
        return builder.as_markup()

class SearchKeyboard:
    """Search related keyboards"""
    
    @staticmethod
    def get_search_types() -> InlineKeyboardMarkup:
        """Get search type selection keyboard"""
        builder = InlineKeyboardBuilder()
        builder.row(
            InlineKeyboardButton(text="🎼 Composer", callback_data="search:composer"),
            InlineKeyboardButton(text="🎹 Work", callback_data="search:work")
        )
        builder.row(
            InlineKeyboardButton(text="📖 Term", callback_data="search:term"),
            InlineKeyboardButton(text="🔍 Universal", callback_data="search:universal")
        )
        builder.row(
            InlineKeyboardButton(text="🏠 Main Menu", callback_data="menu:main")
        )
        return builder.as_markup()
    
    @staticmethod
    def get_results_keyboard(results: List[Dict[str, Any]], page: int = 0) -> InlineKeyboardMarkup:
        """Get search results keyboard with pagination"""
        builder = InlineKeyboardBuilder()
        
        # Show results (max 5 per page)
        start_idx = page * 5
        end_idx = min(start_idx + 5, len(results))
        
        for i in range(start_idx, end_idx):
            result = results[i]
            text = f"🎵 {result.get('composer', 'Unknown')} - {result.get('title', 'Untitled')}"
            if len(text) > 50:
                text = text[:47] + "..."
            callback_data = f"work:show:{result.get('work_id', i)}"
            builder.row(InlineKeyboardButton(text=text, callback_data=callback_data))
        
        # Pagination buttons
        nav_buttons = []
        if page > 0:
            nav_buttons.append(InlineKeyboardButton(text="◀️ Prev", callback_data=f"search:page:{page-1}"))
        if end_idx < len(results):
            nav_buttons.append(InlineKeyboardButton(text="Next ▶️", callback_data=f"search:page:{page+1}"))
        
        if nav_buttons:
            builder.row(*nav_buttons)
        
        builder.row(
            InlineKeyboardButton(text="🔍 New Search", callback_data="search:start"),
            InlineKeyboardButton(text="🏠 Main Menu", callback_data="menu:main")
        )
        return builder.as_markup()