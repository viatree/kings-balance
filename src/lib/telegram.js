import TelegramBot from 'node-telegram-bot-api';
import { getAccessToken, getBalance } from '../lib/kingsgate.js';

const token = process.env.TELEGRAM_BOT_TOKEN;
let bot = null;

export function initTelegramBot() {
  if (!token) {
    console.warn('TELEGRAM_BOT_TOKEN Hasn\'t been set yet');
    return;
  }
  if (bot) return bot;

  bot = new TelegramBot(token, { polling: true });

  bot.onText(/^\/start$/i, (msg) => {
    bot.sendMessage(msg.chat.id, `Halo ${msg.from?.first_name || ''}! Type /balance for check balance.`);
  });

  bot.onText(/^\/balance$/i, async (msg) => {
    const chatId = msg.chat.id;
    try {
      await bot.sendChatAction(chatId, 'typing');
      const accessToken = await getAccessToken();
      const balance = await getBalance(accessToken);
      bot.sendMessage(chatId, `💰 merchant account balance: *${balance}*`, { parse_mode: 'Markdown' });
    } catch (e) {
      bot.sendMessage(chatId, `Failed to retrieve balance. ${e.message || ''}`);
    }
  });

  console.log('Telegram bot activated (long-polling)');
}
