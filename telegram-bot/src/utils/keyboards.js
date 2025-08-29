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
      {
        text: `${globalIndex + 1}. ${truncateForButton(result.title || result.term || result.name)}`,
        callback_data: `{"a":"${actionPrefix}","t":"select","index":${globalIndex},"id":${result.work_id || result.id || index}}`
      }
    ]);
  });
  
  // Pagination buttons
  if (pagination.totalPages > 1) {
    const navButtons = [];
    
    if (pagination.hasPrev) {
      navButtons.push({
        text: '⬅️ Пред.',
        callback_data: `{"a":"${actionPrefix}","t":"page","page":${pagination.currentPage - 1}}`
      });
    }
    
    navButtons.push({
      text: `${pagination.currentPage + 1}/${pagination.totalPages}`,
      callback_data: `{"a":"${actionPrefix}","t":"noop"}`
    });
    
    if (pagination.hasNext) {
      navButtons.push({
        text: 'След. ➡️',
        callback_data: `{"a":"${actionPrefix}","t":"page","page":${pagination.currentPage + 1}}`
      });
    }
    
    keyboard.push(navButtons);
  }
  
  // Back to search button
  keyboard.push([
    { text: '🔍 Новый поиск', callback_data: '{"a":"search","t":"menu"}' }
  ]);
  
  return { inline_keyboard: keyboard };
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
      {
        text: '⬆️ Назад',
        callback_data: createCallbackData('browse', 'navigate', { path: parentPath })
      }
    ]);
  }
  
  // File/directory buttons
  files.forEach((file, index) => {
    const globalIndex = pagination.currentPage * 10 + index;
    const icon = file.type === 'directory' ? '📁' : getFileIcon(file);
    const name = truncateForButton(file.basename || file.name);
    
    // Create shorter callback data to avoid 64-byte limit
    const callbackData = file.type === 'directory' 
      ? createCallbackData('browse', 'navigate', { path: file.filename })
      : createCallbackData('browse', 'download', { 
          path: file.filename,
          name: file.basename || file.name
        });
    
    keyboard.push([
      {
        text: `${icon} ${name}`,
        callback_data: callbackData
      }
    ]);
  });
  
  // Pagination buttons
  if (pagination.totalPages > 1) {
    const navButtons = [];
    
    if (pagination.hasPrev) {
      navButtons.push({
        text: '⬅️ Пред.',
        callback_data: createCallbackData('browse', 'page', {
          path: currentPath,
          page: pagination.currentPage - 1
        })
      });
    }
    
    navButtons.push({
      text: `${pagination.currentPage + 1}/${pagination.totalPages}`,
      callback_data: createCallbackData('browse', 'noop', {})
    });
    
    if (pagination.hasNext) {
      navButtons.push({
        text: 'След. ➡️',
        callback_data: createCallbackData('browse', 'page', {
          path: currentPath,
          page: pagination.currentPage + 1
        })
      });
    }
    
    keyboard.push(navButtons);
  }
  
  // Main menu button
  keyboard.push([
    {
      text: '🏠 Главное меню',
      callback_data: '{"a":"main","t":"menu"}'
    }
  ]);
  
  return { inline_keyboard: keyboard };
}

/**
 * Create main menu keyboard
 * @returns {Object} Inline keyboard markup
 */
export function createMainMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🎵 По композитору', callback_data: '{"a":"search","t":"composer"}' },
        { text: '🎼 По произведению', callback_data: '{"a":"search","t":"work"}' }
      ],
      [
        { text: '📚 Музыкальные термины', callback_data: '{"a":"search","t":"terms"}' },
        { text: '📁 Просмотр файлов', callback_data: '{"a":"browse","t":"start"}' }
      ]
    ]
  };
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
      const callbackData = createCallbackData('download', 'file', {
        path: file.pdf_path,
        composer: work.composer.substring(0, 15), // Truncate to save space
        work: work.title.substring(0, 15) // Truncate to save space
      });
      
      keyboard.push([
        {
          text: `📄 ${fileName}`,
          callback_data: callbackData
        }
      ]);
    });
  }
  
  // Back button
  keyboard.push([
    { text: '⬅️ К результатам поиска', callback_data: '{"a":"search","t":"back"}' }
  ]);
  
  return { inline_keyboard: keyboard };
}

/**
 * Create callback data string with proper length handling
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
  
  let jsonString = JSON.stringify(callbackData);
  
  // Telegram callback data limit is 64 bytes
  if (jsonString.length > 64) {
    console.warn('Callback data too long:', jsonString.length, 'bytes, truncating');
    
    // Try to shorten by truncating long paths
    if (data.path && data.path.length > 20) {
      const shortenedData = {
        ...callbackData,
        path: data.path.length > 30 ? '...' + data.path.slice(-25) : data.path
      };
      
      // Remove name if still too long
      if (JSON.stringify(shortenedData).length > 64 && shortenedData.name) {
        delete shortenedData.name;
      }
      
      jsonString = JSON.stringify(shortenedData);
    }
    
    // Final fallback: minimal data
    if (jsonString.length > 64) {
      console.warn('Still too long, using minimal callback data');
      return JSON.stringify({ a: action, t: type });
    }
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