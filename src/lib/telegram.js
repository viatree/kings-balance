import TelegramBot from 'node-telegram-bot-api';
import { getAccessToken, getBalance } from './kingsgate.js';

const token = process.env.TELEGRAM_BOT_TOKEN;
let bot = null;

export function initTelegramBot() {
  if (!token) {
    console.warn('TELEGRAM_BOT_TOKEN belum di-set');
    return;
  }
  if (bot) return bot;

  bot = new TelegramBot(token, { polling: true });

  bot.onText(/^\/start$/i, (msg) => {
    bot.sendMessage(msg.chat.id, `Halo ${msg.from?.first_name || ''}! Ketik /balance untuk cek saldo.`);
  });

  bot.onText(/^\/balance$/i, async (msg) => {
    const chatId = msg.chat.id;
    try {
      await bot.sendChatAction(chatId, 'typing');
      const accessToken = await getAccessToken();
      const balance = await getBalance(accessToken);
      bot.sendMessage(chatId, `💰 Saldo merchant: *${balance}*`, { parse_mode: 'Markdown' });
    } catch (e) {
      bot.sendMessage(chatId, `Gagal ambil saldo. ${e.message || ''}`);
    }
  });

  console.log('🤖 Telegram bot aktif (long-polling)');
}
