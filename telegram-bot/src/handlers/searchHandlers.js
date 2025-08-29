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
  // Add handlers for new JSON format
  bot.action(/^{.*"a":"search"/, (ctx) => {
    const callbackData = JSON.parse(ctx.callbackQuery.data);
    return searchCallbackHandler(ctx, callbackData);
  });
  bot.action(/^{.*"a":"terms"/, (ctx) => {
    const callbackData = JSON.parse(ctx.callbackQuery.data);
    return termsCallbackHandler(ctx, callbackData);
  });
}

/**
 * Handle search-related callbacks
 */
export const searchCallbackHandler = asyncHandler(async (ctx, callbackData = null) => {
  // Handle both direct callback data objects and string parsing
  let data = callbackData;
  if (!data) {
    data = parseCallbackData(ctx.callbackQuery.data.replace('search:', ''));
  }
  
  console.log('Search callback handler called with data:', data);
  
  switch (data.t) {
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
      await handleSearchPageCallback(ctx, data);
      break;
    case 'select':
      await handleSearchSelectCallback(ctx, data);
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
      console.log('Unknown search action:', data.t);
      await ctx.answerCbQuery('Неизвестная команда');
  }
});

/**
 * Handle terms-related callbacks
 */
export const termsCallbackHandler = asyncHandler(async (ctx, callbackData = null) => {
  let data = callbackData;
  if (!data) {
    data = parseCallbackData(ctx.callbackQuery.data.replace('terms:', ''));
  }
  
  switch (data.t) {
    case 'page':
      await handleTermsPageCallback(ctx, data);
      break;
    case 'select':
      await handleTermSelectCallback(ctx, data);
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
      message = `🔍 **Поиск по композитору**\n\nОтправьте имя композитора для поиска.\n\n*Примеры:*\n• Бах\n• Mozart\n• Чайковский\n• Rachmaninoff`;
      break;
    case 'work':
      message = `🎼 **Поиск по произведению**\n\nОтправьте название произведения для поиска.\n\n*Примеры:*\n• Соната\n• Этюд\n• Симфония\n• Концерт`;
      break;
    case 'terms':
      message = `📚 **Поиск музыкальных терминов**\n\nОтправьте музыкальный термин для поиска.\n\n*Примеры:*\n• аккорд\n• темп\n• модуляция\n• форте`;
      break;
  }
  
  // Set waiting state
  ctx.session.waitingForSearch = searchType;
  
  await ctx.editMessageText(message, {
    reply_markup: createMainMenuKeyboard().inline_keyboard,
    parse_mode: 'Markdown'
  });
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
    `🔍 Загрузка информации о произведении...`
  );
  
  try {
    // Get files for this work
    const files = await getWorkFiles(work.composer, work.title);
    
    if (files.length === 0) {
      const message = `🎼 **${work.title}**\n*Композитор:* ${work.composer}\n\n❌ **Файлы не найдены**`;
      const keyboard = {
        inline_keyboard: [
          [{ text: '⬅️ К результатам поиска', callback_data: '{"a":"search","t":"back"}' }]
        ]
      };
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        loadingMsg.message_id,
        undefined,
        message,
        { reply_markup: keyboard, parse_mode: 'Markdown' }
      );
    } else if (files.length === 1) {
      // Single file: send directly
      const file = files[0];
      const downloadUrl = getFileDownloadUrl(file.pdf_path);
      const fileName = file.pdf_path?.split('/').pop() || 'file';
      
      const message = `🎼 **${work.title}**\n*Композитор:* ${work.composer}\n\n📄 **Файл:** ${fileName}\n\n[📅 Скачать файл](${downloadUrl})\n\n*Нажмите на ссылку выше для скачивания*`;
      
      const keyboard = {
        inline_keyboard: [
          [{ text: '⬅️ К результатам поиска', callback_data: '{"a":"search","t":"back"}' }]
        ]
      };
      
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        loadingMsg.message_id,
        undefined,
        message,
        {
          reply_markup: keyboard,
          parse_mode: 'Markdown',
          disable_web_page_preview: false
        }
      );
    } else {
      // Multiple files: show selection buttons
      const message = `🎼 **${work.title}**\n*Композитор:* ${work.composer}\n\n📁 **Доступные файлы (${files.length}):**`;
      const keyboard = createWorkDetailsKeyboard(work, files);
      
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        loadingMsg.message_id,
        undefined,
        message,
        { reply_markup: keyboard, parse_mode: 'Markdown' }
      );
    }
    
    await ctx.answerCbQuery();
    
  } catch (error) {
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      loadingMsg.message_id,
      undefined,
      `❌ **Ошибка загрузки файлов**\n${error.message}`,
      { reply_markup: createMainMenuKeyboard(), parse_mode: 'Markdown' }
    );
    await ctx.answerCbQuery('Ошибка загрузки');
  }
}

/**
 * Handle back to search menu
 */
async function handleSearchMenuCallback(ctx) {
  const message = `🔍 **Поиск в музыкальной библиотеке**\n\nВыберите тип поиска:`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '🎵 По композитору', callback_data: '{"a":"search","t":"composer"}' },
        { text: '🎼 По произведению', callback_data: '{"a":"search","t":"work"}' }
      ],
      [
        { text: '📚 Музыкальные термины', callback_data: '{"a":"search","t":"terms"}' },
        { text: '📁 Просмотр файлов', callback_data: '{"a":"browse","t":"start"}' }
      ],
      [
        { text: '🏠 Главное меню', callback_data: '{"a":"main","t":"menu"}' }
      ]
    ]
  };

  await ctx.editMessageText(message, { 
    reply_markup: keyboard,
    parse_mode: 'Markdown'
  });
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
  
  const message = `📚 **${term.term}**\n\n${term.description}`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '⬅️ К результатам поиска', callback_data: '{"a":"terms","t":"back"}' }
      ],
      [
        { text: '🔍 Новый поиск', callback_data: '{"a":"search","t":"menu"}' }
      ]
    ]
  };

  await ctx.editMessageText(message, { 
    reply_markup: keyboard,
    parse_mode: 'Markdown'
  });
  await ctx.answerCbQuery();
}

