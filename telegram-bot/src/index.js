import { Telegraf, session } from 'telegraf';
import { message } from 'telegraf/filters';
import dotenv from 'dotenv';
import { startCommand, mainMenuCallback } from './commands/start.js';
import { helpCommand } from './commands/help.js';
import { statsCommand } from './commands/stats.js';
import { searchCommands } from './commands/search.js';
import { fileNavigation } from './handlers/fileNavigation.js';
import { searchHandlers } from './handlers/searchHandlers.js';
import { errorHandler } from './utils/errorHandler.js';
import { testDatabaseConnection, closeDatabaseConnection } from './services/database.js';

// Load environment variables
dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is required in .env file');
  process.exit(1);
}

// Create bot instance
const bot = new Telegraf(BOT_TOKEN);

// Session middleware for navigation state
bot.use(session({
  defaultSession: () => ({
    currentPath: '/',
    searchResults: [],
    currentPage: 0,
    searchType: null,
    searchQuery: ''
  })
}));

// Error handling middleware
bot.catch(errorHandler);

// Commands
bot.command('start', startCommand);
bot.command('help', helpCommand);
bot.command('stats', statsCommand);

// Main menu callback
bot.action(/^main:/, async (ctx) => {
  try {
    const callbackData = JSON.parse(ctx.callbackQuery.data.replace('main:', ''));
    if (callbackData.t === 'menu') {
      await mainMenuCallback(ctx);
    }
    await ctx.answerCbQuery();
  } catch (error) {
    console.error('Main menu callback error:', error);
    await ctx.answerCbQuery('Ошибка обработки команды');
  }
});



// Search commands
searchCommands(bot);

// Callback query handlers for navigation
fileNavigation(bot);
searchHandlers(bot);

// Text message handlers
bot.on(message('text'), async (ctx) => {
  const text = ctx.message.text;
  
  // Skip commands
  if (text.startsWith('/')) return;
  
  // Treat regular text as search query
  await ctx.reply(
    '🔍 Для поиска используйте команды:\n\n' +
    '/search_composer <имя композитора>\n' +
    '/search_work <название произведения>\n' +
    '/search_term <музыкальный термин>\n' +
    '/browse - просмотр файлов\n\n' +
    'Или используйте /help для получения помощи'
  );
});

// Launch bot
async function startBot() {
  console.log('🤖 Starting Music Library Telegram Bot...');

  // Test database connection
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.warn('⚠️  Database connection failed, some features may not work properly');
  }

  bot.launch({
    dropPendingUpdates: true
  }).then(() => {
    console.log('✅ Bot started successfully!');
    console.log('🎵 Ready to help users search music library');
    if (dbConnected) {
      console.log('💾 Database connection: OK');
    }
  }).catch((error) => {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  });
}

startBot();

// Graceful shutdown
process.once('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  await closeDatabaseConnection();
  bot.stop('SIGINT');
});

process.once('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  await closeDatabaseConnection();
  bot.stop('SIGTERM');
});

export default bot;