"""
Обработчики работы с файлами
"""

from aiogram import Router, F
from aiogram.types import CallbackQuery, FSInputFile
from loguru import logger
import aiohttp
import aiofiles
import os
import tempfile

from models.user import User
from services.api_client import api_client
from keyboards.inline import main_menu_keyboard
from utils.validators import sanitize_filename

router = Router()


@router.callback_query(F.data.startswith("download_work_"))
async def download_work(callback: CallbackQuery, user: User):
    """Скачивание произведения"""
    
    try:
        work_id = int(callback.data.split("_")[-1])
        
        await callback.answer()
        await callback.message.edit_text("📥 Подготавливаю файл для скачивания...")
        
        # Получаем информацию о произведении
        work_response = await api_client.get_work_by_id(work_id, user.jwt_token)
        
        if not work_response or work_response.get("error"):
            await callback.message.edit_text(
                "❌ Произведение не найдено",
                reply_markup=main_menu_keyboard()
            )
            return
        
        work_data = work_response.get("data", work_response)
        file_path = work_data.get("file_path")
        work_title = work_data.get("work_title", "Unknown")
        composer = work_data.get("composer", "Unknown")
        
        if not file_path:
            await callback.message.edit_text(
                "❌ Файл не найден",
                reply_markup=main_menu_keyboard()
            )
            return
        
        # Получаем URL для скачивания
        download_url = await api_client.download_file_url(file_path, user.jwt_token)
        
        # Скачиваем файл во временную директорию
        temp_dir = tempfile.gettempdir()
        safe_filename = sanitize_filename(f"{composer} - {work_title}.pdf")
        temp_file_path = os.path.join(temp_dir, safe_filename)
        
        try:
            session = await api_client._get_session()
            async with session.get(download_url) as response:
                if response.status == 200:
                    async with aiofiles.open(temp_file_path, 'wb') as f:
                        async for chunk in response.content.iter_chunked(8192):
                            await f.write(chunk)
                else:
                    await callback.message.edit_text(
                        "❌ Ошибка скачивания файла",
                        reply_markup=main_menu_keyboard()
                    )
                    return
        
        except Exception as e:
            logger.error(f"Ошибка скачивания файла {file_path}: {e}")
            await callback.message.edit_text(
                "❌ Ошибка скачивания файла",
                reply_markup=main_menu_keyboard()
            )
            return
        
        # Отправляем файл пользователю
        try:
            document = FSInputFile(temp_file_path, filename=safe_filename)
            
            caption = f"🎵 <b>{work_title}</b>\n👨‍🎼 {composer}"
            
            await callback.message.answer_document(
                document=document,
                caption=caption,
                reply_markup=main_menu_keyboard()
            )
            
            await callback.message.edit_text(
                f"✅ Файл отправлен: <b>{work_title}</b>",
                reply_markup=main_menu_keyboard()
            )
            
        except Exception as e:
            logger.error(f"Ошибка отправки файла {safe_filename}: {e}")
            await callback.message.edit_text(
                "❌ Ошибка отправки файла",
                reply_markup=main_menu_keyboard()
            )
        finally:
            # Удаляем временный файл
            try:
                os.unlink(temp_file_path)
            except:
                pass
        
    except (ValueError, IndexError) as e:
        logger.error(f"Ошибка парсинга work_id: {callback.data} | {e}")
        await callback.answer("❌ Ошибка скачивания")
    except Exception as e:
        logger.error(f"Ошибка скачивания произведения: {e}")
        await callback.message.edit_text(
            "❌ Ошибка скачивания",
            reply_markup=main_menu_keyboard()
        )


@router.callback_query(F.data.startswith("thumbnail_"))
async def get_thumbnail(callback: CallbackQuery, user: User):
    """Получение миниатюры произведения"""
    
    try:
        work_id = int(callback.data.split("_")[-1])
        
        await callback.answer("🖼️ Получаю миниатюру...")
        
        # В будущем здесь будет загрузка миниатюры
        await callback.message.answer(
            "🖼️ Миниатюра произведения\n\n🚧 Функция в разработке..."
        )
        
    except Exception as e:
        logger.error(f"Ошибка получения миниатюры: {e}")
        await callback.answer("❌ Ошибка получения миниатюры")