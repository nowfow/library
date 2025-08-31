from typing import List, Dict, Any
import html

def format_search_results(results: List[Dict[str, Any]], search_type: str) -> str:
    """Format search results for display"""
    if not results:
        return "No results found."
    
    formatted_lines = []
    
    for i, result in enumerate(results[:10], 1):  # Show max 10 results
        if search_type == "composer":
            composer = result.get("name", result.get("composer", "Unknown"))
            works_count = result.get("works_count", 0)
            line = f"{i}. 🎼 <b>{escape_html(composer)}</b>"
            if works_count > 0:
                line += f" ({works_count} works)"
        
        elif search_type == "work":
            composer = result.get("composer", "Unknown")
            title = result.get("title", result.get("name", "Untitled"))
            line = f"{i}. 🎵 <b>{escape_html(title)}</b>\n   by {escape_html(composer)}"
        
        elif search_type == "term":
            term = result.get("term", result.get("name", "Unknown"))
            definition = result.get("definition", "")
            line = f"{i}. 📖 <b>{escape_html(term)}</b>"
            if definition:
                # Truncate long definitions
                short_def = definition[:80] + "..." if len(definition) > 80 else definition
                line += f"\n   {escape_html(short_def)}"
        
        else:  # universal or mixed results
            if "composer" in result and "title" in result:
                # It's a work
                composer = result.get("composer", "Unknown")
                title = result.get("title", "Untitled")
                line = f"{i}. 🎵 <b>{escape_html(title)}</b>\n   by {escape_html(composer)}"
            elif "name" in result:
                # Could be composer or term
                name = result.get("name", "Unknown")
                line = f"{i}. 🎼 <b>{escape_html(name)}</b>"
            else:
                line = f"{i}. ℹ️ {escape_html(str(result))}"
        
        formatted_lines.append(line)
    
    result_text = "\n\n".join(formatted_lines)
    
    if len(results) > 10:
        result_text += f"\n\n<i>... and {len(results) - 10} more results</i>"
    
    return result_text

def format_work_details(work: Dict[str, Any]) -> str:
    """Format work details for display"""
    lines = []
    
    # Title and composer
    title = work.get("title", "Untitled")
    composer = work.get("composer", "Unknown")
    lines.append(f"🎵 <b>{escape_html(title)}</b>")
    lines.append(f"👤 Composer: {escape_html(composer)}")
    
    # Additional details
    if work.get("year"):
        lines.append(f"📅 Year: {work['year']}")
    
    if work.get("key"):
        lines.append(f"🎹 Key: {escape_html(work['key'])}")
    
    if work.get("opus"):
        lines.append(f"🎼 Opus: {escape_html(work['opus'])}")
    
    if work.get("genre"):
        lines.append(f"🎭 Genre: {escape_html(work['genre'])}")
    
    if work.get("description"):
        desc = work["description"]
        if len(desc) > 200:
            desc = desc[:197] + "..."
        lines.append(f"📝 Description: {escape_html(desc)}")
    
    return "\n".join(lines)

def format_file_list(files: List[Dict[str, Any]]) -> str:
    """Format file list for display"""
    if not files:
        return "No files found."
    
    lines = []
    for i, file_info in enumerate(files[:20], 1):  # Show max 20 files
        name = file_info.get("name", "Unknown")
        size = file_info.get("size", 0)
        file_type = file_info.get("type", "unknown")
        
        # Format size
        size_str = format_file_size(size) if size else ""
        
        # File type emoji
        emoji = get_file_type_emoji(file_type, name)
        
        line = f"{i}. {emoji} <b>{escape_html(name)}</b>"
        if size_str:
            line += f" ({size_str})"
        
        lines.append(line)
    
    result_text = "\n".join(lines)
    
    if len(files) > 20:
        result_text += f"\n\n<i>... and {len(files) - 20} more files</i>"
    
    return result_text

def format_file_size(size_bytes: int) -> str:
    """Format file size in human readable format"""
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB"]
    i = 0
    size = float(size_bytes)
    
    while size >= 1024.0 and i < len(size_names) - 1:
        size /= 1024.0
        i += 1
    
    return f"{size:.1f} {size_names[i]}"

def get_file_type_emoji(file_type: str, filename: str = "") -> str:
    """Get emoji for file type"""
    file_type = file_type.lower()
    filename = filename.lower()
    
    if file_type in ["pdf", "application/pdf"] or filename.endswith(".pdf"):
        return "📄"
    elif file_type.startswith("audio") or filename.endswith((".mp3", ".wav", ".flac", ".m4a")):
        return "🎵"
    elif file_type.startswith("image") or filename.endswith((".jpg", ".jpeg", ".png", ".gif")):
        return "🖼"
    elif filename.endswith((".sib", ".mus", ".musicxml")):
        return "🎼"
    elif file_type.startswith("video") or filename.endswith((".mp4", ".avi", ".mov")):
        return "🎬"
    elif filename.endswith((".zip", ".rar", ".7z")):
        return "📦"
    elif filename.endswith((".txt", ".md")):
        return "📝"
    else:
        return "📄"

def escape_html(text: str) -> str:
    """Escape HTML characters for Telegram"""
    if not isinstance(text, str):
        text = str(text)
    return html.escape(text)

def truncate_text(text: str, max_length: int = 100) -> str:
    """Truncate text to specified length"""
    if len(text) <= max_length:
        return text
    return text[:max_length - 3] + "..."