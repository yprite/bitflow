import { NextResponse } from 'next/server';
import {
  fetchOnchainMetricSummaries,
  getOnchainMetricById,
  isOnchainMetricId,
} from '@/lib/onchain';

export const dynamic = 'force-dynamic';

function toPositiveInt(value: string | null, fallback: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), max);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const metricId = searchParams.get('metric') ?? 'spent_btc';

    if (!isOnchainMetricId(metricId)) {
      return NextResponse.json(
        { error: '지원하지 않는 온체인 metric 입니다.' },
        { status: 400 }
      );
    }

    const metrics = await fetchOnchainMetricSummaries(
      toPositiveInt(searchParams.get('days'), 30, 365)
    );

    return NextResponse.json(getOnchainMetricById(metrics, metricId));
  } catch (error) {
    console.error('On-chain metrics API error:', error);
    return NextResponse.json(
      { error: '온체인 시계열 데이터를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
