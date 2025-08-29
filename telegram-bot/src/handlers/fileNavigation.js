import { fmt, bold, italic, link } from 'telegraf/format';
import { listCloudFiles, getFileDownloadUrl } from '../services/api.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { parseCallbackData, createFileBrowserKeyboard, createMainMenuKeyboard } from '../utils/keyboards.js';
import { createBreadcrumb, createPaginationInfo, paginate, getFileIcon, formatFileSize } from '../utils/formatting.js';
import { mainMenuCallback } from '../commands/start.js';

/**
 * Register file navigation handlers
 * @param {Object} bot - Telegraf bot instance
 */
export function fileNavigation(bot) {
  bot.action(/^browse:/, fileNavigationHandler);
  bot.action(/^download:/, downloadHandler);
  bot.action(/^main:/, mainHandler);
  // Add handler for new JSON format
  bot.action(/^{.*"a":"browse"/, (ctx) => {
    const callbackData = JSON.parse(ctx.callbackQuery.data);
    return fileNavigationHandler(ctx, callbackData);
  });
  bot.action(/^{.*"a":"download"/, (ctx) => {
    const callbackData = JSON.parse(ctx.callbackQuery.data);
    return downloadHandler(ctx, callbackData);
  });
  bot.action(/^{.*"a":"main"/, (ctx) => {
    const callbackData = JSON.parse(ctx.callbackQuery.data);
    return mainHandler(ctx, callbackData);
  });
}

/**
 * Handle file navigation callbacks
 */
export const fileNavigationHandler = asyncHandler(async (ctx, callbackData) => {
  // Parse callback data if it's a string
  let data = callbackData;
  if (typeof callbackData === 'string') {
    data = parseCallbackData(callbackData.replace('browse:', ''));
  }
  
  console.log('File navigation handler called with data:', data);
  
  switch (data.t) {
    case 'start':
      await handleBrowseStart(ctx);
      break;
    case 'navigate':
      await handleNavigate(ctx, data);
      break;
    case 'page':
      await handleBrowsePage(ctx, data);
      break;
    case 'download':
      await handleFileDownload(ctx, data);
      break;
    case 'noop':
      await ctx.answerCbQuery();
      break;
    default:
      console.log('Unknown file navigation action:', data.t);
      await ctx.answerCbQuery('Неизвестная команда');
  }
});

/**
 * Handle download callbacks
 */
const downloadHandler = asyncHandler(async (ctx, callbackData = null) => {
  let data = callbackData;
  if (!data) {
    data = parseCallbackData(ctx.callbackQuery.data.replace('download:', ''));
  }
  
  switch (data.t) {
    case 'file':
      await handleFileDownload(ctx, data);
      break;
    default:
      await handleFileDownload(ctx, data);
  }
});

/**
 * Handle main menu callbacks
 */
const mainHandler = asyncHandler(async (ctx, callbackData = null) => {
  let data = callbackData;
  if (!data) {
    data = parseCallbackData(ctx.callbackQuery.data.replace('main:', ''));
  }
  
  if (data.t === 'menu') {
    await mainMenuCallback(ctx);
  }
});

/**
 * Start file browsing
 */
async function handleBrowseStart(ctx) {
  ctx.session.currentPath = '/';
  ctx.session.currentPage = 0;
  
  const loadingMsg = `📁 **Загрузка файлов...**`;
  
  let messageId;
  if (ctx.callbackQuery) {
    await ctx.editMessageText(loadingMsg);
    messageId = ctx.callbackQuery.message.message_id;
    await ctx.answerCbQuery();
  } else {
    const msg = await ctx.reply(loadingMsg);
    messageId = msg.message_id;
  }
  
  try {
    await displayDirectoryContents(ctx, '/', messageId);
  } catch (error) {
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      messageId,
      undefined,
      `❌ **Ошибка загрузки файлов**\n${error.message}`,
      {
        reply_markup: createMainMenuKeyboard().inline_keyboard,
        parse_mode: 'Markdown'
      }
    );
  }
}

/**
 * Navigate to directory
 */
async function handleNavigate(ctx, callbackData) {
  const path = callbackData.path || '/';
  ctx.session.currentPath = path;
  ctx.session.currentPage = 0;
  
  const loadingMsg = `📁 **Загрузка...**`;
  await ctx.editMessageText(loadingMsg);
  
  try {
    await displayDirectoryContents(ctx, path, ctx.callbackQuery.message.message_id);
    await ctx.answerCbQuery();
  } catch (error) {
    await ctx.editMessageText(
      `❌ **Ошибка загрузки директории**\n${error.message}`,
      {
        reply_markup: createMainMenuKeyboard().inline_keyboard,
        parse_mode: 'Markdown'
      }
    );
    await ctx.answerCbQuery('Ошибка загрузки');
  }
}

/**
 * Handle pagination in file browser
 */
async function handleBrowsePage(ctx, callbackData) {
  const page = callbackData.page || 0;
  const path = callbackData.path || ctx.session.currentPath || '/';
  
  ctx.session.currentPage = page;
  
  try {
    await displayDirectoryContents(ctx, path, ctx.callbackQuery.message.message_id);
    await ctx.answerCbQuery();
  } catch (error) {
    await ctx.answerCbQuery('Ошибка загрузки страницы');
  }
}

/**
 * Handle file download
 */
async function handleFileDownload(ctx, callbackData) {
  const filePath = callbackData.path;
  const fileName = callbackData.name || filePath?.split('/').pop() || 'файл';
  
  if (!filePath) {
    await ctx.answerCbQuery('Путь к файлу не указан');
    return;
  }
  
  try {
    const downloadUrl = getFileDownloadUrl(filePath);
    
    const message = `📄 **Скачивание файла**\n\n*Файл:* ${fileName}\n*Путь:* ${filePath}\n\n[📥 Скачать файл](${downloadUrl})\n\n*Нажмите на ссылку выше для скачивания файла*`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '⬅️ Назад к файлам', callback_data: `{"a":"browse","t":"navigate","path":"${ctx.session.currentPath || '/'}"}` }
        ],
        [
          { text: '🏠 Главное меню', callback_data: '{"a":"main","t":"menu"}' }
        ]
      ]
    };

    await ctx.editMessageText(message, { 
      reply_markup: keyboard,
      parse_mode: 'Markdown',
      disable_web_page_preview: false
    });
    await ctx.answerCbQuery('Ссылка для скачивания готова');
    
  } catch (error) {
    console.error('Download error:', error);
    await ctx.editMessageText(
      `❌ **Ошибка скачивания**\n${error.message}`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '⬅️ Назад', callback_data: '{"a":"browse","t":"navigate","path":"/"}' }]
          ]
        },
        parse_mode: 'Markdown'
      }
    );
    await ctx.answerCbQuery('Ошибка скачивания');
  }
}

