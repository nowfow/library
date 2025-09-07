"""
Reply клавиатуры для Telegram бота
"""

from aiogram.types import ReplyKeyboardMarkup, KeyboardButton


def main_menu_reply() -> ReplyKeyboardMarkup:
    """Основная Reply клавиатура"""
    
    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(text="🔍 Поиск"),
                KeyboardButton(text="📚 Термины")
            ],
            [
                KeyboardButton(text="📁 Коллекции"),
                KeyboardButton(text="📂 Категории")
            ],
            [
                KeyboardButton(text="👤 Профиль"),
                KeyboardButton(text="⚙️ Настройки")
            ]
        ],
        resize_keyboard=True,
        one_time_keyboard=False
    )
    
    return keyboard


def search_menu_reply() -> ReplyKeyboardMarkup:
    """Клавиатура меню поиска"""
    
    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(text="🎵 Произведения"),
                KeyboardButton(text="👨‍🎼 Композиторы")
            ],
            [
                KeyboardButton(text="📂 По категориям"),
                KeyboardButton(text="📚 Термины")
            ],
            [
                KeyboardButton(text="🔙 Главное меню")
            ]
        ],
        resize_keyboard=True,
        one_time_keyboard=False
    )
    
    return keyboard


def auth_menu_reply() -> ReplyKeyboardMarkup:
    """Клавиатура для неавторизованных пользователей"""
    
    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(text="🔐 Войти"),
                KeyboardButton(text="📝 Регистрация")
            ],
            [
                KeyboardButton(text="🔍 Поиск без входа")
            ]
        ],
        resize_keyboard=True,
        one_time_keyboard=False
    )
    
    return keyboard


def cancel_reply() -> ReplyKeyboardMarkup:
    """Клавиатура отмены"""
    
    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="❌ Отмена")]
        ],
        resize_keyboard=True,
        one_time_keyboard=True
    )
    
    return keyboard


def skip_reply() -> ReplyKeyboardMarkup:
    """Клавиатура с кнопкой пропуска"""
    
    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(text="⏭️ Пропустить"),
                KeyboardButton(text="❌ Отмена")
            ]
        ],
        resize_keyboard=True,
        one_time_keyboard=True
    )
    
    return keyboard


def yes_no_reply() -> ReplyKeyboardMarkup:
    """Клавиатура Да/Нет"""
    
    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(text="✅ Да"),
                KeyboardButton(text="❌ Нет")
            ]
        ],
        resize_keyboard=True,
        one_time_keyboard=True
    )
    
    return keyboard


def contact_reply() -> ReplyKeyboardMarkup:
    """Клавиатура для отправки контакта"""
    
    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📱 Отправить контакт", request_contact=True)],
            [KeyboardButton(text="❌ Отмена")]
        ],
        resize_keyboard=True,
        one_time_keyboard=True
    )
    
    return keyboard


def remove_keyboard() -> ReplyKeyboardMarkup:
    """Удаление клавиатуры"""
    
    return ReplyKeyboardMarkup(
        keyboard=[],
        resize_keyboard=True,
        remove_keyboard=True
    )