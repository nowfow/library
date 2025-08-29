import { Markup } from 'telegraf';
import { getFileIcon } from './formatting.js';

/**
 * Create pagination keyboard
 * @param {Object} pagination - Pagination info
 * @param {string} actionPrefix - Callback action prefix
 * @param {Object} extraData - Extra data to include in callback
 * @returns {Object} Inline keyboard markup
 */
export function createPaginationKeyboard(pagination, actionPrefix, extraData = {}) {
  const { currentPage, totalPages, hasPrev, hasNext } = pagination;
  const keyboard = [];
  
  // Navigation buttons row
  const navButtons = [];
  
  if (hasPrev) {
    navButtons.push(
      Markup.button.callback(
        '⬅️ Пред.',
        createCallbackData(actionPrefix, 'page', { 
          ...extraData, 
          page: currentPage - 1 
        })
      )
    );
  }
  
  // Page indicator
  navButtons.push(
    Markup.button.callback(
      `${currentPage + 1}/${totalPages}`,
      createCallbackData(actionPrefix, 'noop', {})
    )
  );
  
  if (hasNext) {
    navButtons.push(
      Markup.button.callback(
        'След. ➡️',
        createCallbackData(actionPrefix, 'page', { 
          ...extraData, 
          page: currentPage + 1 
        })
      )
    );
  }
  
  if (navButtons.length > 0) {
    keyboard.push(navButtons);
  }
  
  return Markup.inlineKeyboard(keyboard);
}

/**
 * Create search results keyboard
 * @param {Array} results - Search results
 * @param {Object} pagination - Pagination info
 * @param {string} actionPrefix - Action prefix for callbacks
 * @returns {Object} Inline keyboard markup
 */
export function createSearchResultsKeyboard(results, pagination, actionPrefix) {
  const keyboard = [];
  
  // Result buttons (max 10 per page)
  results.forEach((result, index) => {
    const globalIndex = pagination.currentPage * 10 + index;
    keyboard.push([
      Markup.button.callback(
        `${globalIndex + 1}. ${truncateForButton(result.title || result.term || result.name)}`,
        createCallbackData(actionPrefix, 'select', { 
          index: globalIndex,
          id: result.work_id || result.id || index 
        })
      )
    ]);
  });
  
  // Pagination buttons
  if (pagination.totalPages > 1) {
    const navButtons = [];
    
    if (pagination.hasPrev) {
      navButtons.push(
        Markup.button.callback(
          '⬅️ Пред.',
          createCallbackData(actionPrefix, 'page', { page: pagination.currentPage - 1 })
        )
      );
    }
    
    navButtons.push(
      Markup.button.callback(
        `${pagination.currentPage + 1}/${pagination.totalPages}`,
        createCallbackData(actionPrefix, 'noop', {})
      )
    );
    
    if (pagination.hasNext) {
      navButtons.push(
        Markup.button.callback(
          'След. ➡️',
          createCallbackData(actionPrefix, 'page', { page: pagination.currentPage + 1 })
        )
      );
    }
    
    keyboard.push(navButtons);
  }
  
  // Back to search button
  keyboard.push([
    Markup.button.callback('🔍 Новый поиск', createCallbackData('search', 'menu', {}))
  ]);
  
  return Markup.inlineKeyboard(keyboard);
}

/**
 * Create file browser keyboard
 * @param {Array} files - File list
 * @param {Object} pagination - Pagination info
 * @param {string} currentPath - Current directory path
 * @returns {Object} Inline keyboard markup
 */
