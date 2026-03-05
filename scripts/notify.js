#!/usr/bin/env node
/**
 * notify.js - Common notification module for scripts
 * Telegram + macOS Notification Center
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

async function sendTelegram(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn('[notify] Telegram credentials not configured');
    return false;
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `[Bitflow] ${message}`,
          parse_mode: 'HTML',
        }),
      }
    );
    return res.ok;
  } catch (err) {
    console.error('[notify] Telegram failed:', err.message);
    return false;
  }
}

function sendMacNotification(title, message) {
  try {
    const { execSync } = require('child_process');
    const escaped = message.replace(/"/g, '\\"');
    execSync(
      `osascript -e 'display notification "${escaped}" with title "Bitflow: ${title}"'`
    );
  } catch {
    // Silently fail if not on macOS
  }
}

async function notify(title, message) {
  await sendTelegram(`<b>${title}</b>\n${message}`);
  sendMacNotification(title, message);
}

module.exports = { sendTelegram, sendMacNotification, notify };
