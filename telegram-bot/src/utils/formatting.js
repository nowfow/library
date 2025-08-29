import { fmt, bold, italic, code, link } from 'telegraf/format';

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Escape special characters for Telegram markdown
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeMarkdown(text) {
  if (!text) return '';
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

/**
 * Format work result for display
 * @param {Object} work - Work object
 * @param {number} index - Index in results
 * @returns {string} Formatted work
 */
export function formatWork(work, index) {
  const title = truncateText(work.title, 40);
  const composer = truncateText(work.composer, 30);
  
  return `**${index + 1}.** **${escapeMarkdown(title)}**\n*Композитор:* ${escapeMarkdown(composer)}`;
}

/**
 * Format term result for display
 * @param {Object} term - Term object
 * @returns {string} Formatted term
 */
export function formatTerm(term) {
  const description = truncateText(term.description, 100);
  
  return `**${escapeMarkdown(term.term)}**\n${escapeMarkdown(description)}`;
}

/**
 * Format file entry for display
 * @param {Object} file - File object
 * @param {number} index - Index in list
 * @returns {string} Formatted file
 */
export function formatFile(file, index) {
  const name = truncateText(file.name || file.basename, 45);
  const size = file.size ? formatFileSize(file.size) : '';
  const icon = getFileIcon(file);
  
  return `${icon} **${index + 1}.** ${escapeMarkdown(name)}${size ? ` (${size})` : ''}`;
}

/**
 * Get icon for file type
 * @param {Object} file - File object
 * @returns {string} File icon
 */
export function getFileIcon(file) {
  if (file.type === 'directory') return '📁';
  
  const ext = file.filename?.split('.').pop()?.toLowerCase() || '';
  
  switch (ext) {
    case 'pdf': return '📄';
    case 'mp3': case 'wav': case 'flac': case 'm4a': return '🎵';
    case 'sib': case 'mus': return '🎼';
    case 'zip': case 'rar': case '7z': return '📦';
    case 'jpg': case 'jpeg': case 'png': case 'gif': return '🖼️';
    case 'txt': case 'md': return '📝';
    default: return '📎';
  }
}

/**
 * Format file size
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
export function formatFileSize(bytes) {
  if (!bytes) return '';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${Math.round(size * 10) / 10} ${units[unitIndex]}`;
}

/**
 * Create pagination info text
 * @param {number} currentPage - Current page (0-based)
 * @param {number} totalPages - Total pages
 * @param {number} totalItems - Total items
 * @returns {string} Pagination info
 */
export function createPaginationInfo(currentPage, totalPages, totalItems) {
  return `Страница **${currentPage + 1}** из **${totalPages}** (всего: ${totalItems})`;
}

/**
 * Create breadcrumb navigation
 * @param {string} path - Current path
 * @returns {string} Breadcrumb string
 */
export function createBreadcrumb(path) {
  if (path === '/' || !path) return '📁 Корень';
  
  const parts = path.split('/').filter(Boolean);
  const breadcrumbs = ['📁 Корень'];
  
  parts.forEach(part => {
    breadcrumbs.push(`➤ ${escapeMarkdown(part)}`);
  });
  
  return breadcrumbs.join(' ');
}

/**
 * Paginate array
 * @param {Array} items - Items to paginate
 * @param {number} page - Current page (0-based)
 * @param {number} perPage - Items per page
 * @returns {Object} Pagination result
 */
export function paginate(items, page = 0, perPage = 10) {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / perPage);
  const start = page * perPage;
  const end = start + perPage;
  const currentItems = items.slice(start, end);
  
  return {
    items: currentItems,
    currentPage: page,
    totalPages,
    totalItems,
    hasNext: page < totalPages - 1,
    hasPrev: page > 0
  };
}