import { createServiceClient } from '@/lib/supabase'
import type { SentimentData, VoteSide } from './types'
import { getAggregates } from './vote-service'
import { calculateBadge, calculateSampleState } from './sentiment-rules'
import { getParticipantLabel, getPositionLabel, getBadgeLabel } from './labels'
import { formatMarketDate } from './market-day'

export async function getSentiment(
  stockSlug: string,
  marketDate: string,
  sessionId?: string | null
): Promise<SentimentData> {
  const [todayAgg, yesterdayAgg, latestSnapshot, mySide] = await Promise.all([
    getAggregates(stockSlug, marketDate),
    getYesterdayAggregates(stockSlug, marketDate),
    getLatestSnapshot(stockSlug),
    sessionId ? getMyVoteSide(sessionId, stockSlug, marketDate) : Promise.resolve(null),
  ])

  const bullCount = todayAgg?.bull_count ?? 0
  const bearCount = todayAgg?.bear_count ?? 0
  const totalCount = todayAgg?.total_count ?? 0
  const bullRatio = todayAgg?.bull_ratio ?? 0.5
  const bearRatio = totalCount > 0 ? 1 - bullRatio : 0.5

  const deltaYesterday = yesterdayAgg
    ? bullRatio - yesterdayAgg.bull_ratio
    : null

  const delta1h = latestSnapshot?.delta_1h ?? null
  const isFlip = latestSnapshot?.is_flip ?? false

  const badge = calculateBadge(bullRatio, totalCount, delta1h, isFlip)
  const sampleState = calculateSampleState(totalCount)
  const participantLabel = getParticipantLabel(totalCount)
  const badgeLabel = getBadgeLabel(badge)
  const positionLabel = mySide ? getPositionLabel(mySide, bullRatio) : null

  return {
    stockSlug,
    marketDate,
    bullCount,
    bearCount,
    totalCount,
    bullRatio,
    bearRatio,
    deltaYesterday,
    delta1h,
    isFlip,
    badge,
    badgeLabel,
    sampleState,
    participantLabel,
    mySide,
    positionLabel,
  }
}

async function getYesterdayAggregates(
  stockSlug: string,
  marketDate: string
): Promise<{ bull_ratio: number } | null> {
  const yesterday = formatMarketDate(
    new Date(new Date(marketDate).getTime() - 86_400_000)
  )
  return getAggregates(stockSlug, yesterday)
}

async function getLatestSnapshot(
  stockSlug: string
): Promise<{ delta_1h: number | null; is_flip: boolean } | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('vote_snapshots')
    .select('delta_1h, is_flip')
    .eq('stock_slug', stockSlug)
    .order('bucket_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return null
  }
  return { delta_1h: data.delta_1h, is_flip: data.is_flip }
}

async function getMyVoteSide(
  sessionId: string,
  stockSlug: string,
  marketDate: string
): Promise<VoteSide | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('votes')
    .select('side')
    .eq('session_id', sessionId)
    .eq('stock_slug', stockSlug)
    .eq('market_date', marketDate)
    .single()

  if (error || !data) {
    return null
  }
  return data.side as VoteSide
}
