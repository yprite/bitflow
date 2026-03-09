import { createServiceClient } from '@/lib/supabase'
import type { SnapshotEntry } from './types'
import { getAggregates } from './vote-service'
import { getMarketDate } from './market-day'

const DEFAULT_HOURS = 24

export async function getSnapshots(
  stockSlug: string,
  hours: number = DEFAULT_HOURS
): Promise<readonly SnapshotEntry[]> {
  const supabase = createServiceClient()
  const since = new Date()
  since.setHours(since.getHours() - hours)

  const { data, error } = await supabase
    .from('vote_snapshots')
    .select('*')
    .eq('stock_slug', stockSlug)
    .gte('bucket_at', since.toISOString())
    .order('bucket_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch snapshots: ${error.message}`)
  }

  return (data ?? []).map(mapSnapshotRow)
}

export async function createSnapshot(stockSlug: string): Promise<SnapshotEntry> {
  const marketDate = getMarketDate()
  const aggregates = await getAggregates(stockSlug, marketDate)

  const bullCount = aggregates?.bull_count ?? 0
  const bearCount = aggregates?.bear_count ?? 0
  const totalCount = aggregates?.total_count ?? 0
  const bullRatio = aggregates?.bull_ratio ?? 0.5

  const bucketAt = getBucketTimestamp()
  const previousSnapshot = await getPreviousSnapshot(stockSlug, bucketAt)

  const delta1h = previousSnapshot
    ? bullRatio - previousSnapshot.bullRatio
    : null

  const isFlip = previousSnapshot
    ? (previousSnapshot.bullRatio >= 0.5 && bullRatio < 0.5) ||
      (previousSnapshot.bullRatio < 0.5 && bullRatio >= 0.5)
    : false

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('vote_snapshots')
    .upsert(
      {
        stock_slug: stockSlug,
        bucket_at: bucketAt,
        bull_count: bullCount,
        bear_count: bearCount,
        total_count: totalCount,
        bull_ratio: bullRatio,
        delta_1h: delta1h,
        is_flip: isFlip,
      },
      { onConflict: 'stock_slug,bucket_at' }
    )
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(`Failed to create snapshot: ${error?.message ?? 'Unknown error'}`)
  }

  return mapSnapshotRow(data)
}

function getBucketTimestamp(): string {
  const now = new Date()
  const bucket = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours())
  return bucket.toISOString()
}

async function getPreviousSnapshot(
  stockSlug: string,
  currentBucket: string
): Promise<SnapshotEntry | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('vote_snapshots')
    .select('*')
    .eq('stock_slug', stockSlug)
    .lt('bucket_at', currentBucket)
    .order('bucket_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return null
  }

  return mapSnapshotRow(data)
}

function mapSnapshotRow(row: Record<string, unknown>): SnapshotEntry {
  return {
    id: row.id as string,
    stockSlug: row.stock_slug as string,
    bucketAt: row.bucket_at as string,
    bullCount: row.bull_count as number,
    bearCount: row.bear_count as number,
    totalCount: row.total_count as number,
    bullRatio: row.bull_ratio as number,
    delta1h: row.delta_1h as number | null,
    isFlip: row.is_flip as boolean,
    createdAt: row.created_at as string,
  }
}
