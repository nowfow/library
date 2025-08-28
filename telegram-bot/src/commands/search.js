import { fmt, bold, italic, code } from 'telegraf/format';
import { searchWorks, searchTerms } from '../services/api.js';
import { validateSearchQuery, asyncHandler } from '../utils/errorHandler.js';
import { formatWork, formatTerm, createPaginationInfo, paginate } from '../utils/formatting.js';
import { createSearchResultsKeyboard, createMainMenuKeyboard } from '../utils/keyboards.js';

/**
 * Register search commands
 * @param {Object} bot - Telegraf bot instance
 */
export function searchCommands(bot) {
  bot.command('search_composer', searchComposerCommand);
  bot.command('search_work', searchWorkCommand);
  bot.command('search_term', searchTermCommand);
  bot.command('browse', browseCommand);
}

/**
 * Handle /search_composer command
 */
const searchComposerCommand = asyncHandler(async (ctx) => {
  const query = ctx.payload || ctx.args?.join(' ') || '';
  
  if (!query) {
    return ctx.reply(fmt`🔍 ${bold('Поиск по композитору')}

Введите команду с именем композитора:
${code('/search_composer <имя композитора>')}

${italic('Примеры:')}
${code('/search_composer Бах')}
${code('/search_composer Mozart')}
${code('/search_composer Чайковский')}`, createMainMenuKeyboard());
  }

  const validation = validateSearchQuery(query);
  if (!validation.valid) {
    return ctx.reply(`❌ ${validation.error}`);
  }

  const searchingMsg = await ctx.reply(fmt`🔍 Поиск произведений композитора: ${bold(validation.query)}...`);

  try {
    const results = await searchWorks({ composer: validation.query });
    
    if (results.length === 0) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        searchingMsg.message_id,
        undefined,
        fmt`❌ ${bold('Ничего не найдено')}

Композитор "${italic(validation.query)}" не найден в базе данных.

Попробуйте:
• Проверить правильность написания
• Использовать другое написание имени
• Попробовать поиск по произведению`,
        createMainMenuKeyboard()
      );
      return;
    }

    // Store search results in session
    ctx.session.searchResults = results;
    ctx.session.searchType = 'composer';
    ctx.session.searchQuery = validation.query;
    ctx.session.currentPage = 0;

    await displaySearchResults(ctx, searchingMsg.message_id);
    
  } catch (error) {
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      searchingMsg.message_id,
      undefined,
      fmt`❌ ${bold('Ошибка поиска')}
${error.message}`,
      createMainMenuKeyboard()
    );
  }
});

/**
 * Handle /search_work command
 */
const searchWorkCommand = asyncHandler(async (ctx) => {
  const query = ctx.payload || ctx.args?.join(' ') || '';
  
  if (!query) {
    return ctx.reply(fmt`🎼 ${bold('Поиск по произведению')}

Введите команду с названием произведения:
${code('/search_work <название произведения>')}

${italic('Примеры:')}
${code('/search_work Соната')}
${code('/search_work Симфония')}
${code('/search_work Этюд')}`, createMainMenuKeyboard());
  }

  const validation = validateSearchQuery(query);
  if (!validation.valid) {
    return ctx.reply(`❌ ${validation.error}`);
  }

  const searchingMsg = await ctx.reply(fmt`🔍 Поиск произведения: ${bold(validation.query)}...`);

  try {
    const results = await searchWorks({ work: validation.query });
    
    if (results.length === 0) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        searchingMsg.message_id,
        undefined,
        fmt`❌ ${bold('Ничего не найдено')}

Произведение "${italic(validation.query)}" не найдено в базе данных.

Попробуйте:
• Проверить правильность написания
• Использовать часть названия
• Попробовать поиск по композитору`,
        createMainMenuKeyboard()
      );
      return;
    }

    // Store search results in session
    ctx.session.searchResults = results;
    ctx.session.searchType = 'work';
    ctx.session.searchQuery = validation.query;
    ctx.session.currentPage = 0;

    await displaySearchResults(ctx, searchingMsg.message_id);
    
  } catch (error) {
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      searchingMsg.message_id,
      undefined,
      fmt`❌ ${bold('Ошибка поиска')}
${error.message}`,
      createMainMenuKeyboard()
    );
  }
});

/**
 * Handle /search_term command
 */
