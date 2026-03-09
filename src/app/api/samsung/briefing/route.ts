import { NextResponse } from 'next/server'
import { getBriefing } from '@/lib/samsung/briefing-service'
import { getMarketDate } from '@/lib/samsung/market-day'

const STOCK_SLUG = 'samsung'

export async function GET() {
  try {
    const marketDate = getMarketDate()
    const briefing = await getBriefing(STOCK_SLUG, marketDate)

    return NextResponse.json(briefing)
  } catch {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}
