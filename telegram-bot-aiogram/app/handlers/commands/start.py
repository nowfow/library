from aiogram import Router, F
from aiogram.types import Message
from aiogram.filters import Command, CommandStart

from app.keyboards.inline import MainKeyboard

router = Router()

@router.message(CommandStart())
async def cmd_start(message: Message):
    """Handle /start command"""
    user_name = message.from_user.first_name or "User"
    
    welcome_text = (
        f"🎵 <b>Welcome to Music Library, {user_name}!</b>\n\n"
        "I'm your personal assistant for exploring the music collection. "
        "Here's what I can help you with:\n\n"
        "🔍 <b>Search</b> - Find composers, works, and musical terms\n"
        "📁 <b>Browse Files</b> - Navigate through music files\n"
        "📚 <b>Collections</b> - Manage your personal collections\n"
        "🎼 <b>Quick Access</b> - Direct commands for instant results\n\n"
        "Choose an option below to get started:"
    )
    
    keyboard = MainKeyboard.get_main_menu(is_authenticated=False)
    await message.answer(welcome_text, reply_markup=keyboard)

@router.message(Command("help"))
async def cmd_help(message: Message):
    """Handle /help command"""
    help_text = (
        "🤖 <b>Music Library Bot - Command Guide</b>\n\n"
        
        "<b>🔍 Search Commands:</b>\n"
        "• <code>/search &lt;query&gt;</code> - Universal search\n"
        "• <code>/composer &lt;name&gt;</code> - Search by composer\n"
        "• <code>/work &lt;title&gt;</code> - Search by work title\n"
        "• <code>/term &lt;term&gt;</code> - Search musical terms\n\n"
        
        "<b>📁 File Commands:</b>\n"
        "• <code>/browse</code> - Browse file directory\n"
        "• <code>/download &lt;path&gt;</code> - Download file\n"
        "• <code>/recent</code> - Show recent files\n\n"
        
        "<b>📚 Collection Commands:</b>\n"
        "• <code>/collections</code> - Manage collections\n"
        "• <code>/create &lt;name&gt;</code> - Create new collection\n\n"
        
        "<b>👤 User Commands:</b>\n"
        "• <code>/login</code> - User login\n"
        "• <code>/register</code> - User registration\n"
        "• <code>/profile</code> - View profile\n\n"
        
        "<b>ℹ️ General:</b>\n"
        "• <code>/menu</code> - Main navigation menu\n"
        "• <code>/help</code> - Show this help\n\n"
        
        "💡 <i>Tip: You can also use the interactive buttons for easier navigation!</i>"
    )
    
    keyboard = MainKeyboard.get_main_menu(is_authenticated=False)
    await message.answer(help_text, reply_markup=keyboard)

@router.message(Command("menu"))
async def cmd_menu(message: Message):
    """Handle /menu command"""
    menu_text = (
        "🏠 <b>Main Menu</b>\n\n"
        "Choose what you'd like to do:"
    )
    
    keyboard = MainKeyboard.get_main_menu(is_authenticated=False)
    await message.answer(menu_text, reply_markup=keyboard)