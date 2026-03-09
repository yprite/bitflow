import { NextResponse } from 'next/server'
import { getSnapshots } from '@/lib/samsung/snapshot-service'

const STOCK_SLUG = 'samsung'
const DEFAULT_HOURS = 24
const MAX_HOURS = 168

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const hoursParam = searchParams.get('hours')
    const hours = hoursParam
      ? Math.min(Math.max(parseInt(hoursParam, 10) || DEFAULT_HOURS, 1), MAX_HOURS)
      : DEFAULT_HOURS

    const snapshots = await getSnapshots(STOCK_SLUG, hours)

    return NextResponse.json({ data: snapshots })
  } catch {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}
