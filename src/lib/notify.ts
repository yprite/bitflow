/**
 * Notification module: Telegram + macOS Notification Center
 */

export async function sendTelegram(message: string): Promise<boolean> {
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
    if (!res.ok) {
      console.error('[notify] Telegram error:', await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('[notify] Telegram failed:', err);
    return false;
  }
}

export async function sendMacNotification(title: string, message: string): Promise<void> {
  try {
    const { exec } = await import('child_process');
    const escaped = message.replace(/"/g, '\\"');
    exec(
      `osascript -e 'display notification "${escaped}" with title "Bitflow: ${title}"'`
    );
  } catch {
    // Silently fail if not on macOS
  }
}

export async function notify(title: string, message: string): Promise<void> {
  await Promise.all([
    sendTelegram(`<b>${title}</b>\n${message}`),
    sendMacNotification(title, message),
  ]);
}
