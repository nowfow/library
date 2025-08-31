from aiogram import Router, F
from aiogram.types import Message
from aiogram.fsm.context import FSMContext
import logging

from app.handlers.commands.search import perform_search

router = Router()
logger = logging.getLogger(__name__)

@router.message(F.text, lambda message, state: state and state.get_state() and "query" in state.get_state())
async def handle_search_query(message: Message, state: FSMContext):
    """Handle search query input from user"""
    current_state = await state.get_state()
    query = message.text.strip()
    
    if not query:
        await message.answer("Please enter a valid search query.")
        return
    
    # Determine search type from state
    if current_state == "waiting_for_composer_query":
        search_type = "composer"
    elif current_state == "waiting_for_work_query": 
        search_type = "work"
    elif current_state == "waiting_for_term_query":
        search_type = "term"
    elif current_state == "waiting_for_universal_query":
        search_type = "universal"
    else:
        search_type = "universal"
    
    # Clear state
    await state.clear()
    
    # Perform the search
    await perform_search(message, query, search_type)