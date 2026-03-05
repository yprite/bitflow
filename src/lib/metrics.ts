export type Resolution = 'hourly' | 'daily';
export type TruncateMode = 'hour' | 'day_kst';

export interface MetricConfig {
  resolution: Resolution;
  truncate: TruncateMode;
}

export const METRIC_CONFIG: Record<string, MetricConfig> = {
  btc_price: { resolution: 'hourly', truncate: 'hour' },
  btc_market_cap: { resolution: 'hourly', truncate: 'hour' },
  exchange_netflow: { resolution: 'hourly', truncate: 'hour' },
  mempool_fees: { resolution: 'hourly', truncate: 'hour' },
  fear_greed: { resolution: 'daily', truncate: 'day_kst' },
  utxo_age_1y: { resolution: 'daily', truncate: 'day_kst' },
};

/**
 * Truncate timestamp to the appropriate bucket boundary.
 * - hour: UTC hour boundary
 * - day_kst: KST day boundary (00:00 KST = previous day 15:00 UTC)
 */
export function getCollectedAt(truncate: TruncateMode): string {
  const now = new Date();
  if (truncate === 'hour') {
    now.setMinutes(0, 0, 0);
    return now.toISOString();
  }
  // day_kst: KST date boundary
  const kstMs = now.getTime() + 9 * 3600 * 1000;
  const kst = new Date(kstMs);
  kst.setHours(0, 0, 0, 0);
  return new Date(kst.getTime() - 9 * 3600 * 1000).toISOString();
}

// Outlier detection ranges
const RANGE_LIMITS: Record<string, { min: number; max: number }> = {
  exchange_netflow: { min: -100_000, max: 100_000 },
  fear_greed: { min: 0, max: 100 },
  utxo_age_1y: { min: 0, max: 100 },
  btc_price: { min: 0, max: 10_000_000 },
  btc_market_cap: { min: 0, max: 100_000_000_000_000 },
  mempool_fees: { min: 0, max: 10_000 },
};

/**
 * Validate a metric value is within acceptable range.
 * Returns { valid: true } or { valid: false, reason: string }.
 */
export function validateRange(
  metricName: string,
  value: number
): { valid: true } | { valid: false; reason: string } {
  const limits = RANGE_LIMITS[metricName];
  if (!limits) return { valid: true };
  if (value < limits.min || value > limits.max) {
    return { valid: false, reason: `out_of_range: ${value} not in [${limits.min}, ${limits.max}]` };
  }
  return { valid: true };
}

/**
 * Spike detection: compare new value against median of recent values.
 * Uses absolute minimum threshold to avoid false positives near zero.
 */
export function detectSpike(
  metricName: string,
  newValue: number,
  recentValues: number[]
): boolean {
  if (metricName !== 'exchange_netflow') return false;
  if (recentValues.length < 3) return false;

  const sorted = [...recentValues].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const threshold = Math.max(Math.abs(median) * 10, 500);

  return Math.abs(newValue - median) > threshold;
}

// Signal scoring
export type Signal = -1 | 0 | 1;

export function scoreNetflow(netflow: number): Signal {
  if (netflow < -2000) return 1;    // accumulation
  if (netflow > 2000) return -1;    // sell pressure
  return 0;
}

export function scoreUtxoAge(weeklyChangePercent: number): Signal {
  if (weeklyChangePercent > 0.1) return 1;   // LTH increasing
  if (weeklyChangePercent < -0.1) return -1;  // LTH decreasing
  return 0;
}

export function scoreFearGreed(value: number): Signal {
  if (value < 25) return 1;   // extreme fear = contrarian bullish
  if (value > 75) return -1;  // extreme greed = caution
  return 0;
}

export type MarketStatus = 'accumulation' | 'neutral' | 'caution' | 'insufficient';

export function getMarketStatus(scores: (Signal | null)[]): { status: MarketStatus; total: number } {
  const validScores = scores.filter((s): s is Signal => s !== null);
  if (validScores.length < 2) {
    return { status: 'insufficient', total: 0 };
  }
  const total = validScores.reduce<number>((sum, s) => sum + s, 0);
  if (total >= 2) return { status: 'accumulation', total };
  if (total <= -2) return { status: 'caution', total };
  return { status: 'neutral', total };
}