export function createFileBrowserKeyboard(files, pagination, currentPath) {
  const keyboard = [];
  
  // Back button (if not in root)
  if (currentPath !== '/') {
    const parentPath = getParentPath(currentPath);
    keyboard.push([
      Markup.button.callback(
        '⬆️ Назад',
        createCallbackData('browse', 'navigate', { path: parentPath })
      )
    ]);
  }
  
  // File/directory buttons
  files.forEach((file, index) => {
    const globalIndex = pagination.currentPage * 10 + index;
    const icon = file.type === 'directory' ? '📁' : getFileIcon(file);
    const name = truncateForButton(file.basename || file.name);
    
    keyboard.push([
      Markup.button.callback(
        `${icon} ${name}`,
        createCallbackData('browse', file.type === 'directory' ? 'navigate' : 'download', {
          path: file.filename,
          name: file.basename || file.name,
          index: globalIndex
        })
      )
    ]);
  });
  
  // Pagination buttons
  if (pagination.totalPages > 1) {
    const navButtons = [];
    
    if (pagination.hasPrev) {
      navButtons.push(
        Markup.button.callback(
          '⬅️ Пред.',
          createCallbackData('browse', 'page', { 
            path: currentPath, 
            page: pagination.currentPage - 1 
          })
        )
      );
    }
    
    navButtons.push(
      Markup.button.callback(
        `${pagination.currentPage + 1}/${pagination.totalPages}`,
        createCallbackData('browse', 'noop', {})
      )
    );
    
    if (pagination.hasNext) {
      navButtons.push(
        Markup.button.callback(
          'След. ➡️',
          createCallbackData('browse', 'page', { 
            path: currentPath, 
            page: pagination.currentPage + 1 
          })
        )
      );
    }
    
    keyboard.push(navButtons);
  }
  
  // Main menu button
  keyboard.push([
    Markup.button.callback('🏠 Главное меню', createCallbackData('main', 'menu', {}))
  ]);
  
  return Markup.inlineKeyboard(keyboard);
}

/**
 * Create main menu keyboard
 * @returns {Object} Inline keyboard markup
 */
export function createMainMenuKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('🔍 Поиск по композитору', createCallbackData('search', 'composer', {})),
      Markup.button.callback('🎼 Поиск по произведению', createCallbackData('search', 'work', {}))
    ],
    [
      Markup.button.callback('📚 Поиск терминов', createCallbackData('search', 'terms', {})),
      Markup.button.callback('📁 Просмотр файлов', createCallbackData('browse', 'start', {}))
    ]
  ]);
}

/**
 * Create work details keyboard
 * @param {Object} work - Work object
 * @param {Array} files - Associated files
 * @returns {Object} Inline keyboard markup
 */
export function createWorkDetailsKeyboard(work, files = []) {
  const keyboard = [];
  
  // File download buttons
  if (files.length > 0) {
    files.forEach((file, index) => {
      const fileName = truncateForButton(file.pdf_path?.split('/').pop() || `Файл ${index + 1}`);
      keyboard.push([
        Markup.button.callback(
          `📄 ${fileName}`,
          createCallbackData('download', 'file', { 
            path: file.pdf_path,
            composer: work.composer,
            work: work.title 
          })
        )
      ]);
    });
  }
  
  // Back button
  keyboard.push([
    Markup.button.callback('⬅️ К результатам поиска', createCallbackData('search', 'back', {}))
  ]);
  
  return Markup.inlineKeyboard(keyboard);
}

/**
 * Create callback data string
 * @param {string} action - Action type
 * @param {string} type - Action subtype
 * @param {Object} data - Additional data
 * @returns {string} Callback data string
 */
export function createCallbackData(action, type, data = {}) {
  const callbackData = {
    a: action,
    t: type,
    ...data
  };
  
  const jsonString = JSON.stringify(callbackData);
  
  // Telegram callback data limit is 64 bytes
  if (jsonString.length > 64) {
    console.warn('Callback data too long, truncating:', jsonString);
    // Create simplified version
    return JSON.stringify({ a: action, t: type });
  }
  
  return jsonString;
}

/**
 * Parse callback data
 * @param {string} data - Callback data string
 * @returns {Object} Parsed callback data
 */
export function parseCallbackData(data) {
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to parse callback data:', data, error);
    return { a: 'error', t: 'parse' };
  }
}

/**
 * Truncate text for button display
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateForButton(text, maxLength = 30) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Get parent directory path
 * @param {string} path - Current path
 * @returns {string} Parent path
 */
function getParentPath(path) {
  if (path === '/' || !path) return '/';
  const parts = path.split('/').filter(Boolean);
  parts.pop();
  return '/' + parts.join('/');
}