import { NextResponse } from 'next/server';
import { fetchOnchainSummary } from '@/lib/onchain';

export const dynamic = 'force-dynamic';

function toPositiveInt(value: string | null, fallback: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), max);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const data = await fetchOnchainSummary({
      metricLookbackDays: toPositiveInt(searchParams.get('days'), 30, 365),
      alertLimit: toPositiveInt(searchParams.get('alerts'), 8, 50),
      entityLimit: toPositiveInt(searchParams.get('entities'), 6, 24),
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('On-chain summary API error:', error);
    return NextResponse.json(
      { error: '온체인 요약 데이터를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
