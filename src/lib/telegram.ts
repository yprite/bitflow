const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

export async function sendTelegramMessage(chatId: number, text: string): Promise<void> {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error(`Telegram sendMessage failed: ${err}`);
    }
  } catch (error) {
    console.error('Telegram sendMessage error:', error);
  }
}

export function formatKimpMessage(
  kimchiPremium: number,
  upbitPrice: number,
  globalPrice: number,
  usdKrw: number
): string {
  const sign = kimchiPremium >= 0 ? '+' : '';
  return [
    `🇰🇷 *김치프리미엄 현황*`,
    ``,
    `김프: *${sign}${kimchiPremium.toFixed(2)}%*`,
    `업비트 BTC: ${upbitPrice.toLocaleString()}원`,
    `해외 BTC: $${globalPrice.toLocaleString()}`,
    `환율(USD/KRW): ${usdKrw.toFixed(0)}원`,
    ``,
    `_${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}_`,
  ].join('\n');
}
