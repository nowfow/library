"""
Утилиты для валидации данных
"""

import re
from typing import Optional


def validate_email(email: str) -> bool:
    """Валидация email адреса"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_password(password: str) -> tuple[bool, Optional[str]]:
    """Валидация пароля"""
    
    if len(password) < 6:
        return False, "Пароль должен содержать минимум 6 символов"
    
    if len(password) > 100:
        return False, "Пароль слишком длинный (максимум 100 символов)"
    
    # Проверяем на наличие хотя бы одной буквы и одной цифры
    if not re.search(r'[a-zA-Z]', password):
        return False, "Пароль должен содержать хотя бы одну букву"
    
    if not re.search(r'[0-9]', password):
        return False, "Пароль должен содержать хотя бы одну цифру"
    
    return True, None


def validate_name(name: str) -> tuple[bool, Optional[str]]:
    """Валидация имени пользователя"""
    
    if not name or not name.strip():
        return False, "Имя не может быть пустым"
    
    name = name.strip()
    
    if len(name) < 2:
        return False, "Имя должно содержать минимум 2 символа"
    
    if len(name) > 50:
        return False, "Имя слишком длинное (максимум 50 символов)"
    
    # Проверяем на допустимые символы (буквы, пробелы, дефисы)
    if not re.match(r'^[a-zA-Zа-яА-ЯёЁ\s\-]+$', name):
        return False, "Имя может содержать только буквы, пробелы и дефисы"
    
    return True, None


def validate_collection_name(name: str) -> tuple[bool, Optional[str]]:
    """Валидация названия коллекции"""
    
    if not name or not name.strip():
        return False, "Название коллекции не может быть пустым"
    
    name = name.strip()
    
    if len(name) < 3:
        return False, "Название должно содержать минимум 3 символа"
    
    if len(name) > 100:
        return False, "Название слишком длинное (максимум 100 символов)"
    
    return True, None


def validate_search_query(query: str) -> tuple[bool, Optional[str]]:
    """Валидация поискового запроса"""
    
    if not query or not query.strip():
        return False, "Поисковый запрос не может быть пустым"
    
    query = query.strip()
    
    if len(query) < 2:
        return False, "Поисковый запрос должен содержать минимум 2 символа"
    
    if len(query) > 200:
        return False, "Поисковый запрос слишком длинный (максимум 200 символов)"
    
    return True, None


def validate_page_number(page_str: str) -> tuple[bool, int, Optional[str]]:
    """Валидация номера страницы"""
    
    try:
        page = int(page_str)
        
        if page < 1:
            return False, 1, "Номер страницы должен быть больше 0"
        
        if page > 10000:
            return False, 1, "Номер страницы слишком большой"
        
        return True, page, None
    
    except ValueError:
        return False, 1, "Номер страницы должен быть числом"


def sanitize_filename(filename: str) -> str:
    """Очистка имени файла от недопустимых символов"""
    
    # Удаляем недопустимые символы для файловой системы
    sanitized = re.sub(r'[<>:"/\\|?*]', '', filename)
    
    # Заменяем пробелы на подчеркивания
    sanitized = re.sub(r'\s+', '_', sanitized)
    
    # Ограничиваем длину
    if len(sanitized) > 200:
        name, ext = sanitized.rsplit('.', 1) if '.' in sanitized else (sanitized, '')
        max_name_length = 200 - len(ext) - 1 if ext else 200
        sanitized = name[:max_name_length] + ('.' + ext if ext else '')
    
    return sanitized


def validate_telegram_username(username: str) -> bool:
    """Валидация Telegram username"""
    
    if not username:
        return False
    
    # Убираем @ если есть
    username = username.lstrip('@')
    
    # Проверяем длину (5-32 символа)
    if len(username) < 5 or len(username) > 32:
        return False
    
    # Проверяем формат (буквы, цифры, подчеркивания)
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        return False
    
    # Не может начинаться с цифры
    if username[0].isdigit():
        return False
    
    # Не может заканчиваться подчеркиванием
    if username.endswith('_'):
        return False
    
    return True


def is_positive_integer(value: str) -> bool:
    """Проверка на положительное целое число"""
    
    try:
        num = int(value)
        return num > 0
    except ValueError:
        return False


def validate_description(description: str) -> tuple[bool, Optional[str]]:
    """Валидация описания"""
    
    if not description:
        return True, None  # Описание может быть пустым
    
    description = description.strip()
    
    if len(description) > 500:
        return False, "Описание слишком длинное (максимум 500 символов)"
    
    return True, None


def clean_search_query(query: str) -> str:
    """Очистка поискового запроса"""
    
    # Убираем лишние пробелы
    query = re.sub(r'\s+', ' ', query.strip())
    
    # Убираем специальные символы, оставляя только буквы, цифры, пробелы и основные знаки
    query = re.sub(r'[^\w\s\-\.\,\!\?]', '', query)
    
    return query


def validate_file_extension(filename: str, allowed_extensions: list) -> bool:
    """Проверка расширения файла"""
    
    if not filename or '.' not in filename:
        return False
    
    extension = filename.rsplit('.', 1)[1].lower()
    return extension in [ext.lower() for ext in allowed_extensions]