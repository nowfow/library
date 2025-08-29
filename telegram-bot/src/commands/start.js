import { fmt, bold, italic, code } from 'telegraf/format';
import { createMainMenuKeyboard } from '../utils/keyboards.js';
import { asyncHandler } from '../utils/errorHandler.js';

/**
 * Handle /start command
 * @param {Object} ctx - Telegraf context
 */
export const startCommand = asyncHandler(async (ctx) => {
  const user = ctx.from;
  const firstName = user.first_name || 'пользователь';
  
  const welcomeMessage = fmt`🎵 ${bold('Добро пожаловать в Музыкальную Библиотеку!')}

Привет, ${bold(firstName)}! 👋

Я помогу вам найти ноты и музыкальные произведения в нашей коллекции.

${bold('Что я умею:')}
• 🔍 Поиск по ${italic('композитору')}
• 🎼 Поиск по ${italic('названию произведения')}
• 📚 Поиск музыкальных ${italic('терминов')}
• 📁 Просмотр файлов в облачном хранилище
• 📄 Скачивание нот и аудиофайлов

${bold('Как начать:')}
Используйте кнопки ниже или команды:
${code('/search_composer <имя>')}- поиск по композитору
${code('/search_work <название>')} - поиск произведения
${code('/search_term <термин>')} - поиск термина
${code('/browse')} - просмотр файлов
${code('/help')} - справка

Выберите действие:`;

  await ctx.reply(welcomeMessage, createMainMenuKeyboard());
});

/**
 * Handle main menu callback
 * @param {Object} ctx - Telegraf context
 */
export const mainMenuCallback = asyncHandler(async (ctx) => {
  const welcomeMessage = fmt`🎵 ${bold('Музыкальная Библиотека')}

Выберите действие:`;

  await ctx.editMessageText(welcomeMessage, createMainMenuKeyboard());
  await ctx.answerCbQuery();
});