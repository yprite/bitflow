import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSentiment } from '@/lib/samsung/sentiment-service'
import { getMarketDate } from '@/lib/samsung/market-day'
import { getSessionTokenFromCookies, findSessionIdByToken } from '@/lib/samsung/anonymous-session'

const STOCK_SLUG = 'samsung'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionToken = getSessionTokenFromCookies(cookieStore)

    let sessionId: string | null = null
    if (sessionToken) {
      sessionId = await findSessionIdByToken(sessionToken)
    }

    const marketDate = getMarketDate()
    const sentiment = await getSentiment(STOCK_SLUG, marketDate, sessionId)

    return NextResponse.json(sentiment)
  } catch {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}
