import type { KimpData, KimpHistoryPoint } from './types';
import { createServiceClient, hasSupabaseServiceConfig } from './supabase';

const DAY_MS = 24 * 60 * 60 * 1000;
const HISTORY_WINDOW_DAYS = 30;
const HISTORY_BUCKET_MINUTES = 10;
const MAX_HISTORY_POINTS = (HISTORY_WINDOW_DAYS * 24 * 60) / HISTORY_BUCKET_MINUTES;
const MIN_AVERAGE_POINTS = 12;

interface KimpHistoryRow {
  bucket_at: string;
  kimchi_premium: number | string;
}

interface SupabaseErrorLike {
  code?: string;
  message?: string;
}

function toBucketAt(timestamp: string): string {
  const date = new Date(timestamp);
  date.setUTCMinutes(
    Math.floor(date.getUTCMinutes() / HISTORY_BUCKET_MINUTES) * HISTORY_BUCKET_MINUTES,
    0,
    0
  );
  return date.toISOString();
}

function toHistoryPoint(row: KimpHistoryRow): KimpHistoryPoint | null {
  const value = Number(row.kimchi_premium);
  if (!Number.isFinite(value)) {
    return null;
  }

  return {
    collectedAt: row.bucket_at,
    value,
  };
}

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

function isMissingHistoryTableError(error: unknown): boolean {
  const code = getErrorCode(error);
  if (code === '42P01' || code === 'PGRST205') {
    return true;
  }

  return getErrorMessage(error).includes('kimp_history');
}

function logHistoryError(context: string, error: unknown) {
  const message = getErrorMessage(error);
  if (isMissingHistoryTableError(error)) {
    console.warn(`Kimp history ${context} skipped: ${message}`);
    return;
  }

  console.error(`Kimp history ${context} failed:`, error);
}

export function getKimpHistoryBucketAt(timestamp: string): string {
  return toBucketAt(timestamp);
}

export async function saveKimpHistorySample(kimp: KimpData): Promise<boolean> {
  if (!hasSupabaseServiceConfig()) {
    return false;
  }

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from('kimp_history').upsert(
      {
        bucket_at: toBucketAt(kimp.timestamp),
        collected_at: kimp.timestamp,
        upbit_price: kimp.upbitPrice,
        global_price: kimp.globalPrice,
        usd_krw: kimp.usdKrw,
        kimchi_premium: kimp.kimchiPremium,
      },
      {
        onConflict: 'bucket_at',
        ignoreDuplicates: true,
      }
    );

    if (error) {
      logHistoryError('save', error);
      return false;
    }

    return true;
  } catch (error) {
    logHistoryError('save', error);
    return false;
  }
}

export async function loadKimpHistory(days = HISTORY_WINDOW_DAYS): Promise<KimpHistoryPoint[]> {
  if (!hasSupabaseServiceConfig()) {
    return [];
  }

  const safeDays = Math.min(Math.max(days, 1), HISTORY_WINDOW_DAYS);
  const limit = (safeDays * 24 * 60) / HISTORY_BUCKET_MINUTES;
  const since = new Date(Date.now() - safeDays * DAY_MS).toISOString();

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('kimp_history')
      .select('bucket_at, kimchi_premium')
      .gte('bucket_at', since)
      .order('bucket_at', { ascending: true })
      .limit(Math.min(limit, MAX_HISTORY_POINTS));

    if (error) {
      logHistoryError('load', error);
      return [];
    }

    return (data ?? [])
      .map((row) => toHistoryPoint(row as KimpHistoryRow))
      .filter((row): row is KimpHistoryPoint => row !== null);
  } catch (error) {
    logHistoryError('load', error);
    return [];
  }
}

export function calculateKimpAverage(points: KimpHistoryPoint[]): number | null {
  if (points.length < MIN_AVERAGE_POINTS) {
    return null;
  }

  const total = points.reduce((sum, point) => sum + point.value, 0);
  return total / points.length;
}

export async function loadKimpHistorySnapshot(kimp: KimpData) {
  await saveKimpHistorySample(kimp);
  const history = await loadKimpHistory(HISTORY_WINDOW_DAYS);

  return {
    history,
    avg30d: calculateKimpAverage(history),
  };
}
