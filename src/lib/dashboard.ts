import { createServiceClient } from '@/lib/supabase';
import {
  getMarketStatus,
  scoreFearGreed,
  scoreNetflow,
  scoreUtxoAge,
  type MarketStatus,
} from '@/lib/metrics';

const DAY_MS = 24 * 60 * 60 * 1000;

export type Freshness = 'fresh' | 'delayed' | 'stale' | 'unknown';

export interface MetricPoint {
  collectedAt: string;
  value: number;
  metadata: Record<string, unknown> | null;
}

export interface MetricCardData {
  key: 'exchange_netflow' | 'utxo_age_1y' | 'mempool_fees' | 'fear_greed';
  title: string;
  subtitle: string;
  points: MetricPoint[];
  latest: number | null;
  latestAt: string | null;
  freshness: Freshness;
}

export interface WhaleTransaction {
  txHash: string;
  timestamp: string;
  amountBtc: number;
  fromName: string | null;
  toName: string | null;
}

export interface DashboardData {
  status: MarketStatus;
  totalScore: number;
  summary: string;
  cards: {
    netflow: MetricCardData;
    utxoAge: MetricCardData;
    mempoolFees: MetricCardData;
    fearGreed: MetricCardData;
  };
  utxoWeeklyChange: number | null;
  whaleTransactions: WhaleTransaction[];
  lastUpdatedAt: string | null;
  freshness: Freshness;
  errors: string[];
}

interface MetricQuerySpec {
  key: MetricCardData['key'];
  days: number;
  resolution: 'hourly' | 'daily';
  title: string;
  subtitle: string;
}

const METRIC_QUERY_SPECS: MetricQuerySpec[] = [
  {
    key: 'exchange_netflow',
    days: 7,
    resolution: 'hourly',
    title: '거래소 순유입/유출',
    subtitle: '7일 추이 (BTC)',
  },
  {
    key: 'utxo_age_1y',
    days: 30,
    resolution: 'daily',
    title: '장기 미이동 UTXO 비율',
    subtitle: '30일 추이 (1년 이상)',
  },
  {
    key: 'mempool_fees',
    days: 7,
    resolution: 'hourly',
    title: '멤풀 수수료',
    subtitle: '24시간 혼잡도 (sat/vB)',
  },
  {
    key: 'fear_greed',
    days: 30,
    resolution: 'daily',
    title: '공포/탐욕 지수',
    subtitle: '30일 추이',
  },
];

function getEmptyCard(spec: MetricQuerySpec): MetricCardData {
  return {
    key: spec.key,
    title: spec.title,
    subtitle: spec.subtitle,
    points: [],
    latest: null,
    latestAt: null,
    freshness: 'unknown',
  };
}

function isRejected(metadata: Record<string, unknown> | null): boolean {
  return Boolean(metadata && metadata.rejected === true);
}

function toMetricPoint(row: {
  collected_at: string;
  value: number | string;
  metadata: Record<string, unknown> | null;
}): MetricPoint {
  return {
    collectedAt: row.collected_at,
    value: Number(row.value),
    metadata: row.metadata,
  };
}

function buildSummaryText(params: {
  status: MarketStatus;
  netflow: number | null;
  utxoWeeklyChange: number | null;
  fearGreed: number | null;
}): string {
  const lines: string[] = [];

  if (params.netflow !== null) {
    if (params.netflow < -2000) {
      lines.push(`거래소에서 BTC가 순유출(${Math.abs(Math.round(params.netflow)).toLocaleString()} BTC)되고 있습니다.`);
    } else if (params.netflow > 2000) {
      lines.push(`거래소로 BTC가 순유입(${Math.round(params.netflow).toLocaleString()} BTC)되는 흐름입니다.`);
    } else {
      lines.push('거래소 넷플로우는 중립 구간입니다.');
    }
  }

  if (params.utxoWeeklyChange !== null) {
    if (params.utxoWeeklyChange > 0.1) {
      lines.push('1년 이상 미이동 비율이 7일 기준 상승해 장기 보유가 강화되고 있습니다.');
    } else if (params.utxoWeeklyChange < -0.1) {
      lines.push('1년 이상 미이동 비율이 7일 기준 하락해 장기 보유 이탈 신호가 보입니다.');
    }
  }

  if (params.fearGreed !== null) {
    if (params.fearGreed < 25) {
      lines.push(`공포/탐욕 지수 ${Math.round(params.fearGreed)}로 극도의 공포 구간입니다.`);
    } else if (params.fearGreed > 75) {
      lines.push(`공포/탐욕 지수 ${Math.round(params.fearGreed)}로 극도의 탐욕 구간입니다.`);
    } else {
      lines.push(`공포/탐욕 지수 ${Math.round(params.fearGreed)}로 중립 범위입니다.`);
    }
  }

  switch (params.status) {
    case 'accumulation':
      lines.push('종합 신호는 축적 국면으로 해석됩니다.');
      break;
    case 'caution':
      lines.push('종합 신호는 주의 구간으로 해석됩니다.');
      break;
    case 'neutral':
      lines.push('종합 신호는 중립입니다.');
      break;
    default:
      lines.push('유효 데이터가 부족해 종합 신호를 판단하기 어렵습니다.');
      break;
  }

  return lines.slice(0, 3).join(' ');
}

function getUtxoWeeklyChange(points: MetricPoint[]): number | null {
  if (points.length < 2) return null;
  const latest = points[points.length - 1];
  const latestMs = new Date(latest.collectedAt).getTime();
  const targetMs = latestMs - 7 * DAY_MS;

  let baseline = points[0];
  for (const point of points) {
    const pointMs = new Date(point.collectedAt).getTime();
    if (pointMs <= targetMs) {
      baseline = point;
      continue;
    }
    break;
  }

  return latest.value - baseline.value;
}

