import { NextResponse } from 'next/server';
import { getKimpData, fetchFundingRate, fetchFearGreed, getCompositeSignal } from '@/lib/kimp';
import { loadKimpHistorySnapshot } from '@/lib/kimp-history';
import type { DashboardData } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [kimpResult, fundingRateResult, fearGreedResult] = await Promise.allSettled([
      getKimpData(),
      fetchFundingRate(),
      fetchFearGreed(),
    ]);

    if (kimpResult.status !== 'fulfilled') {
      throw kimpResult.reason;
    }

    const kimp = kimpResult.value;
    const { history, avg30d } = await loadKimpHistorySnapshot(kimp);
    const fundingRate = fundingRateResult.status === 'fulfilled'
      ? fundingRateResult.value
      : {
          symbol: 'BTCUSDT',
          fundingRate: 0,
          nextFundingTime: Date.now() + 8 * 60 * 60 * 1000,
        };
    const fearGreed = fearGreedResult.status === 'fulfilled'
      ? fearGreedResult.value
      : {
          value: 50,
          classification: 'Neutral',
          timestamp: new Date().toISOString(),
        };

    const signal = getCompositeSignal(
      kimp.kimchiPremium,
      fundingRate.fundingRate,
      fearGreed.value
    );

    const data: DashboardData = {
      kimp,
      fundingRate,
      fearGreed,
      signal,
      avg30d,
      history,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Kimp API error:', error);
    return NextResponse.json(
      { error: '데이터를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
