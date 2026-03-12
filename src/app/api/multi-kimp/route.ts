import { NextResponse } from 'next/server';
import { fetchMultiCoinKimp } from '@/lib/kimp';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await fetchMultiCoinKimp();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Multi-coin kimp API error:', error);
    return NextResponse.json(
      { error: '멀티코인 데이터를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
