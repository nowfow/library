import { fmt, bold, italic, code } from 'telegraf/format';
import { getBotStats } from '../services/database.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { createMainMenuKeyboard } from '../utils/keyboards.js';

/**
 * Handle /stats command - show library statistics
 * @param {Object} ctx - Telegraf context
 */
export const statsCommand = asyncHandler(async (ctx) => {
  const loadingMsg = await ctx.reply('📊 Загрузка статистики...');
  
  try {
    const stats = await getBotStats();
    
    const statsMessage = fmt`📊 ${bold('Статистика музыкальной библиотеки')}

${italic('Содержимое базы данных:')}
🎼 ${bold('Композиторы:')} ${code(String(stats.composers))}
🎵 ${bold('Произведения:')} ${code(String(stats.works))}
📚 ${bold('Музыкальные термины:')} ${code(String(stats.terms))}
📁 ${bold('Файлы:')} ${code(String(stats.files))}

${italic('Поиск работает по всей коллекции!')}

Используйте команды:
• ${code('/search_composer')} - поиск по композитору
• ${code('/search_work')} - поиск произведений
• ${code('/search_term')} - поиск терминов
• ${code('/browse')} - просмотр файлов`;

    await ctx.telegram.editMessageText(
      ctx.chat.id,
      loadingMsg.message_id,
      undefined,
      statsMessage,
      createMainMenuKeyboard()
    );
    
  } catch (error) {
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      loadingMsg.message_id,
      undefined,
      fmt`❌ ${bold('Ошибка загрузки статистики')}
${error.message}`,
      createMainMenuKeyboard()
    );
  }
});