import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { getKimpData } from '@/lib/kimp';
import { getKimpHistoryBucketAt, saveKimpHistorySample } from '@/lib/kimp-history';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const kimp = await getKimpData();
    const saved = await saveKimpHistorySample(kimp);

    if (!saved) {
      return NextResponse.json(
        { error: 'Kimp history storage unavailable' },
        { status: 503 }
      );
    }

    return NextResponse.json({
      saved,
      bucketAt: getKimpHistoryBucketAt(kimp.timestamp),
      kimp: Number(kimp.kimchiPremium.toFixed(2)),
      timestamp: kimp.timestamp,
    });
  } catch (error) {
    console.error('Cron collect-kimp error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