/**
 * Display directory contents with pagination
 */
async function displayDirectoryContents(ctx, path, messageId) {
  const files = await listCloudFiles(path);
  
  // Filter and sort files
  const sortedFiles = files
    .filter(file => file.basename !== '.' && file.basename !== '..')
    .sort((a, b) => {
      // Directories first, then files
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;
      // Then alphabetically
      return (a.basename || a.name || '').localeCompare(b.basename || b.name || '');
    });

  if (sortedFiles.length === 0) {
    const breadcrumb = createBreadcrumb(path);
    const message = `📁 **Пустая директория**\n\n${breadcrumb}\n\nЭта папка не содержит файлов.`;

    const keyboard = {
      inline_keyboard: [
        path !== '/' ? [{ text: '⬆️ Назад', callback_data: `{"a":"browse","t":"navigate","path":"${getParentPath(path)}"}` }] : [],
        [{ text: '🏠 Главное меню', callback_data: '{"a":"main","t":"menu"}' }]
      ].filter(row => row.length > 0)
    };

    await ctx.telegram.editMessageText(
      ctx.chat.id,
      messageId,
      undefined,
      message,
      { 
        reply_markup: keyboard,
        parse_mode: 'Markdown'
      }
    );
    return;
  }

  // Paginate files
  const currentPage = ctx.session.currentPage || 0;
  const pagination = paginate(sortedFiles, currentPage, 10);
  
  // Create message
  const breadcrumb = createBreadcrumb(path);
  const paginationInfo = createPaginationInfo(pagination.currentPage, pagination.totalPages, pagination.totalItems);
  
  // Add file list
  const fileList = pagination.items.map((file, index) => {
    const icon = getFileIcon(file);
    const name = file.basename || file.name || 'Неизвестный файл';
    const size = file.size ? ` (${formatFileSize(file.size)})` : '';
    const globalIndex = pagination.currentPage * 10 + index + 1;
    
    return `${icon} **${globalIndex}.** ${name}${size}`;
  }).join('\n');
  
  const message = `📁 **Просмотр файлов**\n\n${breadcrumb}\n\n${paginationInfo}\n\n${fileList}`;

  const keyboard = createFileBrowserKeyboard(pagination.items, pagination, path);

  await ctx.telegram.editMessageText(
    ctx.chat.id,
    messageId,
    undefined,
    message,
    {
      reply_markup: keyboard.inline_keyboard ? keyboard : keyboard.reply_markup,
      parse_mode: 'Markdown'
    }
  );
}

/**
 * Get parent directory path
 */
function getParentPath(path) {
  if (path === '/' || !path) return '/';
  const parts = path.split('/').filter(Boolean);
  parts.pop();
  return '/' + parts.join('/');
}

export { handleBrowseStart, displayDirectoryContents };