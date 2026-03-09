import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import type { VoteSide } from '@/lib/samsung/types'
import { getOrCreateSession, setSessionCookie } from '@/lib/samsung/anonymous-session'
import { castVote } from '@/lib/samsung/vote-service'
import { getMarketDate } from '@/lib/samsung/market-day'

const STOCK_SLUG = 'samsung'
const VALID_SIDES: readonly string[] = ['bull', 'bear']

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 10

const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true
  }

  rateLimitStore.set(ip, { ...entry, count: entry.count + 1 })
  return false
}

// Clean up stale entries periodically
setInterval(() => {
  const now = Date.now()
  rateLimitStore.forEach((entry, ip) => {
    if (now > entry.resetAt) {
      rateLimitStore.delete(ip)
    }
  })
}, 300_000)

export async function POST(request: Request) {
  try {
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { side } = body as { side: unknown }

    if (typeof side !== 'string' || !VALID_SIDES.includes(side)) {
      return NextResponse.json(
        { error: 'Invalid side. Must be "bull" or "bear".' },
        { status: 400 }
      )
    }

    const session = await getOrCreateSession()
    const marketDate = getMarketDate()

    const result = await castVote(
      session.sessionId,
      STOCK_SLUG,
      side as VoteSide,
      marketDate
    )

    const response = NextResponse.json(result)

    if (session.isNew) {
      setSessionCookie(response.cookies, session.sessionToken)
    }

    return response
  } catch {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}
