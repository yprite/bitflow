import { NextResponse } from 'next/server';
import { fetchFundingRateHistory, fetchFearGreedHistory } from '@/lib/kimp';
import { loadExtendedKimpHistory } from '@/lib/kimp-history';
import type { IndicatorsPageData } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [kimpHistory, fundingRateHistory, fearGreedHistory] =
      await Promise.allSettled([
        loadExtendedKimpHistory(30),
        fetchFundingRateHistory(100),
        fetchFearGreedHistory(30),
      ]);

    const data: IndicatorsPageData = {
      kimpHistory:
        kimpHistory.status === 'fulfilled' ? kimpHistory.value : [],
      fundingRateHistory:
        fundingRateHistory.status === 'fulfilled' ? fundingRateHistory.value : [],
      fearGreedHistory:
        fearGreedHistory.status === 'fulfilled' ? fearGreedHistory.value : [],
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Indicators API error:', error);
    return NextResponse.json(
      { error: '지표 데이터를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
