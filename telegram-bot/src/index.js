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

// Session middleware for navigation state (simplified)
bot.use(session());

// Error handling middleware
bot.catch(errorHandler);

// Add debugging middleware
bot.use(async (ctx, next) => {
  console.log('Received update:', {
    type: ctx.updateType,
    message: ctx.message?.text,
    from: ctx.from?.first_name
  });
  await next();
});

// Commands with direct error handling
bot.command('start', async (ctx) => {
  console.log('Start command received from:', ctx.from?.first_name);
  try {
    await ctx.reply('🎵 Музыкальная библиотека запущена!\n\nИспользуйте /test для проверки.');
  } catch (error) {
    console.error('Error in start command:', error);
  }
});
bot.command('help', async (ctx) => {
  console.log('Help command received from:', ctx.from?.first_name);
  try {
    await ctx.reply('🆘 Помощь\n\nДоступные команды:\n/start - начало работы\n/test - тест работы\n/help - эта справка');
  } catch (error) {
    console.error('Error in help command:', error);
  }
});
bot.command('stats', async (ctx) => {
  console.log('Stats command received from:', ctx.from?.first_name);
  try {
    await ctx.reply('📊 Статистика\n\nБот работает нормально.');
  } catch (error) {
    console.error('Error in stats command:', error);
  }
});

// Search commands (temporarily disabled for debugging)
// searchCommands(bot);

// Add a simple test command
bot.command('test', async (ctx) => {
  console.log('Test command received!');
  try {
    await ctx.reply('✅ Bot is working! Test command successful.');
  } catch (error) {
    console.error('Error in test command:', error);
  }
});

// Callback query handlers for navigation (temporarily disabled for debugging)
// fileNavigation(bot);
// searchHandlers(bot);

// Text message handlers
bot.on(message('text'), async (ctx) => {
  const text = ctx.message.text;
  console.log('Text message received:', text, 'from:', ctx.from?.first_name);
  
  // Skip commands
  if (text.startsWith('/')) {
    console.log('Command detected, should be handled by command handler');
    return;
  }
  
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
  console.log('🔑 BOT_TOKEN length:', BOT_TOKEN ? BOT_TOKEN.length : 'undefined');
  console.log('🔑 BOT_TOKEN starts with:', BOT_TOKEN ? BOT_TOKEN.substring(0, 10) + '...' : 'undefined');

  // Test database connection (temporarily disabled for debugging)
  console.log('💾 Skipping database connection test for debugging...');
  const dbConnected = false;
  // const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.warn('⚠️  Database connection skipped for debugging');
  } else {
    console.log('✅ Database connection successful');
  }

  console.log('🚀 Launching bot...');
  try {
    await bot.launch({
      dropPendingUpdates: true
    });
    console.log('✅ Bot started successfully!');
    console.log('🎵 Ready to help users search music library');
    console.log('💾 Database connection:', dbConnected ? 'OK' : 'FAILED');
  } catch (error) {
    console.error('❌ Failed to start bot:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
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