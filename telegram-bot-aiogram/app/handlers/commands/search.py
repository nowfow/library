from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
import logging

from app.keyboards.inline import SearchKeyboard, MainKeyboard
from app.services.api_client import APIClient, APIException
from app.utils.formatters import format_search_results
from app.config.settings import settings

router = Router()
logger = logging.getLogger(__name__)

class SearchStates(StatesGroup):
    """States for search functionality"""
    waiting_for_query = State()
    waiting_for_composer = State()
    waiting_for_work = State()
    waiting_for_term = State()

@router.message(Command("search"))
async def cmd_search(message: Message):
    """Handle /search command"""
    args = message.text.split(maxsplit=1)
    
    if len(args) > 1:
        # Direct search with query
        query = args[1]
        await perform_search(message, query, "universal")
    else:
        # Show search options
        await message.answer(
            "🔍 <b>Search in Music Library</b>\n\n"
            "Enter your search query or choose a specific search type:",
            reply_markup=SearchKeyboard.get_search_types()
        )

@router.message(Command("composer"))
async def cmd_search_composer(message: Message):
    """Handle /composer command"""
    args = message.text.split(maxsplit=1)
    if len(args) > 1:
        await perform_search(message, args[1], "composer")
    else:
        await message.answer("🎼 Please specify the composer name.\n\nExample: <code>/composer Bach</code>")

@router.message(Command("work"))
async def cmd_search_work(message: Message):
    """Handle /work command"""
    args = message.text.split(maxsplit=1)
    if len(args) > 1:
        await perform_search(message, args[1], "work")
    else:
        await message.answer("🎹 Please specify the work title.\n\nExample: <code>/work Moonlight Sonata</code>")

@router.message(Command("term"))
async def cmd_search_term(message: Message):
    """Handle /term command"""
    args = message.text.split(maxsplit=1)
    if len(args) > 1:
        await perform_search(message, args[1], "term")
    else:
        await message.answer("📖 Please specify the musical term.\n\nExample: <code>/term allegro</code>")

async def perform_search(message: Message, query: str, search_type: str):
    """Perform search operation using API client"""
    try:
        await message.bot.send_chat_action(message.chat.id, "typing")
        
        # Initialize API client
        api_client = APIClient()
        results = []
        
        try:
            if search_type == "composer":
                title = f"🎼 Composer: {query}"
                # Search for composer and their works
                composer_results = await api_client.search_composers(query)
                if composer_results:
                    # Also get works by this composer
                    work_results = await api_client.search_works(composer=query, limit=settings.MAX_SEARCH_RESULTS)
                    results = work_results
                
            elif search_type == "work":
                title = f"🎹 Work: {query}"
                results = await api_client.search_works(work=query, limit=settings.MAX_SEARCH_RESULTS)
                
            elif search_type == "term":
                title = f"📖 Term: {query}"
                results = await api_client.search_terms(query)
                
            else:  # universal search
                title = f"🔍 Search: {query}"
                # Combine multiple search types
                work_results = await api_client.search_works(composer=query, limit=10)
                work_results.extend(await api_client.search_works(work=query, limit=10))
                term_results = await api_client.search_terms(query)
                
                # Combine results (limit total)
                results = work_results[:15] + term_results[:5]
        
        except APIException as api_error:
            logger.error(f"API error during {search_type} search for '{query}': {api_error}")
            await message.answer(
                f"❌ Search service is currently unavailable.\n\n"
                f"Please try again later or contact support if the issue persists.",
                reply_markup=SearchKeyboard.get_search_types()
            )
            return
        
        except Exception as api_error:
            logger.error(f"Unexpected error during {search_type} search for '{query}': {api_error}")
            # Fall back to mock results for demonstration
            results = [
                {"work_id": 1, "composer": "J.S. Bach", "title": f"Sample result for '{query}'"},
                {"work_id": 2, "composer": "W.A. Mozart", "title": f"Another result for '{query}'"}
            ]
        
        if not results:
            await message.answer(
                f"❌ No results found for '{query}'\n\n"
                "Try different search terms or check the spelling.",
                reply_markup=SearchKeyboard.get_search_types()
            )
            return
        
        # Format and display results
        formatted_results = format_search_results(results, search_type)
        keyboard = SearchKeyboard.get_results_keyboard(results)
        
        response_text = f"{title}\n\n{formatted_results}"
        
        # Ensure message isn't too long for Telegram
        if len(response_text) > 4000:
            response_text = response_text[:3900] + "\n\n<i>... results truncated</i>"
        
        await message.answer(response_text, reply_markup=keyboard)
        
    except Exception as e:
        logger.error(f"General error in perform_search: {e}")
        await message.answer(
            "❌ Search error occurred. Please try again later.",
            reply_markup=MainKeyboard.get_main_menu()
        )