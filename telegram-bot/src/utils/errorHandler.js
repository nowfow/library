import { fmt, bold, code } from 'telegraf/format';

/**
 * Global error handler for the bot
 * @param {Error} err - Error object
 * @param {Object} ctx - Telegraf context
 */
export function errorHandler(err, ctx) {
  console.error('❌ Bot Error:', err);
  
  // Log error details
  if (ctx?.update) {
    console.error('Update:', JSON.stringify(ctx.update, null, 2));
  }
  
  // Send user-friendly error message
  const errorMessage = getUserFriendlyError(err);
  
  if (ctx?.reply) {
    ctx.reply(errorMessage).catch(replyErr => {
      console.error('Failed to send error message:', replyErr);
    });
  }
}

/**
 * Convert technical errors to user-friendly messages
 * @param {Error} error - Error object
 * @returns {string} User-friendly error message
 */
function getUserFriendlyError(error) {
  const message = error.message || 'Неизвестная ошибка';
  
  // Network errors
  if (message.includes('ECONNREFUSED') || message.includes('ENOTFOUND')) {
    return fmt`❌ ${bold('Ошибка подключения')}
Не удается подключиться к серверу. Пожалуйста, попробуйте позже.`;
  }
  
  // Timeout errors
  if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
    return fmt`⏱️ ${bold('Превышено время ожидания')}
Сервер слишком долго отвечает. Попробуйте позже.`;
  }
  
  // API errors
  if (message.includes('Ошибка поиска') || message.includes('Ошибка получения')) {
    return fmt`🔍 ${bold('Ошибка поиска')}
${message}
Попробуйте изменить запрос или повторите позже.`;
  }
  
  // File errors
  if (message.includes('файл') || message.includes('file')) {
    return fmt`📁 ${bold('Ошибка файла')}
Не удается получить доступ к файлу. Возможно, он был перемещен или удален.`;
  }
  
  // WebDAV errors
  if (message.includes('WebDAV') || message.includes('403') || message.includes('401')) {
    return fmt`☁️ ${bold('Ошибка облачного хранилища')}
Нет доступа к файлам. Обратитесь к администратору.`;
  }
  
  // Database errors
  if (message.includes('database') || message.includes('mysql') || message.includes('query')) {
    return fmt`💾 ${bold('Ошибка базы данных')}
Временные проблемы с базой данных. Попробуйте позже.`;
  }
  
  // Telegram API errors
  if (error.code === 400) {
    return fmt`📱 ${bold('Ошибка Telegram')}
Некорректный запрос. Попробуйте еще раз.`;
  }
  
  if (error.code === 429) {
    return fmt`🚫 ${bold('Слишком много запросов')}
Подождите немного перед следующим запросом.`;
  }
  
  // Generic error
  return fmt`❌ ${bold('Произошла ошибка')}
Что-то пошло не так. Попробуйте позже или обратитесь к администратору.
${code('Код ошибки: ' + (error.code || 'UNKNOWN'))}`;
}

/**
 * Async error handler wrapper
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
export function asyncHandler(fn) {
  return async (ctx, next) => {
    try {
      await fn(ctx, next);
    } catch (error) {
      errorHandler(error, ctx);
    }
  };
}

/**
 * Validate search query
 * @param {string} query - Search query
 * @returns {Object} Validation result
 */
export function validateSearchQuery(query) {
  if (!query || typeof query !== 'string') {
    return {
      valid: false,
      error: 'Пустой поисковый запрос'
    };
  }
  
  const trimmed = query.trim();
  
  if (trimmed.length < 2) {
    return {
      valid: false,
      error: 'Поисковый запрос должен содержать минимум 2 символа'
    };
  }
  
  if (trimmed.length > 100) {
    return {
      valid: false,
      error: 'Поисковый запрос слишком длинный (максимум 100 символов)'
    };
  }
  
  return {
    valid: true,
    query: trimmed
  };
}

/**
 * Safe JSON parse
 * @param {string} str - JSON string
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {*} Parsed value or default
 */
export function safeJsonParse(str, defaultValue = null) {
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
}