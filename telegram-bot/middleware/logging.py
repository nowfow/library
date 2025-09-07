"""
Middleware для логирования запросов
"""

from typing import Callable, Dict, Any, Awaitable
from aiogram import BaseMiddleware
from aiogram.types import TelegramObject, Update, Message, CallbackQuery
from loguru import logger
import time


class LoggingMiddleware(BaseMiddleware):
    """Middleware для логирования входящих обновлений"""
    
    async def __call__(
        self,
        handler: Callable[[TelegramObject, Dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: Dict[str, Any]
    ) -> Any:
        
        start_time = time.time()
        
        # Определяем тип события и пользователя
        event_info = self._get_event_info(event)
        
        logger.info(f"Входящее обновление: {event_info}")
        
        try:
            # Выполняем обработчик
            result = await handler(event, data)
            
            # Вычисляем время обработки
            processing_time = time.time() - start_time
            
            logger.info(f"Обработка завершена за {processing_time:.3f}с: {event_info}")
            
            return result
            
        except Exception as e:
            # Логируем ошибку
            processing_time = time.time() - start_time
            logger.error(f"Ошибка обработки ({processing_time:.3f}с): {event_info} | Ошибка: {e}")
            raise
    
    def _get_event_info(self, event: TelegramObject) -> str:
        """Получение информации о событии для логирования"""
        
        if isinstance(event, Update):
            # Обработка Update
            if event.message:
                return self._format_message_info(event.message)
            elif event.callback_query:
                return self._format_callback_info(event.callback_query)
            elif event.inline_query:
                return f"InlineQuery from {event.inline_query.from_user.id}: '{event.inline_query.query}'"
            else:
                return f"Update: {type(event).__name__}"
        
        elif isinstance(event, Message):
            return self._format_message_info(event)
        
        elif isinstance(event, CallbackQuery):
            return self._format_callback_info(event)
        
        else:
            return f"Event: {type(event).__name__}"
    
    def _format_message_info(self, message: Message) -> str:
        """Форматирование информации о сообщении"""
        
        user_id = message.from_user.id if message.from_user else "Unknown"
        username = f"@{message.from_user.username}" if message.from_user and message.from_user.username else ""
        
        # Определяем тип сообщения
        if message.text:
            # Обрезаем длинные сообщения
            text = message.text[:50] + "..." if len(message.text) > 50 else message.text
            return f"Message from {user_id}{username}: '{text}'"
        
        elif message.photo:
            return f"Photo from {user_id}{username}"
        
        elif message.document:
            filename = message.document.file_name or "Unknown"
            return f"Document from {user_id}{username}: {filename}"
        
        elif message.voice:
            return f"Voice from {user_id}{username}"
        
        elif message.sticker:
            return f"Sticker from {user_id}{username}"
        
        else:
            return f"Message from {user_id}{username}: {message.content_type}"
    
    def _format_callback_info(self, callback: CallbackQuery) -> str:
        """Форматирование информации о callback запросе"""
        
        user_id = callback.from_user.id if callback.from_user else "Unknown"
        username = f"@{callback.from_user.username}" if callback.from_user and callback.from_user.username else ""
        callback_data = callback.data or "None"
        
        return f"Callback from {user_id}{username}: '{callback_data}'"


# Глобальный экземпляр middleware
logging_middleware = LoggingMiddleware()