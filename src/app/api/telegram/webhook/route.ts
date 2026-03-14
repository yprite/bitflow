import { NextRequest, NextResponse } from 'next/server';
import { getKimpData } from '@/lib/kimp';
import { sendTelegramMessage, formatKimpMessage } from '@/lib/telegram';
import { getAlertUser, setAlertUser, deleteAlertUser } from '@/lib/kv';
import type { AlertUser } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    text?: string;
  };
}

function verifyWebhookSecret(req: NextRequest): boolean {
  const secret = req.headers.get('x-telegram-bot-api-secret-token');
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected) return true; // 시크릿 미설정 시 통과
  return secret === expected;
}

async function handleCommand(chatId: number, text: string): Promise<void> {
  const command = text.trim().toLowerCase();

  if (command === '/start') {
    await sendTelegramMessage(chatId, [
      `🇰🇷 *비트코인 기상청 봇*`,
      ``,
      `사용 가능한 명령어:`,
      `/kimp - 현재 김프 조회`,
      `/alert 3.0 - 김프 3.0% 이상 알림 설정`,
      `/alert off - 알림 해제`,
      `/status - 내 알림 설정 현황`,
    ].join('\n'));
    return;
  }

  if (command === '/kimp') {
    try {
      const data = await getKimpData();
      const msg = formatKimpMessage(
        data.kimchiPremium,
        data.upbitPrice,
        data.globalPrice,
        data.usdKrw
      );
      await sendTelegramMessage(chatId, msg);
    } catch (error) {
      console.error('Kimp fetch error:', error);
      await sendTelegramMessage(chatId, '데이터 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
    return;
  }

  if (command.startsWith('/alert')) {
    const arg = command.replace('/alert', '').trim();

    if (arg === 'off') {
      await deleteAlertUser(chatId);
      await sendTelegramMessage(chatId, '🔕 알림이 해제되었습니다.');
      return;
    }

    const threshold = parseFloat(arg);
    if (isNaN(threshold) || threshold <= 0) {
      await sendTelegramMessage(chatId, [
        '사용법:',
        `/alert 3.0 → 김프 3.0% 이상 알림`,
        `/alert off → 알림 해제`,
      ].join('\n'));
      return;
    }

    const user: AlertUser = { chatId, threshold, active: true };
    await setAlertUser(user);
    await sendTelegramMessage(chatId, `🔔 김프 *${threshold}%* 이상 알림이 설정되었습니다.`);
    return;
  }

  if (command === '/status') {
    const user = await getAlertUser(chatId);
    if (!user || !user.active) {
      await sendTelegramMessage(chatId, '현재 설정된 알림이 없습니다.\n`/alert 3.0` 으로 설정해보세요.');
    } else {
      await sendTelegramMessage(chatId, `🔔 알림 설정: 김프 *${user.threshold}%* 이상\n상태: 활성`);
    }
    return;
  }

  await sendTelegramMessage(chatId, '알 수 없는 명령어입니다. /start 를 입력해 도움말을 확인하세요.');
}

export async function POST(req: NextRequest) {
  if (!verifyWebhookSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const update: TelegramUpdate = await req.json();
    const message = update.message;

    if (message?.text) {
      await handleCommand(message.chat.id, message.text);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
