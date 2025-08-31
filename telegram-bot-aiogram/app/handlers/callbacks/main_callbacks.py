from aiogram import Router, F
from aiogram.types import CallbackQuery
from aiogram.fsm.context import FSMContext
import logging

from app.keyboards.inline import MainKeyboard, SearchKeyboard
from app.handlers.commands.search import perform_search
from app.services.api_client import APIClient, APIException
from app.utils.formatters import format_work_details

router = Router()
logger = logging.getLogger(__name__)

@router.callback_query(F.data == "menu:main")
async def callback_main_menu(callback: CallbackQuery):
    """Handle main menu callback"""
    await callback.message.edit_text(
        "🏠 <b>Main Menu</b>\n\n"
        "Choose what you'd like to do:",
        reply_markup=MainKeyboard.get_main_menu(is_authenticated=False)
    )
    await callback.answer()

@router.callback_query(F.data == "search:start")
async def callback_search_start(callback: CallbackQuery):
    """Handle search start callback"""
    await callback.message.edit_text(
        "🔍 <b>Search in Music Library</b>\n\n"
        "Choose the type of search you want to perform:",
        reply_markup=SearchKeyboard.get_search_types()
    )
    await callback.answer()

@router.callback_query(F.data.startswith("search:"))
async def callback_search_type(callback: CallbackQuery, state: FSMContext):
    """Handle search type selection"""
    search_type = callback.data.split(":")[1]
    
    if search_type == "composer":
        await callback.message.edit_text(
            "🎼 <b>Search by Composer</b>\n\n"
            "Please enter the composer's name:",
            reply_markup=SearchKeyboard.get_search_types()
        )
        await state.set_state("waiting_for_composer_query")
    
    elif search_type == "work":
        await callback.message.edit_text(
            "🎹 <b>Search by Work</b>\n\n"
            "Please enter the work title:",
            reply_markup=SearchKeyboard.get_search_types()
        )
        await state.set_state("waiting_for_work_query")
    
    elif search_type == "term":
        await callback.message.edit_text(
            "📖 <b>Search Musical Terms</b>\n\n"
            "Please enter the musical term:",
            reply_markup=SearchKeyboard.get_search_types()
        )
        await state.set_state("waiting_for_term_query")
    
    elif search_type == "universal":
        await callback.message.edit_text(
            "🔍 <b>Universal Search</b>\n\n"
            "Please enter your search query:",
            reply_markup=SearchKeyboard.get_search_types()
        )
        await state.set_state("waiting_for_universal_query")
    
    await callback.answer()

@router.callback_query(F.data == "browse:start")
async def callback_browse_start(callback: CallbackQuery):
    """Handle browse files callback"""
    await callback.message.edit_text(
        "📁 <b>File Browser</b>\n\n"
        "🔧 File browsing functionality is under development.\n"
        "This will allow you to navigate through music files in the cloud storage.",
        reply_markup=MainKeyboard.get_main_menu()
    )
    await callback.answer()

@router.callback_query(F.data == "collections:list")
async def callback_collections_list(callback: CallbackQuery):
    """Handle collections list callback"""
    await callback.message.edit_text(
        "📚 <b>Your Collections</b>\n\n"
        "🔧 Collections functionality is under development.\n"
        "This will allow you to create and manage your personal music collections.",
        reply_markup=MainKeyboard.get_main_menu()
    )
    await callback.answer()

@router.callback_query(F.data == "auth:login")
async def callback_auth_login(callback: CallbackQuery):
    """Handle login callback"""
    await callback.message.edit_text(
        "🔐 <b>User Login</b>\n\n"
        "🔧 Authentication is under development.\n"
        "This will allow you to log in and access personalized features.",
        reply_markup=MainKeyboard.get_main_menu()
    )
    await callback.answer()

@router.callback_query(F.data == "auth:register")
async def callback_auth_register(callback: CallbackQuery):
    """Handle register callback"""
    await callback.message.edit_text(
        "📝 <b>User Registration</b>\n\n"
        "🔧 Registration is under development.\n"
        "This will allow you to create an account and access all features.",
        reply_markup=MainKeyboard.get_main_menu()
    )
    await callback.answer()

@router.callback_query(F.data.startswith("work:show:"))
async def callback_work_show(callback: CallbackQuery):
    """Handle work details callback"""
    work_id = callback.data.split(":")[2]
    
    try:
        await callback.bot.send_chat_action(callback.message.chat.id, "typing")
        
        api_client = APIClient()
        work_details = await api_client.get_work_details(int(work_id))
        
        if work_details and not work_details.get("error"):
            details_text = format_work_details(work_details)
            
            # Try to get associated files
            try:
                files = await api_client.get_work_files(int(work_id))
                if files:
                    details_text += "\n\n📁 <b>Files:</b>\n"
                    for i, file_info in enumerate(files[:5], 1):
                        file_name = file_info.get("name", "Unknown")
                        details_text += f"{i}. {file_name}\n"
                    if len(files) > 5:
                        details_text += f"<i>... and {len(files) - 5} more files</i>"
            except Exception:
                pass  # Files not critical
            
            await callback.message.edit_text(
                f"🎵 <b>Work Details</b>\n\n{details_text}",
                reply_markup=MainKeyboard.get_main_menu()
            )
        else:
            await callback.message.edit_text(
                f"❌ Work with ID {work_id} not found.\n\n"
                "The work may have been removed or the link is outdated.",
                reply_markup=MainKeyboard.get_main_menu()
            )
        
    except APIException as e:
        logger.error(f"API error loading work {work_id}: {e}")
        await callback.message.edit_text(
            "❌ Unable to load work details at the moment.\n\n"
            "Please try again later.",
            reply_markup=MainKeyboard.get_main_menu()
        )
    except Exception as e:
        logger.error(f"Error loading work {work_id}: {e}")
        await callback.message.edit_text(
            f"🎵 <b>Work Details</b>\n\n"
            f"Work ID: {work_id}\n\n"
            "🔧 Detailed work information is under development.\n"
            "This will show complete information about the musical work including files and metadata.",
            reply_markup=MainKeyboard.get_main_menu()
        )
    
    await callback.answer()