function getFreshnessByHours(lastUpdatedAt: string | null, freshHours: number, delayedHours: number): Freshness {
  if (!lastUpdatedAt) return 'unknown';
  const diffMs = Date.now() - new Date(lastUpdatedAt).getTime();
  if (diffMs <= freshHours * 60 * 60 * 1000) return 'fresh';
  if (diffMs <= delayedHours * 60 * 60 * 1000) return 'delayed';
  return 'stale';
}

function getDashboardFreshness(cards: MetricCardData[]): Freshness {
  const states = cards.map((card) => card.freshness);
  if (states.every((state) => state === 'unknown')) return 'unknown';
  if (states.includes('stale')) return 'stale';
  if (states.includes('delayed')) return 'delayed';
  return 'fresh';
}

function pickLatestTimestamp(cards: MetricCardData[]): string | null {
  const latestMs = cards
    .map((card) => card.latestAt)
    .filter((at): at is string => Boolean(at))
    .map((at) => new Date(at).getTime())
    .reduce<number | null>((max, current) => (max === null ? current : Math.max(max, current)), null);

  return latestMs === null ? null : new Date(latestMs).toISOString();
}

async function fetchMetricCard(spec: MetricQuerySpec): Promise<MetricCardData> {
  const supabase = createServiceClient();
  const since = new Date(Date.now() - spec.days * DAY_MS).toISOString();

  const { data, error } = await supabase
    .from('onchain_metrics')
    .select('collected_at, value, resolution, metadata')
    .eq('metric_name', spec.key)
    .eq('resolution', spec.resolution)
    .gte('collected_at', since)
    .order('collected_at', { ascending: true })
    .limit(spec.resolution === 'hourly' ? 240 : 60);

  if (error) {
    throw new Error(`[${spec.key}] ${error.message}`);
  }

  const points = (data ?? [])
    .map((row) => toMetricPoint(row))
    .filter((row) => !isRejected(row.metadata))
    .filter((row) => Number.isFinite(row.value));

  const latest = points.length > 0 ? points[points.length - 1] : null;
  const freshness =
    spec.resolution === 'hourly'
      ? getFreshnessByHours(latest?.collectedAt ?? null, 2, 6)
      : getFreshnessByHours(latest?.collectedAt ?? null, 30, 54);

  return {
    key: spec.key,
    title: spec.title,
    subtitle: spec.subtitle,
    points,
    latest: latest?.value ?? null,
    latestAt: latest?.collectedAt ?? null,
    freshness,
  };
}

async function fetchWhales24h(): Promise<WhaleTransaction[]> {
  const supabase = createServiceClient();
  const since = new Date(Date.now() - DAY_MS).toISOString();

  const { data, error } = await supabase
    .from('whale_transactions')
    .select('tx_hash, timestamp, amount_btc, from_name, to_name')
    .gte('timestamp', since)
    .order('timestamp', { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(`[whale_transactions] ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    txHash: row.tx_hash,
    timestamp: row.timestamp,
    amountBtc: Number(row.amount_btc),
    fromName: row.from_name,
    toName: row.to_name,
  }));
}

export async function loadDashboardData(): Promise<DashboardData> {
  const errors: string[] = [];

  const cardSettled = await Promise.allSettled(METRIC_QUERY_SPECS.map((spec) => fetchMetricCard(spec)));
  const cardsByKey = new Map<MetricCardData['key'], MetricCardData>();

  for (let i = 0; i < cardSettled.length; i += 1) {
    const result = cardSettled[i];
    const spec = METRIC_QUERY_SPECS[i];
    if (result.status === 'fulfilled') {
      cardsByKey.set(spec.key, result.value);
      continue;
    }
    cardsByKey.set(spec.key, getEmptyCard(spec));
    errors.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
  }

  const netflowCard = cardsByKey.get('exchange_netflow') ?? getEmptyCard(METRIC_QUERY_SPECS[0]);
  const utxoCard = cardsByKey.get('utxo_age_1y') ?? getEmptyCard(METRIC_QUERY_SPECS[1]);
  const mempoolCard = cardsByKey.get('mempool_fees') ?? getEmptyCard(METRIC_QUERY_SPECS[2]);
  const fearGreedCard = cardsByKey.get('fear_greed') ?? getEmptyCard(METRIC_QUERY_SPECS[3]);

  const utxoWeeklyChange = getUtxoWeeklyChange(utxoCard.points);
  const scores = [
    netflowCard.latest !== null ? scoreNetflow(netflowCard.latest) : null,
    utxoWeeklyChange !== null ? scoreUtxoAge(utxoWeeklyChange) : null,
    fearGreedCard.latest !== null ? scoreFearGreed(fearGreedCard.latest) : null,
  ];
  const { status, total } = getMarketStatus(scores);

  const whalesResult = await fetchWhales24h().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(message);
    return [];
  });

  const cards = [netflowCard, utxoCard, mempoolCard, fearGreedCard];
  const lastUpdatedAt = pickLatestTimestamp(cards);
  const freshness = getDashboardFreshness(cards);
  const summary = buildSummaryText({
    status,
    netflow: netflowCard.latest,
    utxoWeeklyChange,
    fearGreed: fearGreedCard.latest,
  });

  return {
    status,
    totalScore: total,
    summary,
    cards: {
      netflow: netflowCard,
      utxoAge: utxoCard,
      mempoolFees: mempoolCard,
      fearGreed: fearGreedCard,
    },
    utxoWeeklyChange,
    whaleTransactions: whalesResult,
    lastUpdatedAt,
    freshness,
    errors,
  };
}
