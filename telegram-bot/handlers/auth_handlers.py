"""
Обработчики аутентификации и авторизации
"""

from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.filters import Command, StateFilter
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from loguru import logger

from models.user import User
from services.api_client import api_client
from middleware.auth import auth_middleware
from keyboards.inline import main_menu_keyboard, auth_keyboard
from keyboards.reply import main_menu_reply, auth_menu_reply, cancel_reply, remove_keyboard
from utils.formatters import format_user_info, format_error_message
from utils.validators import validate_email, validate_password, validate_name

router = Router()


class AuthStates(StatesGroup):
    """Состояния для процесса аутентификации"""
    waiting_for_email = State()
    waiting_for_password = State()
    waiting_for_name = State()
    waiting_for_confirm_password = State()


# Команда /start
@router.message(Command("start"))
async def cmd_start(message: Message, user: User):
    """Обработчик команды /start"""
    
    welcome_text = f"👋 Добро пожаловать в <b>Музыкальную библиотеку нот валторны</b>!\n\n"
    
    if user.is_authenticated:
        welcome_text += f"🎵 Привет, <b>{user.full_name}</b>!\n\n"
        welcome_text += (
            "Здесь вы можете:\n"
            "🔍 Искать ноты по композиторам и произведениям\n"
            "📚 Изучать музыкальные термины\n"
            "📁 Создавать свои коллекции нот\n"
            "📥 Скачивать PDF файлы прямо в чат\n\n"
            "Выберите действие в меню ниже:"
        )
        
        await message.answer(
            text=welcome_text,
            reply_markup=main_menu_keyboard()
        )
        
        # Устанавливаем основную клавиатуру
        await message.answer(
            "🎼 Используйте кнопки ниже для быстрого доступа:",
            reply_markup=main_menu_reply()
        )
    else:
        welcome_text += (
            "Для полного доступа к функциям библиотеки рекомендуем авторизоваться.\n\n"
            "🔐 <b>С авторизацией доступно:</b>\n"
            "• Создание личных коллекций\n"
            "• Сохранение истории поиска\n"
            "• Персональные настройки\n\n"
            "🔍 <b>Без авторизации:</b>\n"
            "• Поиск произведений и терминов\n"
            "• Просмотр информации\n"
            "• Скачивание файлов\n\n"
            "Выберите действие:"
        )
        
        await message.answer(
            text=welcome_text,
            reply_markup=auth_keyboard()
        )
        
        await message.answer(
            "🎼 Выберите действие:",
            reply_markup=auth_menu_reply()
        )


# Команда /help
@router.message(Command("help"))
async def cmd_help(message: Message, user: User):
    """Обработчик команды /help"""
    
    help_text = (
        "🆘 <b>Справка по командам бота</b>\n\n"
        
        "📋 <b>Основные команды:</b>\n"
        "/start - Начать работу с ботом\n"
        "/help - Показать эту справку\n"
        "/profile - Просмотр профиля\n"
        "/stats - Статистика библиотеки\n\n"
        
        "🔐 <b>Авторизация:</b>\n"
        "/login - Войти в аккаунт\n"
        "/register - Создать новый аккаунт\n"
        "/logout - Выйти из аккаунта\n\n"
        
        "🔍 <b>Поиск:</b>\n"
        "/search <запрос> - Поиск произведений\n"
        "/composer <имя> - Произведения композитора\n"
        "/term <термин> - Поиск термина\n"
        "/categories - Список категорий\n\n"
    )
    
    if user.is_authenticated:
        help_text += (
            "📁 <b>Коллекции (только для авторизованных):</b>\n"
            "/collections - Мои коллекции\n"
            "/create_collection <название> - Создать коллекцию\n\n"
        )
    
    help_text += (
        "💡 <b>Советы:</b>\n"
        "• Используйте кнопки меню для навигации\n"
        "• В поиске можно допускать опечатки\n"
        "• Поиск работает по частичным совпадениям\n"
        "• Файлы отправляются прямо в чат\n\n"
        
        "❓ <b>Проблемы?</b>\n"
        "Если что-то работает некорректно, используйте /start для возврата в главное меню."
    )
    
    await message.answer(
        text=help_text,
        reply_markup=main_menu_keyboard() if user.is_authenticated else auth_keyboard()
    )


