import { createServiceClient } from '@/lib/supabase'
import type { VoteSide, VoteResult } from './types'
import { calculateBadge, calculateSampleState } from './sentiment-rules'
import { getParticipantLabel, getPositionLabel, getBadgeLabel } from './labels'

interface AggregateRow {
  readonly stock_slug: string
  readonly market_date: string
  readonly bull_count: number
  readonly bear_count: number
  readonly total_count: number
  readonly bull_ratio: number
}

export async function castVote(
  sessionId: string,
  stockSlug: string,
  side: VoteSide,
  marketDate: string
): Promise<VoteResult> {
  const existingVote = await findExistingVote(sessionId, stockSlug, marketDate)

  if (existingVote && existingVote.side === side) {
    return buildVoteResult(stockSlug, marketDate, side, false)
  }

  if (existingVote) {
    await updateVote(existingVote.id, side)
    await adjustAggregates(stockSlug, marketDate, existingVote.side as VoteSide, side)
  } else {
    await insertVote(sessionId, stockSlug, side, marketDate)
    await incrementAggregate(stockSlug, marketDate, side)
  }

  return buildVoteResult(stockSlug, marketDate, side, true)
}

async function findExistingVote(
  sessionId: string,
  stockSlug: string,
  marketDate: string
): Promise<{ id: string; side: string } | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('votes')
    .select('id, side')
    .eq('session_id', sessionId)
    .eq('stock_slug', stockSlug)
    .eq('market_date', marketDate)
    .single()

  if (error || !data) {
    return null
  }
  return { id: data.id, side: data.side }
}

async function insertVote(
  sessionId: string,
  stockSlug: string,
  side: VoteSide,
  marketDate: string
): Promise<void> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('votes')
    .insert({
      session_id: sessionId,
      stock_slug: stockSlug,
      side,
      market_date: marketDate,
    })

  if (error) {
    throw new Error(`Failed to insert vote: ${error.message}`)
  }
}

async function updateVote(voteId: string, newSide: VoteSide): Promise<void> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('votes')
    .update({ side: newSide, updated_at: new Date().toISOString() })
    .eq('id', voteId)

  if (error) {
    throw new Error(`Failed to update vote: ${error.message}`)
  }
}

async function incrementAggregate(
  stockSlug: string,
  marketDate: string,
  side: VoteSide
): Promise<void> {
  const supabase = createServiceClient()
  const { error } = await supabase.rpc('increment_vote_aggregate', {
    p_stock_slug: stockSlug,
    p_market_date: marketDate,
    p_side: side,
  })

  if (error) {
    throw new Error(`Failed to increment aggregate: ${error.message}`)
  }
}

async function adjustAggregates(
  stockSlug: string,
  marketDate: string,
  oldSide: VoteSide,
  newSide: VoteSide
): Promise<void> {
  const supabase = createServiceClient()
  const { error } = await supabase.rpc('adjust_vote_aggregate', {
    p_stock_slug: stockSlug,
    p_market_date: marketDate,
    p_old_side: oldSide,
    p_new_side: newSide,
  })

  if (error) {
    throw new Error(`Failed to adjust aggregate: ${error.message}`)
  }
}

async function upsertAggregate(
  stockSlug: string,
  marketDate: string,
  counts: { bull_count: number; bear_count: number; total_count: number }
): Promise<void> {
  const bullRatio = counts.total_count > 0
    ? counts.bull_count / counts.total_count
    : 0.5

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('vote_daily_aggregates')
    .upsert(
      {
        stock_slug: stockSlug,
        market_date: marketDate,
        bull_count: counts.bull_count,
        bear_count: counts.bear_count,
        total_count: counts.total_count,
        bull_ratio: bullRatio,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'stock_slug,market_date' }
    )

  if (error) {
    throw new Error(`Failed to upsert aggregate: ${error.message}`)
  }
}

export async function getAggregates(
  stockSlug: string,
  marketDate: string
): Promise<AggregateRow | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('vote_daily_aggregates')
    .select('*')
    .eq('stock_slug', stockSlug)
    .eq('market_date', marketDate)
    .single()

  if (error || !data) {
    return null
  }
  return data as AggregateRow
}

export async function refreshAggregates(
  stockSlug: string,
  marketDate: string
): Promise<void> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('votes')
    .select('side')
    .eq('stock_slug', stockSlug)
    .eq('market_date', marketDate)

  if (error) {
    throw new Error(`Failed to query votes for refresh: ${error.message}`)
  }

  const votes = data ?? []
  const bullCount = votes.filter((v) => v.side === 'bull').length
  const bearCount = votes.filter((v) => v.side === 'bear').length
  const totalCount = bullCount + bearCount

  await upsertAggregate(stockSlug, marketDate, {
    bull_count: bullCount,
    bear_count: bearCount,
    total_count: totalCount,
  })
}

async function buildVoteResult(
  stockSlug: string,
  marketDate: string,
  side: VoteSide,
  changed: boolean,
): Promise<VoteResult> {
  const aggregates = await getAggregates(stockSlug, marketDate)
  const bullCount = aggregates?.bull_count ?? 0
  const bearCount = aggregates?.bear_count ?? 0
  const totalCount = aggregates?.total_count ?? 0
  const bullRatio = aggregates?.bull_ratio ?? 0.5

  const badge = calculateBadge(bullRatio, totalCount, null, false)
  const sampleState = calculateSampleState(totalCount)
  const positionLabel = getPositionLabel(side, bullRatio)
  const participantLabel = getParticipantLabel(totalCount)
  const badgeLabel = getBadgeLabel(badge)

  return {
    success: true,
    side,
    changed,
    bullRatio,
    totalCount,
    bullCount,
    bearCount,
    positionLabel,
    badge,
    badgeLabel,
    participantLabel,
    sampleState,
  }
}
