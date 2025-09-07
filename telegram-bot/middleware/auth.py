"""
Middleware для аутентификации пользователей
"""

from typing import Callable, Dict, Any, Awaitable, Optional
from aiogram import BaseMiddleware
from aiogram.types import TelegramObject, User as TgUser
from loguru import logger

from models.user import User
from config.database import db_manager
from services.api_client import api_client
import json


class AuthMiddleware(BaseMiddleware):
    """Middleware для обработки аутентификации пользователей"""
    
    async def __call__(
        self,
        handler: Callable[[TelegramObject, Dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: Dict[str, Any]
    ) -> Any:
        
        # Получаем пользователя из события
        telegram_user: Optional[TgUser] = data.get("event_from_user")
        
        if not telegram_user:
            # Если нет пользователя, продолжаем без аутентификации
            return await handler(event, data)
        
        try:
            # Загружаем или создаем пользователя
            user = await self._load_or_create_user(telegram_user)
            
            # Проверяем аутентификацию
            if user.jwt_token:
                await self._verify_authentication(user)
            
            # Добавляем пользователя в данные
            data["user"] = user
            
            logger.debug(f"Пользователь загружен: {user.telegram_id} | Аутентификация: {user.is_authenticated}")
            
        except Exception as e:
            logger.error(f"Ошибка в AuthMiddleware: {e}")
            # Создаем базового пользователя при ошибке
            data["user"] = User(telegram_id=telegram_user.id)
        
        return await handler(event, data)
    
    async def _load_or_create_user(self, telegram_user: TgUser) -> User:
        """Загрузка или создание пользователя"""
        
        # Пытаемся загрузить сессию из БД
        session_data = await db_manager.get_user_session(telegram_user.id)
        
        if session_data:
            # Восстанавливаем пользователя из сессии
            try:
                user_data = json.loads(session_data["user_data"])
                user = User.from_dict(user_data)
                user.jwt_token = session_data["jwt_token"]
                
                # Обновляем данные из Telegram
                user.update_from_telegram_user(telegram_user)
                
                return user
                
            except (json.JSONDecodeError, KeyError) as e:
                logger.warning(f"Ошибка восстановления сессии для {telegram_user.id}: {e}")
                # Удаляем поврежденную сессию
                await db_manager.delete_user_session(telegram_user.id)
        
        # Создаем нового пользователя
        user = User(telegram_id=telegram_user.id)
        user.update_from_telegram_user(telegram_user)
        
        # Загружаем настройки пользователя
        preferences = await db_manager.get_user_preferences(telegram_user.id)
        user.notifications_enabled = preferences.get("notifications", True)
        user.default_search_type = preferences.get("default_search_type", "all")
        user.items_per_page = preferences.get("items_per_page", 5)
        
        return user
    
    async def _verify_authentication(self, user: User) -> None:
        """Проверка действительности аутентификации"""
        
        if not user.jwt_token:
            return
        
        try:
            # Проверяем токен через API
            response = await api_client.verify_token(user.jwt_token)
            
            if response and not response.get("error"):
                # Токен действителен, обновляем данные пользователя
                user_info = response.get("user", {})
                if user_info:
                    user.update_from_backend_user(user_info)
                    user.is_authenticated = True
                else:
                    # Получаем полную информацию о пользователе
                    user_response = await api_client.get_user_info(user.jwt_token)
                    if user_response and not user_response.get("error"):
                        user_data = user_response.get("user", {})
                        user.update_from_backend_user(user_data)
                        user.is_authenticated = True
            else:
                # Токен недействителен
                logger.info(f"Недействительный токен для пользователя {user.telegram_id}")
                await self._clear_authentication(user)
                
        except Exception as e:
            logger.error(f"Ошибка проверки токена для {user.telegram_id}: {e}")
            # При ошибке проверки оставляем пользователя неаутентифицированным
            user.is_authenticated = False
    
    async def _clear_authentication(self, user: User) -> None:
        """Очистка аутентификации пользователя"""
        
        user.jwt_token = None
        user.backend_user_id = None
        user.email = None
        user.name = None
        user.role = None
        user.is_authenticated = False
        
        # Удаляем сессию из БД
        await db_manager.delete_user_session(user.telegram_id)
    
    async def save_user_session(self, user: User) -> None:
        """Сохранение сессии пользователя"""
        
        if not user.jwt_token:
            return
        
        try:
            # Подготавливаем данные для сохранения
            user_data = user.to_dict()
            user_data_json = json.dumps(user_data, ensure_ascii=False)
            
            # Вычисляем время истечения (7 дней)
            from datetime import datetime, timedelta
            expires_at = (datetime.now() + timedelta(days=7)).isoformat()
            
            # Сохраняем в БД
            await db_manager.save_user_session(
                telegram_id=user.telegram_id,
                jwt_token=user.jwt_token,
                user_data=user_data_json,
                expires_at=expires_at
            )
            
            # Сохраняем настройки
            preferences = {
                "language": user.language_code or "ru",
                "notifications": user.notifications_enabled,
                "default_search_type": user.default_search_type,
                "items_per_page": user.items_per_page
            }
            await db_manager.save_user_preferences(user.telegram_id, preferences)
            
        except Exception as e:
            logger.error(f"Ошибка сохранения сессии пользователя {user.telegram_id}: {e}")


# Глобальный экземпляр middleware
auth_middleware = AuthMiddleware()