# Обработчик кнопки "Войти"
@router.callback_query(F.data == "login")
@router.message(F.text.in_(["🔐 Войти", "🔐 Войти в аккаунт"]))
async def process_login(event, state: FSMContext, user: User):
    """Начало процесса авторизации"""
    
    if user.is_authenticated:
        text = f"🔐 Вы уже авторизованы как <b>{user.full_name}</b>"
        
        if hasattr(event, 'answer'):  # CallbackQuery
            await event.answer()
            await event.message.edit_text(text, reply_markup=main_menu_keyboard())
        else:  # Message
            await event.answer(text, reply_markup=main_menu_keyboard())
        return
    
    text = (
        "🔐 <b>Вход в аккаунт</b>\n\n"
        "Введите ваш email адрес:"
    )
    
    await state.set_state(AuthStates.waiting_for_email)
    
    if hasattr(event, 'answer'):  # CallbackQuery
        await event.answer()
        await event.message.edit_text(text)
        await event.message.answer("📧 Ожидаю email:", reply_markup=cancel_reply())
    else:  # Message
        await event.answer(text, reply_markup=cancel_reply())


# Обработчик ввода email для входа
@router.message(StateFilter(AuthStates.waiting_for_email))
async def process_email_login(message: Message, state: FSMContext, user: User):
    """Обработка ввода email для входа"""
    
    if message.text == "❌ Отмена":
        await state.clear()
        await message.answer(
            "❌ Вход отменен",
            reply_markup=auth_menu_reply()
        )
        return
    
    email = message.text.strip().lower()
    
    # Валидация email
    if not validate_email(email):
        await message.answer(
            "❌ Неверный формат email адреса. Попробуйте еще раз:",
            reply_markup=cancel_reply()
        )
        return
    
    # Сохраняем email в состояние
    await state.update_data(email=email)
    await state.set_state(AuthStates.waiting_for_password)
    
    await message.answer(
        f"📧 Email: <b>{email}</b>\n\n🔑 Теперь введите пароль:",
        reply_markup=cancel_reply()
    )


# Обработчик ввода пароля для входа
@router.message(StateFilter(AuthStates.waiting_for_password))
async def process_password_login(message: Message, state: FSMContext, user: User):
    """Обработка ввода пароля для входа"""
    
    if message.text == "❌ Отмена":
        await state.clear()
        await message.answer(
            "❌ Вход отменен",
            reply_markup=auth_menu_reply()
        )
        return
    
    password = message.text
    data = await state.get_data()
    email = data.get("email")
    
    # Удаляем сообщение с паролем из соображений безопасности
    try:
        await message.delete()
    except:
        pass
    
    # Показываем индикатор загрузки
    loading_msg = await message.answer("🔄 Выполняется вход...")
    
    try:
        # Пытаемся войти через API
        response = await api_client.login_user(email, password)
        
        if response and not response.get("error"):
            # Успешный вход
            user_data = response.get("user", {})
            token = response.get("token")
            
            # Обновляем данные пользователя
            user.jwt_token = token
            user.update_from_backend_user(user_data)
            
            # Сохраняем сессию
            await auth_middleware.save_user_session(user)
            
            await loading_msg.edit_text(
                f"✅ <b>Добро пожаловать, {user.full_name}!</b>\n\n"
                f"📧 Email: {user.email}\n"
                f"⭐ Роль: {'Администратор' if user.is_admin() else 'Пользователь'}",
                reply_markup=main_menu_keyboard()
            )
            
            await message.answer(
                "🎼 Теперь доступны все функции бота:",
                reply_markup=main_menu_reply()
            )
            
        else:
            # Ошибка входа
            error_msg = response.get("message", "Неизвестная ошибка") if response else "Ошибка соединения"
            
            await loading_msg.edit_text(
                f"❌ Ошибка входа: {error_msg}\n\n"
                "Проверьте правильность email и пароля.",
                reply_markup=auth_keyboard()
            )
    
    except Exception as e:
        logger.error(f"Ошибка входа для {email}: {e}")
        await loading_msg.edit_text(
            "❌ Произошла ошибка при входе. Попробуйте позже.",
            reply_markup=auth_keyboard()
        )
    
    finally:
        await state.clear()


