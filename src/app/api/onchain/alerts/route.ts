import { NextResponse } from 'next/server';
import { fetchOnchainAlerts } from '@/lib/onchain';

export const dynamic = 'force-dynamic';

function toPositiveInt(value: string | null, fallback: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), max);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const alerts = await fetchOnchainAlerts(
      toPositiveInt(searchParams.get('limit'), 10, 50)
    );

    return NextResponse.json({
      alerts,
      total: alerts.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('On-chain alerts API error:', error);
    return NextResponse.json(
      { error: '온체인 알림 데이터를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
