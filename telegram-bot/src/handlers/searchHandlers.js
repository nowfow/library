import { fmt, bold, italic, link } from 'telegraf/format';
import { getWorkFiles, getFileDownloadUrl } from '../services/api.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { parseCallbackData, createWorkDetailsKeyboard, createMainMenuKeyboard } from '../utils/keyboards.js';
import { displaySearchResults, displayTermResults } from '../commands/search.js';
import { formatWork, paginate } from '../utils/formatting.js';

/**
 * Register search callback handlers
 * @param {Object} bot - Telegraf bot instance
 */
export function searchHandlers(bot) {
  bot.action(/^search:/, searchCallbackHandler);
  bot.action(/^terms:/, termsCallbackHandler);
}

/**
 * Handle search-related callbacks
 */
const searchCallbackHandler = asyncHandler(async (ctx) => {
  const callbackData = parseCallbackData(ctx.callbackQuery.data.replace('search:', ''));
  
  switch (callbackData.t) {
    case 'composer':
      await handleSearchTypeCallback(ctx, 'composer');
      break;
    case 'work':
      await handleSearchTypeCallback(ctx, 'work');
      break;
    case 'terms':
      await handleSearchTypeCallback(ctx, 'terms');
      break;
    case 'page':
      await handleSearchPageCallback(ctx, callbackData);
      break;
    case 'select':
      await handleSearchSelectCallback(ctx, callbackData);
      break;
    case 'menu':
      await handleSearchMenuCallback(ctx);
      break;
    case 'back':
      await handleSearchBackCallback(ctx);
      break;
    case 'noop':
      await ctx.answerCbQuery();
      break;
    default:
      await ctx.answerCbQuery('Неизвестная команда');
  }
});

/**
 * Handle terms-related callbacks
 */
const termsCallbackHandler = asyncHandler(async (ctx) => {
  const callbackData = parseCallbackData(ctx.callbackQuery.data.replace('terms:', ''));
  
  switch (callbackData.t) {
    case 'page':
      await handleTermsPageCallback(ctx, callbackData);
      break;
    case 'select':
      await handleTermSelectCallback(ctx, callbackData);
      break;
    case 'noop':
      await ctx.answerCbQuery();
      break;
    default:
      await ctx.answerCbQuery('Неизвестная команда');
  }
});

/**
 * Handle search type selection from main menu
 */
async function handleSearchTypeCallback(ctx, searchType) {
  let message;
  
  switch (searchType) {
    case 'composer':
      message = fmt`🔍 ${bold('Поиск по композитору')}

Отправьте имя композитора для поиска.

${italic('Примеры:')}
• Бах
• Mozart  
• Чайковский
• Rachmaninoff`;
      break;
    case 'work':
      message = fmt`🎼 ${bold('Поиск по произведению')}

Отправьте название произведения для поиска.

${italic('Примеры:')}
• Соната
• Этюд
• Симфония
• Концерт`;
      break;
    case 'terms':
      message = fmt`📚 ${bold('Поиск музыкальных терминов')}

Отправьте музыкальный термин для поиска.

${italic('Примеры:')}
• аккорд
• темп
• модуляция
• форте`;
      break;
  }
  
  // Set waiting state
  ctx.session.waitingForSearch = searchType;
  
  await ctx.editMessageText(message, createMainMenuKeyboard());
  await ctx.answerCbQuery();
}

/**
 * Handle search results pagination
 */
async function handleSearchPageCallback(ctx, callbackData) {
  ctx.session.currentPage = callbackData.page || 0;
  await displaySearchResults(ctx);
  await ctx.answerCbQuery();
}

/**
 * Handle search result selection
 */
async function handleSearchSelectCallback(ctx, callbackData) {
  const { searchResults } = ctx.session;
  const work = searchResults[callbackData.index];
  
  if (!work) {
    await ctx.answerCbQuery('Произведение не найдено');
    return;
  }
  
  const loadingMsg = await ctx.editMessageText(
    fmt`🔍 Загрузка информации о произведении...`
  );
  
  try {
    // Get files for this work
    const files = await getWorkFiles(work.composer, work.title);
    
    const message = fmt`🎼 ${bold(work.title)}
${italic('Композитор:')} ${work.composer}

${files.length > 0 ? bold('📁 Доступные файлы:') : bold('❌ Файлы не найдены')}`;

    const keyboard = createWorkDetailsKeyboard(work, files);
    
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      loadingMsg.message_id,
      undefined,
      message,
      keyboard
    );
    
    await ctx.answerCbQuery();
    
  } catch (error) {
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      loadingMsg.message_id,
      undefined,
      fmt`❌ ${bold('Ошибка загрузки файлов')}
${error.message}`,
      createMainMenuKeyboard()
    );
    await ctx.answerCbQuery('Ошибка загрузки');
  }
}

/**
 * Handle back to search menu
 */
async function handleSearchMenuCallback(ctx) {
  const message = fmt`🔍 ${bold('Поиск в музыкальной библиотеке')}

Выберите тип поиска:`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '🎵 По композитору', callback_data: 'search:{"a":"search","t":"composer"}' },
        { text: '🎼 По произведению', callback_data: 'search:{"a":"search","t":"work"}' }
      ],
      [
        { text: '📚 Музыкальные термины', callback_data: 'search:{"a":"search","t":"terms"}' },
        { text: '📁 Просмотр файлов', callback_data: '{"a":"browse","t":"start"}' }
      ],
      [
        { text: '🏠 Главное меню', callback_data: '{"a":"main","t":"menu"}' }
      ]
    ]
  };

  await ctx.editMessageText(message, { reply_markup: keyboard });
  await ctx.answerCbQuery();
}

/**
 * Handle back to search results
 */
async function handleSearchBackCallback(ctx) {
  await displaySearchResults(ctx);
  await ctx.answerCbQuery();
}

/**
 * Handle terms pagination
 */
async function handleTermsPageCallback(ctx, callbackData) {
  ctx.session.currentPage = callbackData.page || 0;
  await displayTermResults(ctx);
  await ctx.answerCbQuery();
}

/**
 * Handle term selection (show full definition)
 */
async function handleTermSelectCallback(ctx, callbackData) {
  const { searchResults } = ctx.session;
  const term = searchResults[callbackData.index];
  
  if (!term) {
    await ctx.answerCbQuery('Термин не найден');
    return;
  }
  
  const message = fmt`📚 ${bold(term.term)}

${term.description}`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '⬅️ К результатам поиска', callback_data: 'terms:{"a":"terms","t":"back"}' }
      ],
      [
        { text: '🔍 Новый поиск', callback_data: 'search:{"a":"search","t":"menu"}' }
      ]
    ]
  };

  await ctx.editMessageText(message, { reply_markup: keyboard });
  await ctx.answerCbQuery();
}

export { searchCallbackHandler, termsCallbackHandler };