# Обработчик кнопки "Регистрация"
@router.callback_query(F.data == "register")
@router.message(F.text.in_(["📝 Регистрация", "📝 Зарегистрироваться"]))
async def process_register(event, state: FSMContext, user: User):
    """Начало процесса регистрации"""
    
    if user.is_authenticated:
        text = f"📝 Вы уже зарегистрированы как <b>{user.full_name}</b>"
        
        if hasattr(event, 'answer'):  # CallbackQuery
            await event.answer()
            await event.message.edit_text(text, reply_markup=main_menu_keyboard())
        else:  # Message
            await event.answer(text, reply_markup=main_menu_keyboard())
        return
    
    text = (
        "📝 <b>Регистрация нового аккаунта</b>\n\n"
        "Введите ваш email адрес:"
    )
    
    await state.set_state(AuthStates.waiting_for_email)
    await state.update_data(action="register")
    
    if hasattr(event, 'answer'):  # CallbackQuery
        await event.answer()
        await event.message.edit_text(text)
        await event.message.answer("📧 Ожидаю email:", reply_markup=cancel_reply())
    else:  # Message
        await event.answer(text, reply_markup=cancel_reply())


# Команда /profile
@router.message(Command("profile"))
@router.callback_query(F.data == "profile")
async def cmd_profile(event, user: User):
    """Просмотр профиля пользователя"""
    
    if not user.is_authenticated:
        text = "🔐 Для просмотра профиля необходимо авторизоваться"
        keyboard = auth_keyboard()
    else:
        try:
            # Получаем актуальную информацию о пользователе
            response = await api_client.get_user_info(user.jwt_token)
            
            if response and not response.get("error"):
                user_data = response.get("user", {})
                text = format_user_info(user_data)
            else:
                text = "❌ Ошибка получения информации о профиле"
        except Exception as e:
            logger.error(f"Ошибка получения профиля для {user.telegram_id}: {e}")
            text = "❌ Ошибка получения информации о профиле"
        
        keyboard = main_menu_keyboard()
    
    if hasattr(event, 'answer'):  # CallbackQuery
        await event.answer()
        await event.message.edit_text(text, reply_markup=keyboard)
    else:  # Message
        await event.answer(text, reply_markup=keyboard)


# Команда /logout
@router.message(Command("logout"))
@router.callback_query(F.data == "logout")
async def cmd_logout(event, user: User):
    """Выход из аккаунта"""
    
    if not user.is_authenticated:
        text = "🔐 Вы не авторизованы"
        keyboard = auth_keyboard()
    else:
        # Очищаем аутентификацию
        user.jwt_token = None
        user.backend_user_id = None
        user.email = None
        user.name = None
        user.role = None
        user.is_authenticated = False
        
        # Удаляем сессию из БД
        from config.database import db_manager
        await db_manager.delete_user_session(user.telegram_id)
        
        text = f"👋 До свидания, <b>{user.full_name}</b>!\n\nВы успешно вышли из аккаунта."
        keyboard = auth_keyboard()
    
    if hasattr(event, 'answer'):  # CallbackQuery
        await event.answer()
        await event.message.edit_text(text, reply_markup=keyboard)
        await event.message.answer("🎼 Выберите действие:", reply_markup=auth_menu_reply())
    else:  # Message
        await event.answer(text, reply_markup=keyboard)
        await event.answer("🎼 Выберите действие:", reply_markup=auth_menu_reply())


# Обработчик отмены
@router.message(F.text == "❌ Отмена")
async def process_cancel(message: Message, state: FSMContext, user: User):
    """Отмена текущего действия"""
    
    await state.clear()
    
    if user.is_authenticated:
        await message.answer(
            "❌ Действие отменено",
            reply_markup=main_menu_reply()
        )
    else:
        await message.answer(
            "❌ Действие отменено",
            reply_markup=auth_menu_reply()
        )