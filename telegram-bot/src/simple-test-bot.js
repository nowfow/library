import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;

console.log('🔍 BOT_TOKEN exists:', !!BOT_TOKEN);
console.log('🔍 BOT_TOKEN length:', BOT_TOKEN?.length);
console.log('🔍 BOT_TOKEN preview:', BOT_TOKEN?.substring(0, 10) + '...');

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is required in .env file');
  process.exit(1);
}

// Create bot instance
const bot = new Telegraf(BOT_TOKEN);

// Simple test command
bot.command('start', async (ctx) => {
  console.log('✅ Start command received from:', ctx.from?.first_name);
  await ctx.reply('🤖 Simple test bot is working!');
});

bot.command('test', async (ctx) => {
  console.log('✅ Test command received from:', ctx.from?.first_name);
  await ctx.reply('✅ Test successful!');
});

// Text handler
bot.on('text', async (ctx) => {
  console.log('📝 Text received:', ctx.message.text, 'from:', ctx.from?.first_name);
  await ctx.reply('I received: ' + ctx.message.text);
});

// Error handler
bot.catch((err, ctx) => {
  console.error('❌ Bot error:', err);
});

// Launch bot
async function startSimpleBot() {
  console.log('🚀 Starting simple test bot...');
  
  try {
    await bot.launch({
      dropPendingUpdates: true
    });
    console.log('✅ Simple bot started successfully!');
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

startSimpleBot();

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));