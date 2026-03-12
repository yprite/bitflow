import { NextRequest, NextResponse } from 'next/server';
import { getKimpData } from '@/lib/kimp';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { sendTelegramMessage, formatKimpMessage } from '@/lib/telegram';
import { getAllAlertUsers } from '@/lib/kv';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [kimp, users] = await Promise.all([
      getKimpData(),
      getAllAlertUsers(),
    ]);

    if (users.length === 0) {
      return NextResponse.json({ message: 'No active alerts', sent: 0 });
    }

    let sentCount = 0;
    const msg = formatKimpMessage(
      kimp.kimchiPremium,
      kimp.upbitPrice,
      kimp.globalPrice,
      kimp.usdKrw
    );

    for (const user of users) {
      if (Math.abs(kimp.kimchiPremium) >= user.threshold) {
        try {
          const alertMsg = `⚠️ *김프 알림*\n설정 임계값: ${user.threshold}%\n\n${msg}`;
          await sendTelegramMessage(user.chatId, alertMsg);
          sentCount++;
        } catch (error) {
          console.error(`Alert send failed for ${user.chatId}:`, error);
        }
      }
    }

    return NextResponse.json({
      kimp: kimp.kimchiPremium.toFixed(2),
      totalUsers: users.length,
      sent: sentCount,
    });
  } catch (error) {
    console.error('Cron check-alerts error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
