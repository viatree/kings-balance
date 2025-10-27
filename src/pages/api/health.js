import { initTelegramBot } from '@/lib/telegram';

export default function handler(req, res) {
  initTelegramBot();
  res.status(200).json({ ok: true, message: 'Bot is ready!' });
}
