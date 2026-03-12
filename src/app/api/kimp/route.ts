import { NextResponse } from 'next/server';
import { getKimpData, fetchFundingRate, fetchFearGreed, getCompositeSignal } from '@/lib/kimp';
import type { DashboardData } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [kimp, fundingRate, fearGreed] = await Promise.all([
      getKimpData(),
      fetchFundingRate(),
      fetchFearGreed(),
    ]);

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
      avg30d: null, // TODO: 30일 평균은 히스토리 데이터 축적 후 구현
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
