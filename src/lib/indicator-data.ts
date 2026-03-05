import { createServiceClient } from '@/lib/supabase';
import { getIndicatorBySlug, type IndicatorConfig, type IndicatorSlug } from '@/lib/indicator-content';

const DAY_MS = 24 * 60 * 60 * 1000;

export type Freshness = 'fresh' | 'delayed' | 'stale' | 'unknown';

export interface IndicatorPoint {
  collectedAt: string;
  value: number;
}

export interface IndicatorPageData {
  config: IndicatorConfig;
  points: IndicatorPoint[];
  latestValue: number | null;
  latestAt: string | null;
  freshness: Freshness;
  interpretation: string;
  related: IndicatorConfig[];
  errors: string[];
}

function toFreshness(latestAt: string | null, config: IndicatorConfig): Freshness {
  if (!latestAt) return 'unknown';
  const diffHours = (Date.now() - new Date(latestAt).getTime()) / (60 * 60 * 1000);

  if (config.kind === 'metric' && config.metricName === 'fear_greed') {
    if (diffHours <= 30) return 'fresh';
    if (diffHours <= 54) return 'delayed';
    return 'stale';
  }

  if (config.kind === 'metric' && config.metricName === 'utxo_age_1y') {
    if (diffHours <= 30) return 'fresh';
    if (diffHours <= 54) return 'delayed';
    return 'stale';
  }

  if (diffHours <= 3) return 'fresh';
  if (diffHours <= 8) return 'delayed';
  return 'stale';
}

function interpret(config: IndicatorConfig, latestValue: number | null, points: IndicatorPoint[]): string {
  if (latestValue === null) {
    return '최근 데이터가 충분하지 않아 현재 구간을 해석할 수 없습니다.';
  }

  if (config.slug === 'exchange-netflow') {
    if (latestValue < -2000) return '거래소 순유출 우세로 축적 신호가 상대적으로 강한 상태입니다.';
    if (latestValue > 2000) return '거래소 순유입 우세로 단기 매도 압력 가능성을 경계할 구간입니다.';
    return '순유입/순유출이 중립 범위로 시장 균형 구간에 가깝습니다.';
  }

  if (config.slug === 'mempool-fees') {
    if (latestValue >= 80) return '수수료가 높은 편으로 네트워크 혼잡도가 강한 상태입니다.';
    if (latestValue >= 20) return '수수료가 중간 구간으로 일반적인 혼잡 수준입니다.';
    return '수수료가 낮아 네트워크 혼잡이 완화된 상태입니다.';
  }

  if (config.slug === 'fear-greed') {
    if (latestValue < 25) return '극도의 공포 구간으로 리스크 회피 심리가 강합니다.';
    if (latestValue > 75) return '극도의 탐욕 구간으로 과열 리스크를 점검할 시점입니다.';
    return '공포/탐욕 지수는 중립 범위에 위치해 있습니다.';
  }

  if (config.slug === 'utxo-age') {
    if (points.length < 2) return '장기 미이동 비율의 방향성을 판단하기엔 데이터가 부족합니다.';
    const latest = points[points.length - 1];
    const target = points[Math.max(0, points.length - 8)];
    const diff = latest.value - target.value;
    if (diff > 0.1) return '7일 기준 장기 미이동 비율이 상승해 장기 보유 성향이 강화되고 있습니다.';
    if (diff < -0.1) return '7일 기준 장기 미이동 비율이 하락해 장기 보유 이탈 가능성을 점검해야 합니다.';
    return '장기 미이동 비율이 큰 변화 없이 중립 구간입니다.';
  }

  if (config.slug === 'whale-tracker') {
    if (latestValue >= 5000) return '최근 대형 트랜잭션 총량이 커 이벤트성 변동 확대 가능성이 있습니다.';
    if (latestValue >= 1000) return '고래 이동이 관측되지만 과열 수준은 아닙니다.';
    return '최근 고래 이동 총량은 비교적 안정적인 구간입니다.';
  }

  return '지표 해석 규칙이 아직 설정되지 않았습니다.';
}

async function fetchMetricPoints(config: IndicatorConfig): Promise<IndicatorPoint[]> {
  const supabase = createServiceClient();
  const since = new Date(Date.now() - 365 * DAY_MS).toISOString();
  const resolution = config.metricName === 'fear_greed' || config.metricName === 'utxo_age_1y' ? 'daily' : 'hourly';

  const { data, error } = await supabase
    .from('onchain_metrics')
    .select('collected_at, value, metadata')
    .eq('metric_name', config.metricName)
    .eq('resolution', resolution)
    .gte('collected_at', since)
    .order('collected_at', { ascending: true })
    .limit(resolution === 'hourly' ? 9000 : 450);

  if (error) {
    throw new Error(`[${config.slug}] ${error.message}`);
  }

  return (data ?? [])
    .filter((row) => row.metadata?.rejected !== true)
    .map((row) => ({
      collectedAt: row.collected_at,
      value: Number(row.value),
    }))
    .filter((row) => Number.isFinite(row.value));
}

async function fetchWhalePoints(): Promise<IndicatorPoint[]> {
  const supabase = createServiceClient();
  const since = new Date(Date.now() - 365 * DAY_MS).toISOString();

  const { data, error } = await supabase
    .from('whale_transactions')
    .select('timestamp, amount_btc')
    .gte('timestamp', since)
    .order('timestamp', { ascending: true })
    .limit(6000);

  if (error) {
    throw new Error(`[whale-tracker] ${error.message}`);
  }

  const byDay = new Map<string, number>();
  for (const row of data ?? []) {
    const day = row.timestamp.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + Number(row.amount_btc));
  }

  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, value]) => ({
      collectedAt: `${day}T00:00:00.000Z`,
      value,
    }));
}

export async function loadIndicatorPageData(slug: IndicatorSlug): Promise<IndicatorPageData> {
  const config = getIndicatorBySlug(slug);
  if (!config) {
    throw new Error(`Unknown indicator slug: ${slug}`);
  }

  const errors: string[] = [];
  const points =
    config.kind === 'metric'
      ? await fetchMetricPoints(config).catch((error) => {
          errors.push(error instanceof Error ? error.message : String(error));
          return [];
        })
      : await fetchWhalePoints().catch((error) => {
          errors.push(error instanceof Error ? error.message : String(error));
          return [];
        });

  const latestPoint = points.length > 0 ? points[points.length - 1] : null;
  const latestValue = latestPoint?.value ?? null;
  const latestAt = latestPoint?.collectedAt ?? null;
  const freshness = toFreshness(latestAt, config);
  const interpretation = interpret(config, latestValue, points);
  const related = config.related
    .map((relatedSlug) => getIndicatorBySlug(relatedSlug))
    .filter((item): item is IndicatorConfig => item !== null);

  return {
    config,
    points,
    latestValue,
    latestAt,
    freshness,
    interpretation,
    related,
    errors,
  };
}
