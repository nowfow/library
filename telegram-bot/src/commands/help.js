import { fmt, bold, italic, code, link } from 'telegraf/format';
import { createMainMenuKeyboard } from '../utils/keyboards.js';
import { asyncHandler } from '../utils/errorHandler.js';

/**
 * Handle /help command
 * @param {Object} ctx - Telegraf context
 */
export const helpCommand = asyncHandler(async (ctx) => {
  const helpMessage = fmt`📖 ${bold('Справка по Музыкальной Библиотеке')}

${bold('🔍 КОМАНДЫ ПОИСКА:')}

${code('/search_composer <имя>')}
Поиск произведений по имени композитора
${italic('Пример:')} ${code('/search_composer Бах')}

${code('/search_work <название>')}
Поиск по названию произведения
${italic('Пример:')} ${code('/search_work Соната')}

${code('/search_term <термин>')}
Поиск музыкальных терминов
${italic('Пример:')} ${code('/search_term аккорд')}

${code('/browse')}
Просмотр файлов в облачном хранилище

${code('/stats')}
Статистика музыкальной библиотеки

${bold('📱 НАВИГАЦИЯ:')}
• Используйте ${italic('inline-кнопки')} для навигации
• ${code('⬅️ Пред. / След. ➡️')} - переключение страниц
• ${code('📁 Папка')} - переход в директорию
• ${code('📄 Файл')} - скачивание файла

${bold('📄 ПОДДЕРЖИВАЕМЫЕ ФАЙЛЫ:')}
• ${code('PDF')} - ноты в формате PDF
• ${code('MP3, WAV, FLAC')} - аудиофайлы
• ${code('SIB, MUS')} - файлы нотных редакторов
• ${code('ZIP, RAR')} - архивы

${bold('💡 СОВЕТЫ:')}
• Используйте ${italic('частичное совпадение')} в поиске
• Поиск ${italic('не чувствителен к регистру')}
• Работают как ${italic('латиница')}, так и ${italic('кириллица')}
• При ошибке попробуйте ${italic('изменить запрос')}

${bold('🎵 Приятного пользования!')}`;

  await ctx.reply(helpMessage, createMainMenuKeyboard());
});