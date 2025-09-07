"""
Модель пользователя Telegram бота
"""

from dataclasses import dataclass
from typing import Optional, Dict, Any
from datetime import datetime


@dataclass
class User:
    """Модель пользователя"""
    
    telegram_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    language_code: Optional[str] = None
    
    # Данные авторизации
    jwt_token: Optional[str] = None
    backend_user_id: Optional[int] = None
    email: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = None
    
    # Настройки бота
    notifications_enabled: bool = True
    default_search_type: str = "all"
    items_per_page: int = 5
    
    # Метаданные
    created_at: Optional[datetime] = None
    last_activity: Optional[datetime] = None
    is_authenticated: bool = False
    
    @property
    def full_name(self) -> str:
        """Полное имя пользователя"""
        if self.name:
            return self.name
        
        parts = []
        if self.first_name:
            parts.append(self.first_name)
        if self.last_name:
            parts.append(self.last_name)
        
        return " ".join(parts) if parts else f"User{self.telegram_id}"
    
    @property
    def display_name(self) -> str:
        """Отображаемое имя"""
        if self.username:
            return f"@{self.username}"
        return self.full_name
    
    def to_dict(self) -> Dict[str, Any]:
        """Конвертация в словарь"""
        return {
            "telegram_id": self.telegram_id,
            "username": self.username,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "language_code": self.language_code,
            "jwt_token": self.jwt_token,
            "backend_user_id": self.backend_user_id,
            "email": self.email,
            "name": self.name,
            "role": self.role,
            "notifications_enabled": self.notifications_enabled,
            "default_search_type": self.default_search_type,
            "items_per_page": self.items_per_page,
            "is_authenticated": self.is_authenticated
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "User":
        """Создание из словаря"""
        return cls(
            telegram_id=data["telegram_id"],
            username=data.get("username"),
            first_name=data.get("first_name"),
            last_name=data.get("last_name"),
            language_code=data.get("language_code"),
            jwt_token=data.get("jwt_token"),
            backend_user_id=data.get("backend_user_id"),
            email=data.get("email"),
            name=data.get("name"),
            role=data.get("role"),
            notifications_enabled=data.get("notifications_enabled", True),
            default_search_type=data.get("default_search_type", "all"),
            items_per_page=data.get("items_per_page", 5),
            is_authenticated=data.get("is_authenticated", False)
        )
    
    def is_admin(self) -> bool:
        """Проверка прав администратора"""
        return self.role == "admin"
    
    def can_create_collections(self) -> bool:
        """Может ли пользователь создавать коллекции"""
        return self.is_authenticated
    
    def can_download_files(self) -> bool:
        """Может ли пользователь скачивать файлы"""
        return True  # Публичная функция
    
    def update_from_telegram_user(self, tg_user) -> None:
        """Обновление данных из Telegram User"""
        self.username = tg_user.username
        self.first_name = tg_user.first_name
        self.last_name = tg_user.last_name
        self.language_code = tg_user.language_code
        self.last_activity = datetime.now()
    
    def update_from_backend_user(self, backend_data: Dict[str, Any]) -> None:
        """Обновление данных из Backend"""
        self.backend_user_id = backend_data.get("id")
        self.email = backend_data.get("email")
        self.name = backend_data.get("name")
        self.role = backend_data.get("role")
        self.is_authenticated = True