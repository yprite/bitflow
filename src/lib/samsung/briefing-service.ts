import { createServiceClient } from '@/lib/supabase'
import type { BriefingData, BriefingItem } from './types'

export async function getBriefing(
  stockSlug: string,
  marketDate: string
): Promise<BriefingData> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('briefings')
    .select('id, slot, title, summary, tone')
    .eq('stock_slug', stockSlug)
    .eq('market_date', marketDate)
    .order('slot', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch briefings: ${error.message}`)
  }

  const items: readonly BriefingItem[] = (data ?? []).map(mapBriefingRow)

  return {
    stockSlug,
    marketDate,
    bullIssues: items.filter((item) => item.tone === 'bull'),
    bearIssues: items.filter((item) => item.tone === 'bear'),
    neutralIssues: items.filter((item) => item.tone === 'neutral'),
  }
}

function mapBriefingRow(row: Record<string, unknown>): BriefingItem {
  return {
    id: row.id as string,
    slot: row.slot as number,
    title: row.title as string,
    summary: row.summary as string,
    tone: row.tone as 'bull' | 'bear' | 'neutral',
  }
}