const searchTermCommand = asyncHandler(async (ctx) => {
  const query = ctx.payload || ctx.args?.join(' ') || '';
  
  if (!query) {
    return ctx.reply(fmt`📚 ${bold('Поиск музыкальных терминов')}

Введите команду с музыкальным термином:
${code('/search_term <термин>')}

${italic('Примеры:')}
${code('/search_term аккорд')}
${code('/search_term форте')}
${code('/search_term модуляция')}`, createMainMenuKeyboard());
  }

  const validation = validateSearchQuery(query);
  if (!validation.valid) {
    return ctx.reply(`❌ ${validation.error}`);
  }

  const searchingMsg = await ctx.reply(fmt`🔍 Поиск термина: ${bold(validation.query)}...`);

  try {
    const results = await searchTerms(validation.query);
    
    if (results.length === 0) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        searchingMsg.message_id,
        undefined,
        fmt`❌ ${bold('Ничего не найдено')}

Термин "${italic(validation.query)}" не найден в базе данных.

Попробуйте:
• Проверить правильность написания
• Использовать синонимы
• Попробовать более общий термин`,
        createMainMenuKeyboard()
      );
      return;
    }

    // Store search results in session
    ctx.session.searchResults = results;
    ctx.session.searchType = 'terms';
    ctx.session.searchQuery = validation.query;
    ctx.session.currentPage = 0;

    await displayTermResults(ctx, searchingMsg.message_id);
    
  } catch (error) {
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      searchingMsg.message_id,
      undefined,
      fmt`❌ ${bold('Ошибка поиска')}
${error.message}`,
      createMainMenuKeyboard()
    );
  }
});

/**
 * Handle /browse command
 */
const browseCommand = asyncHandler(async (ctx) => {
  ctx.session.currentPath = '/';
  
  const message = fmt`📁 ${bold('Просмотр файлов')}

Переход к просмотру файлов в облачном хранилище...`;
  
  await ctx.reply(message);
  
  // Trigger file browser
  const { fileNavigationHandler } = await import('../handlers/fileNavigation.js');
  await fileNavigationHandler(ctx, { a: 'browse', t: 'start' });
});

/**
 * Display search results with pagination
 * @param {Object} ctx - Telegraf context
 * @param {number} messageId - Message ID to edit
 */
async function displaySearchResults(ctx, messageId) {
  const { searchResults, searchType, searchQuery, currentPage } = ctx.session;
  const pagination = paginate(searchResults, currentPage, 10);
  
  let messageText;
  
  if (searchType === 'composer') {
    messageText = fmt`🔍 ${bold('Произведения композитора:')} ${italic(searchQuery)}

${createPaginationInfo(pagination.currentPage, pagination.totalPages, pagination.totalItems)}

${pagination.items.map((work, index) => formatWork(work, pagination.currentPage * 10 + index)).join('\n\n')}`;
  } else {
    messageText = fmt`🔍 ${bold('Поиск произведения:')} ${italic(searchQuery)}

${createPaginationInfo(pagination.currentPage, pagination.totalPages, pagination.totalItems)}

${pagination.items.map((work, index) => formatWork(work, pagination.currentPage * 10 + index)).join('\n\n')}`;
  }

  const keyboard = createSearchResultsKeyboard(pagination.items, pagination, 'search');

  if (messageId) {
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      messageId,
      undefined,
      messageText,
      keyboard
    );
  } else {
    await ctx.reply(messageText, keyboard);
  }
}

/**
 * Display term search results
 * @param {Object} ctx - Telegraf context
 * @param {number} messageId - Message ID to edit
 */
async function displayTermResults(ctx, messageId) {
  const { searchResults, searchQuery, currentPage } = ctx.session;
  const pagination = paginate(searchResults, currentPage, 5); // Fewer terms per page due to descriptions
  
  const messageText = fmt`📚 ${bold('Музыкальные термины:')} ${italic(searchQuery)}

${createPaginationInfo(pagination.currentPage, pagination.totalPages, pagination.totalItems)}

${pagination.items.map(formatTerm).join('\n\n')}`;

  const keyboard = createSearchResultsKeyboard(pagination.items, pagination, 'terms');

  if (messageId) {
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      messageId,
      undefined,
      messageText,
      keyboard
    );
  } else {
    await ctx.reply(messageText, keyboard);
  }
}

export { displaySearchResults, displayTermResults };