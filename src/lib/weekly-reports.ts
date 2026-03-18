import { createServiceClient, hasSupabaseServiceConfig } from './supabase';
import type {
  WeeklyReportArchiveItem,
  WeeklyReportEntityFlow,
  WeeklyReportMarketSnapshot,
  WeeklyReportNewsItem,
  WeeklyReportOnchainSnapshot,
  WeeklyReportRecord,
  WeeklyReportSection,
} from './types';

interface WeeklyReportRow {
  slug: string;
  week_start: string;
  week_end: string;
  title: string;
  dek: string | null;
  summary: string;
  market_view: string;
  onchain_view: string;
  risk_watch: string;
  watchlist: unknown;
  sections: unknown;
  market_snapshot: unknown;
  onchain_snapshot: unknown;
  model_name: string | null;
  generated_by: string;
  generated_at: string;
  published_at: string;
}

interface WeeklyReportNewsRow {
  report_slug: string;
  rank: number;
  title: string;
  source_name: string;
  source_url: string;
  published_at: string | null;
  summary: string;
  why_it_matters: string;
  topic: string | null;
  priority: number | null;
}

interface SupabaseErrorLike {
  code?: string;
  message?: string;
}

const EMPTY_MARKET_SNAPSHOT: WeeklyReportMarketSnapshot = {
  priceUsd: null,
  weeklyPriceChangePercent: null,
  kimpAverage: null,
  kimpLatest: null,
  fearGreedValue: null,
  fearGreedClassification: null,
  fundingRatePercent: null,
};

const EMPTY_ONCHAIN_SNAPSHOT: WeeklyReportOnchainSnapshot = {
  latestDay: null,
  spentBtc7d: null,
  dormantReactivatedBtc7d: null,
  activeSupply30d: null,
  activeSupply90d: null,
  whaleAlertCount7d: null,
  topEntityFlows: [],
};

function getErrorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  return (error as SupabaseErrorLike).code;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as SupabaseErrorLike).message;
    if (typeof message === 'string') {
      return message;
    }
  }

  return String(error);
}

function isMissingWeeklyTablesError(error: unknown): boolean {
  const code = getErrorCode(error);
  if (code === '42P01' || code === 'PGRST205') {
    return true;
  }

  const message = getErrorMessage(error);
  return message.includes('weekly_reports') || message.includes('weekly_report_news_items');
}

function toNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter(Boolean);
}

function toWeeklyReportSections(value: unknown): WeeklyReportSection[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') {
      return [];
    }

    const record = entry as Record<string, unknown>;
    const id = typeof record.id === 'string' ? record.id : '';
    const title = typeof record.title === 'string' ? record.title : '';
    const summary = typeof record.summary === 'string' ? record.summary : '';

    if (!id || !title || !summary) {
      return [];
    }

    return [
      {
        id,
        title,
        summary,
        bullets: toStringArray(record.bullets),
      },
    ];
  });
}

function toEntityFlows(value: unknown): WeeklyReportEntityFlow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') {
      return [];
    }

    const record = entry as Record<string, unknown>;
    const entitySlug = typeof record.entitySlug === 'string' ? record.entitySlug : '';
    if (!entitySlug) {
      return [];
    }

    return [
      {
        entitySlug,
        netflowBtc: toNullableNumber(record.netflowBtc) ?? 0,
        receivedBtc: toNullableNumber(record.receivedBtc) ?? 0,
        sentBtc: toNullableNumber(record.sentBtc) ?? 0,
        txCount: toNullableNumber(record.txCount) ?? 0,
      },
    ];
  });
}

function toMarketSnapshot(value: unknown): WeeklyReportMarketSnapshot {
  if (!value || typeof value !== 'object') {
    return EMPTY_MARKET_SNAPSHOT;
  }

  const record = value as Record<string, unknown>;
  return {
    priceUsd: toNullableNumber(record.priceUsd),
    weeklyPriceChangePercent: toNullableNumber(record.weeklyPriceChangePercent),
    kimpAverage: toNullableNumber(record.kimpAverage),
    kimpLatest: toNullableNumber(record.kimpLatest),
    fearGreedValue: toNullableNumber(record.fearGreedValue),
    fearGreedClassification:
      typeof record.fearGreedClassification === 'string'
        ? record.fearGreedClassification
        : null,
    fundingRatePercent: toNullableNumber(record.fundingRatePercent),
  };
}

function toOnchainSnapshot(value: unknown): WeeklyReportOnchainSnapshot {
  if (!value || typeof value !== 'object') {
    return EMPTY_ONCHAIN_SNAPSHOT;
  }

  const record = value as Record<string, unknown>;
  return {
    latestDay: typeof record.latestDay === 'string' ? record.latestDay : null,
    spentBtc7d: toNullableNumber(record.spentBtc7d),
    dormantReactivatedBtc7d: toNullableNumber(record.dormantReactivatedBtc7d),
    activeSupply30d: toNullableNumber(record.activeSupply30d),
    activeSupply90d: toNullableNumber(record.activeSupply90d),
    whaleAlertCount7d: toNullableNumber(record.whaleAlertCount7d),
    topEntityFlows: toEntityFlows(record.topEntityFlows),
  };
}

