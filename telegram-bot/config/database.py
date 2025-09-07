"""
Настройка базы данных для кеширования
"""

import aiosqlite
import asyncio
from typing import Optional, Dict, Any
from loguru import logger
from config.settings import settings


class DatabaseManager:
    """Менеджер базы данных для кеширования"""
    
    def __init__(self):
        self.db_path = settings.DATABASE_URL.replace("sqlite:///", "")
        self._connection: Optional[aiosqlite.Connection] = None
    
    async def init_db(self) -> None:
        """Инициализация базы данных"""
        try:
            self._connection = await aiosqlite.connect(self.db_path)
            await self._create_tables()
            logger.info(f"База данных инициализирована: {self.db_path}")
        except Exception as e:
            logger.error(f"Ошибка инициализации БД: {e}")
            raise
    
    async def _create_tables(self) -> None:
        """Создание таблиц"""
        await self._connection.execute("""
            CREATE TABLE IF NOT EXISTS user_sessions (
                telegram_id INTEGER PRIMARY KEY,
                jwt_token TEXT,
                user_data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE
            )
        """)
        
        await self._connection.execute("""
            CREATE TABLE IF NOT EXISTS search_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                query_hash TEXT UNIQUE,
                query_text TEXT,
                results TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP
            )
        """)
        
        await self._connection.execute("""
            CREATE TABLE IF NOT EXISTS user_preferences (
                telegram_id INTEGER PRIMARY KEY,
                language TEXT DEFAULT 'ru',
                notifications BOOLEAN DEFAULT TRUE,
                default_search_type TEXT DEFAULT 'all',
                items_per_page INTEGER DEFAULT 5,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        await self._connection.commit()
    
    async def save_user_session(self, telegram_id: int, jwt_token: str, 
                              user_data: str, expires_at: str) -> None:
        """Сохранение пользовательской сессии"""
        try:
            await self._connection.execute("""
                INSERT OR REPLACE INTO user_sessions 
                (telegram_id, jwt_token, user_data, expires_at, is_active)
                VALUES (?, ?, ?, ?, ?)
            """, (telegram_id, jwt_token, user_data, expires_at, True))
            await self._connection.commit()
            logger.debug(f"Сессия сохранена для пользователя {telegram_id}")
        except Exception as e:
            logger.error(f"Ошибка сохранения сессии: {e}")
    
    async def get_user_session(self, telegram_id: int) -> Optional[Dict[str, Any]]:
        """Получение пользовательской сессии"""
        try:
            cursor = await self._connection.execute("""
                SELECT jwt_token, user_data, expires_at, is_active
                FROM user_sessions 
                WHERE telegram_id = ? AND is_active = TRUE
            """, (telegram_id,))
            row = await cursor.fetchone()
            
            if row:
                return {
                    "jwt_token": row[0],
                    "user_data": row[1],
                    "expires_at": row[2],
                    "is_active": row[3]
                }
            return None
        except Exception as e:
            logger.error(f"Ошибка получения сессии: {e}")
            return None
    
    async def delete_user_session(self, telegram_id: int) -> None:
        """Удаление пользовательской сессии"""
        try:
            await self._connection.execute("""
                UPDATE user_sessions 
                SET is_active = FALSE 
                WHERE telegram_id = ?
            """, (telegram_id,))
            await self._connection.commit()
            logger.debug(f"Сессия удалена для пользователя {telegram_id}")
        except Exception as e:
            logger.error(f"Ошибка удаления сессии: {e}")
    
    async def save_search_cache(self, query_hash: str, query_text: str, 
                              results: str, expires_at: str) -> None:
        """Сохранение результатов поиска в кеш"""
        try:
            await self._connection.execute("""
                INSERT OR REPLACE INTO search_cache
                (query_hash, query_text, results, expires_at)
                VALUES (?, ?, ?, ?)
            """, (query_hash, query_text, results, expires_at))
            await self._connection.commit()
        except Exception as e:
            logger.error(f"Ошибка сохранения кеша поиска: {e}")
    
    async def get_search_cache(self, query_hash: str) -> Optional[str]:
        """Получение результатов поиска из кеша"""
        try:
            cursor = await self._connection.execute("""
                SELECT results FROM search_cache 
                WHERE query_hash = ? AND datetime('now') < expires_at
            """, (query_hash,))
            row = await cursor.fetchone()
            return row[0] if row else None
        except Exception as e:
            logger.error(f"Ошибка получения кеша поиска: {e}")
            return None
    
    async def save_user_preferences(self, telegram_id: int, preferences: Dict[str, Any]) -> None:
        """Сохранение пользовательских настроек"""
        try:
            await self._connection.execute("""
                INSERT OR REPLACE INTO user_preferences
                (telegram_id, language, notifications, default_search_type, items_per_page)
                VALUES (?, ?, ?, ?, ?)
            """, (
                telegram_id,
                preferences.get("language", "ru"),
                preferences.get("notifications", True),
                preferences.get("default_search_type", "all"),
                preferences.get("items_per_page", 5)
            ))
            await self._connection.commit()
        except Exception as e:
            logger.error(f"Ошибка сохранения настроек: {e}")
    
    async def get_user_preferences(self, telegram_id: int) -> Dict[str, Any]:
        """Получение пользовательских настроек"""
        try:
            cursor = await self._connection.execute("""
                SELECT language, notifications, default_search_type, items_per_page
                FROM user_preferences WHERE telegram_id = ?
            """, (telegram_id,))
            row = await cursor.fetchone()
            
            if row:
                return {
                    "language": row[0],
                    "notifications": row[1],
                    "default_search_type": row[2],
                    "items_per_page": row[3]
                }
            
            # Настройки по умолчанию
            return {
                "language": "ru",
                "notifications": True,
                "default_search_type": "all",
                "items_per_page": 5
            }
        except Exception as e:
            logger.error(f"Ошибка получения настроек: {e}")
            return {
                "language": "ru",
                "notifications": True,
                "default_search_type": "all",
                "items_per_page": 5
            }
    
    async def cleanup_expired_data(self) -> None:
        """Очистка устаревших данных"""
        try:
            # Удаляем устаревшие сессии
            await self._connection.execute("""
                UPDATE user_sessions 
                SET is_active = FALSE 
                WHERE datetime('now') > expires_at
            """)
            
            # Удаляем устаревший кеш поиска
            await self._connection.execute("""
                DELETE FROM search_cache 
                WHERE datetime('now') > expires_at
            """)
            
            await self._connection.commit()
            logger.debug("Очистка устаревших данных выполнена")
        except Exception as e:
            logger.error(f"Ошибка очистки данных: {e}")
    
    async def close(self) -> None:
        """Закрытие соединения с БД"""
        if self._connection:
            await self._connection.close()
            logger.info("Соединение с БД закрыто")


# Глобальный экземпляр менеджера БД
db_manager = DatabaseManager()