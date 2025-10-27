// scripts/bot.js
import "dotenv/config";
import { Telegraf } from "telegraf";
import pino from "pino";
import {
  getBalance,
  getPaymentMethods,
  getPaymentOrderStatus,
  getPayoutOrderStatus,
} from "../lib/kingsgate.js";

const logger = pino({
  transport: { target: "pino-pretty", options: { colorize: true } },
});

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN belum di-set");
  process.exit(1);
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start((ctx) =>
  ctx.reply(
    [
      "Halo! Aku bot cek saldo Kingsgate 👋",
      "Perintah yang tersedia:",
      "• /balance – cek saldo merchant",
      "• /status <orderId> – cek status (payout/order)",
      "• /methods – daftar payment methods yang aktif",
    ].join("\n")
  )
);

// /balance
bot.command("balance", async (ctx) => {
  try {
    const { balance } = await getBalance();
    await ctx.reply(`💰 Saldo merchant saat ini: *${balance.toFixed(2)}*`, {
      parse_mode: "Markdown",
    });
  } catch (err) {
    logger.error(err, "Gagal ambil saldo");
    await ctx.reply("❌ Gagal mengambil saldo. Coba lagi nanti.");
  }
});

// /methods
bot.command("methods", async (ctx) => {
  try {
    const data = await getPaymentMethods();
    const payins = data?.payins || {};
    const payouts = data?.payouts || {};
    const fmt = (obj) =>
      Object.entries(obj)
        .map(([k, v]) => `- ${k}: ${v ? "✅" : "❌"}`)
        .join("\n");

    await ctx.reply(
      `📋 *Payment Methods*\n\n*Payins:*\n${fmt(payins)}\n\n*Payouts:*\n${fmt(payouts)}`,
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    logger.error(err, "Gagal ambil methods");
    await ctx.reply("❌ Gagal mengambil payment methods.");
  }
});

// /status <orderId>
bot.command("status", async (ctx) => {
  const parts = ctx.message.text.trim().split(/\s+/);
  const orderId = parts[1];
  if (!orderId) return ctx.reply("Format: /status <orderId>");

  try {
    let data;
    try {
      // coba payout dulu
      data = await getPayoutOrderStatus(orderId);
    } catch (e1) {
      // fallback ke payment order status
      data = await getPaymentOrderStatus(orderId);
    }

    const lines = [
      `🔎 *Status untuk Order:* \`${orderId}\``,
      `• status: *${data?.status || "-"}*`,
      `• kgOrderId: ${data?.kgOrderId || "-"}`,
      `• amount: ${data?.transactionDetails?.amount ?? "-"}`,
      `• method: ${data?.transactionDetails?.paymentMethod ?? "-"}`,
      `• time: ${data?.transactionDetails?.time ?? "-"}`,
      `• utr: ${data?.transactionDetails?.utr ?? "-"}`,
      `• user: ${data?.user?.id ?? "-"} | ${data?.user?.name ?? "-"}`,
    ];
    await ctx.reply(lines.join("\n"), { parse_mode: "Markdown" });
  } catch (err) {
    logger.error(err, "Gagal cek status");
    await ctx.reply("❌ Gagal mengambil status. Pastikan orderId benar.");
  }
});

// Long-polling run
bot.launch().then(() => logger.info("Telegram bot started (long-polling)."));

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