function toArchiveItem(row: WeeklyReportRow): WeeklyReportArchiveItem {
  return {
    slug: row.slug,
    weekStart: row.week_start,
    weekEnd: row.week_end,
    title: row.title,
    dek: row.dek,
    publishedAt: row.published_at,
  };
}

function toNewsItem(row: WeeklyReportNewsRow): WeeklyReportNewsItem {
  return {
    rank: row.rank,
    title: row.title,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    publishedAt: row.published_at,
    summary: row.summary,
    whyItMatters: row.why_it_matters,
    topic: row.topic,
    priority: row.priority,
  };
}

function toReport(row: WeeklyReportRow, newsItems: WeeklyReportNewsItem[]): WeeklyReportRecord {
  return {
    ...toArchiveItem(row),
    summary: row.summary,
    marketView: row.market_view,
    onchainView: row.onchain_view,
    riskWatch: row.risk_watch,
    watchlist: toStringArray(row.watchlist),
    sections: toWeeklyReportSections(row.sections),
    marketSnapshot: toMarketSnapshot(row.market_snapshot),
    onchainSnapshot: toOnchainSnapshot(row.onchain_snapshot),
    modelName: row.model_name,
    generatedBy: row.generated_by,
    generatedAt: row.generated_at,
    newsItems,
  };
}

async function fetchNewsByReportSlugs(
  slugs: string[]
): Promise<Record<string, WeeklyReportNewsItem[]>> {
  if (!hasSupabaseServiceConfig() || slugs.length === 0) {
    return {};
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('weekly_report_news_items')
    .select(
      'report_slug, rank, title, source_name, source_url, published_at, summary, why_it_matters, topic, priority'
    )
    .in('report_slug', slugs)
    .order('rank', { ascending: true });

  if (error) {
    if (isMissingWeeklyTablesError(error)) {
      return {};
    }
    throw error;
  }

  return (data ?? []).reduce<Record<string, WeeklyReportNewsItem[]>>((accumulator, row) => {
    const typedRow = row as WeeklyReportNewsRow;
    if (!accumulator[typedRow.report_slug]) {
      accumulator[typedRow.report_slug] = [];
    }

    accumulator[typedRow.report_slug].push(toNewsItem(typedRow));
    return accumulator;
  }, {});
}

export async function fetchLatestWeeklyReport(): Promise<WeeklyReportRecord | null> {
  if (!hasSupabaseServiceConfig()) {
    return null;
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('weekly_reports')
      .select(
        'slug, week_start, week_end, title, dek, summary, market_view, onchain_view, risk_watch, watchlist, sections, market_snapshot, onchain_snapshot, model_name, generated_by, generated_at, published_at'
      )
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      if (isMissingWeeklyTablesError(error)) {
        return null;
      }
      throw error;
    }

    if (!data) {
      return null;
    }

    const row = data as WeeklyReportRow;
    const newsBySlug = await fetchNewsByReportSlugs([row.slug]);
    return toReport(row, newsBySlug[row.slug] ?? []);
  } catch (error) {
    if (isMissingWeeklyTablesError(error)) {
      return null;
    }
    throw error;
  }
}

export async function fetchWeeklyReportBySlug(slug: string): Promise<WeeklyReportRecord | null> {
  if (!hasSupabaseServiceConfig()) {
    return null;
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('weekly_reports')
      .select(
        'slug, week_start, week_end, title, dek, summary, market_view, onchain_view, risk_watch, watchlist, sections, market_snapshot, onchain_snapshot, model_name, generated_by, generated_at, published_at'
      )
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      if (isMissingWeeklyTablesError(error)) {
        return null;
      }
      throw error;
    }

    if (!data) {
      return null;
    }

    const row = data as WeeklyReportRow;
    const newsBySlug = await fetchNewsByReportSlugs([row.slug]);
    return toReport(row, newsBySlug[row.slug] ?? []);
  } catch (error) {
    if (isMissingWeeklyTablesError(error)) {
      return null;
    }
    throw error;
  }
}

export async function fetchWeeklyReportArchive(
  limit = 12
): Promise<WeeklyReportArchiveItem[]> {
  if (!hasSupabaseServiceConfig()) {
    return [];
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('weekly_reports')
      .select('slug, week_start, week_end, title, dek, published_at')
      .order('week_start', { ascending: false })
      .limit(Math.max(1, Math.min(limit, 52)));

    if (error) {
      if (isMissingWeeklyTablesError(error)) {
        return [];
      }
      throw error;
    }

    return (data ?? []).map((row) => toArchiveItem(row as WeeklyReportRow));
  } catch (error) {
    if (isMissingWeeklyTablesError(error)) {
      return [];
    }
    throw error;
  }
}
