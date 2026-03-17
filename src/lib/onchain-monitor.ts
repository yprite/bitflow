import type {
  OnchainAlertEvent,
  OnchainAlertStats,
  OnchainAgeBandSummary,
  OnchainBlockTempoData,
  OnchainBriefingData,
  OnchainDormancyPulseData,
  OnchainEntityFlowEntry,
  OnchainFeePressureData,
  OnchainFeeRegimeHistoryData,
  OnchainMarketContextData,
  OnchainRegimeFactor,
  OnchainMetricId,
  OnchainMetricSummary,
  OnchainNetworkPulseData,
  OnchainProjectedBlock,
  OnchainFlowPressureData,
  OnchainRegimeSummary,
  OnchainSupportResistanceSummary,
  OnchainWhaleSummary,
} from './types';

const MEMPOOL_SPACE_API_BASE = 'https://mempool.space/api';
const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
const DAY_MS = 24 * 60 * 60 * 1000;
const WHALE_BUCKET_HOURS = 3;
const WHALE_BUCKET_COUNT = 8;
const SUPPORT_RESISTANCE_WINDOW_DAYS = 30;

interface RecommendedFeesResponse {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

interface MempoolResponse {
  count: number;
  vsize: number;
  total_fee: number;
}

interface MempoolProjectedBlockResponse {
  blockVSize: number;
  nTx: number;
  medianFee: number;
}

interface DifficultyAdjustmentResponse {
  progressPercent: number;
  difficultyChange: number;
  estimatedRetargetDate?: number | null;
  remainingBlocks: number;
}

interface RecentBlockResponse {
  height: number;
  timestamp: number;
  tx_count: number;
  extras?: {
    medianFee?: number;
    avgFeeRate?: number;
    totalFees?: number;
  };
}

interface MempoolPriceResponse {
  USD?: number;
}

interface CoinbaseSpotPriceResponse {
  data?: {
    amount?: string;
  };
}

interface CoinGeckoMarketChartResponse {
  prices: [number, number][];
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${MEMPOOL_SPACE_API_BASE}${path}`, {
    next: { revalidate: 30 },
  });

  if (!response.ok) {
    throw new Error(`mempool.space request failed: ${path} (${response.status})`);
  }

  return (await response.json()) as T;
}

async function fetchCoinGeckoJson<T>(path: string): Promise<T> {
  const response = await fetch(`${COINGECKO_API_BASE}${path}`, {
    next: { revalidate: 300 },
    headers: { 'User-Agent': 'bitflow/1.0' },
  });

  if (!response.ok) {
    throw new Error(`CoinGecko request failed: ${path} (${response.status})`);
  }

  return (await response.json()) as T;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getMetric(metrics: OnchainMetricSummary[], id: OnchainMetricId): OnchainMetricSummary | null {
  return metrics.find((metric) => metric.id === id) ?? null;
}

function formatSigned(value: number, fractionDigits = 1): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(fractionDigits)}`;
}

function formatCompactBtc(value: number): string {
  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: value >= 100 ? 0 : 1,
    maximumFractionDigits: value >= 100 ? 0 : 1,
  })} BTC`;
}

async function fetchCurrentBtcPriceUsd(): Promise<number> {
  try {
    const mempoolPrice = await fetchJson<MempoolPriceResponse>('/v1/prices');
    if (typeof mempoolPrice.USD === 'number' && Number.isFinite(mempoolPrice.USD)) {
      return mempoolPrice.USD;
    }
  } catch {
    // Fall through to Coinbase.
  }

  const coinbaseResponse = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot', {
    next: { revalidate: 30 },
    headers: { 'User-Agent': 'bitflow/1.0' },
  });

  if (!coinbaseResponse.ok) {
    throw new Error(`Coinbase spot request failed (${coinbaseResponse.status})`);
  }

  const coinbasePayload = (await coinbaseResponse.json()) as CoinbaseSpotPriceResponse;
  const amount = Number(coinbasePayload.data?.amount);
  if (!Number.isFinite(amount)) {
    throw new Error('Coinbase spot request returned invalid BTC price');
  }

  return amount;
}

async function fetchBtcPriceHistory(
  windowDays: number = SUPPORT_RESISTANCE_WINDOW_DAYS
): Promise<OnchainMarketContextData['history']> {
  const payload = await fetchCoinGeckoJson<CoinGeckoMarketChartResponse>(
    `/coins/bitcoin/market_chart?vs_currency=usd&days=${windowDays}&interval=daily`
  );

  return payload.prices
    .map(([time, priceUsd]) => ({
      time: new Date(time).toISOString(),
      priceUsd,
    }))
    .filter((point) => Number.isFinite(point.priceUsd));
}

export function getOnchainAlertAmountBtc(alert: OnchainAlertEvent): number {
  const context = alert.context && typeof alert.context === 'object' ? alert.context : {};

  if (typeof context.amount_btc === 'number') {
    return context.amount_btc;
  }

  if (typeof context.amount_btc === 'string') {
    const parsed = Number(context.amount_btc);
    if (Number.isFinite(parsed)) return parsed;
  }

  if (typeof context.total_output_sats === 'number') {
    return context.total_output_sats / 100_000_000;
  }

  if (typeof context.value_sats === 'number') {
    return context.value_sats / 100_000_000;
  }

  return 0;
}

export function deriveOnchainWhaleSummary(
  alerts: OnchainAlertEvent[],
  now = new Date()
): OnchainWhaleSummary {
  const cutoff = now.getTime() - DAY_MS;
  const recentAlerts = alerts.filter((alert) => {
    const detectedAt = new Date(alert.detectedAt).getTime();
    return Number.isFinite(detectedAt) && detectedAt >= cutoff;
  });

  let confirmedCount = 0;
  let pendingCount = 0;
  let dormantCount = 0;
  let confirmedMovedBtc = 0;
  let pendingMovedBtc = 0;
  let dormantMovedBtc = 0;
  let largestMoveBtc = 0;
  let latestDetectedAt: string | null = null;
  const bucketMs = WHALE_BUCKET_HOURS * 60 * 60 * 1000;
  const bucketFloor = Math.floor(now.getTime() / bucketMs) * bucketMs;
  const firstBucketStartMs = bucketFloor - (WHALE_BUCKET_COUNT - 1) * bucketMs;
  const buckets = Array.from({ length: WHALE_BUCKET_COUNT }, (_, index) => {
    const startMs = firstBucketStartMs + index * bucketMs;
    return {
      startAt: new Date(startMs).toISOString(),
      endAt: new Date(startMs + bucketMs).toISOString(),
      movedBtc: 0,
      alertCount: 0,
    };
  });

  for (const alert of recentAlerts) {
    const amountBtc = getOnchainAlertAmountBtc(alert);
    const detectedAtMs = new Date(alert.detectedAt).getTime();
    largestMoveBtc = Math.max(largestMoveBtc, amountBtc);
    latestDetectedAt =
      latestDetectedAt === null ||
      detectedAtMs > new Date(latestDetectedAt).getTime()
        ? alert.detectedAt
        : latestDetectedAt;

    const bucketIndex = Math.floor((detectedAtMs - firstBucketStartMs) / bucketMs);

    if (bucketIndex >= 0 && bucketIndex < buckets.length) {
      buckets[bucketIndex].movedBtc += amountBtc;
      buckets[bucketIndex].alertCount += 1;
    }

    if (alert.alertType === 'large_confirmed_spend') {
      confirmedCount += 1;
      confirmedMovedBtc += amountBtc;
    } else if (alert.alertType === 'mempool_large_tx') {
      pendingCount += 1;
      pendingMovedBtc += amountBtc;
    } else if (alert.alertType === 'dormant_reactivation') {
      dormantCount += 1;
      dormantMovedBtc += amountBtc;
    }
  }

  const candidates = [
    { type: 'large_confirmed_spend', moved: confirmedMovedBtc },
    { type: 'mempool_large_tx', moved: pendingMovedBtc },
    { type: 'dormant_reactivation', moved: dormantMovedBtc },
  ].sort((a, b) => b.moved - a.moved);
  const slices = [
    {
      key: 'confirmed' as const,
      label: '확정',
      movedBtc: confirmedMovedBtc,
      count: confirmedCount,
    },
    {
      key: 'pending' as const,
      label: '미확정',
      movedBtc: pendingMovedBtc,
      count: pendingCount,
    },
    {
      key: 'dormant' as const,
      label: '휴면',
      movedBtc: dormantMovedBtc,
      count: dormantCount,
    },
  ];

  return {
    windowHours: 24,
    totalAlerts: recentAlerts.length,
    confirmedCount,
    pendingCount,
    dormantCount,
    totalMovedBtc: confirmedMovedBtc + pendingMovedBtc + dormantMovedBtc,
    confirmedMovedBtc,
    pendingMovedBtc,
    dormantMovedBtc,
    largestMoveBtc,
    dominantAlertType: candidates[0]?.moved > 0 ? candidates[0].type : null,
    latestDetectedAt,
    slices,
    buckets,
  };
}

export function deriveOnchainRegime(
  metrics: OnchainMetricSummary[],
  alertStats: OnchainAlertStats
): OnchainRegimeSummary | null {
  const spentBtc = getMetric(metrics, 'spent_btc');
  const createdUtxo = getMetric(metrics, 'created_utxo_count');
  const active30d = getMetric(metrics, 'active_supply_ratio_30d');
  const active90d = getMetric(metrics, 'active_supply_ratio_90d');
  const dormant = getMetric(metrics, 'dormant_reactivated_btc');

  const availableMetrics = [spentBtc, createdUtxo, active30d, active90d, dormant].filter(
    (metric): metric is OnchainMetricSummary => metric !== null && metric.latestValue !== null
  );
  if (availableMetrics.length === 0) {
    return null;
  }

  let score = 0;
  const drivers: string[] = [];
  const factors: OnchainRegimeFactor[] = [];
  const pushFactor = (label: string, contribution: number, detail: string) => {
    score += contribution;
    drivers.push(detail);
    factors.push({
      label,
      contribution: Number(contribution.toFixed(1)),
      detail,
    });
  };

  if (active30d && active30d.latestValue !== null && active30d.changeValue !== null) {
    if (active30d.changeValue >= 0.2) {
      pushFactor(
        '30D 활성 공급',
        1.2,
        `30일 활성 공급이 ${active30d.changeValue.toFixed(2)}%p 늘었습니다.`
      );
    } else if (active30d.changeValue <= -0.2) {
      pushFactor(
        '30D 활성 공급',
        -1.2,
        `30일 활성 공급이 ${Math.abs(active30d.changeValue).toFixed(2)}%p 줄었습니다.`
      );
    }
  }

  if (active90d && active90d.latestValue !== null && active90d.changeValue !== null) {
    if (active90d.changeValue >= 0.15) {
      pushFactor('90D 활성 공급', 0.7, '90일 활성 공급도 동반 상승 중입니다.');
    } else if (active90d.changeValue <= -0.15) {
      pushFactor('90D 활성 공급', -0.7, '90일 활성 공급도 둔화되고 있습니다.');
    }
  }

  if (spentBtc && spentBtc.changePercent !== null) {
    if (spentBtc.changePercent >= 12) {
      pushFactor(
        '일간 이동 BTC',
        0.9,
        `일간 이동 BTC가 전일 대비 ${spentBtc.changePercent.toFixed(1)}% 늘었습니다.`
      );
    } else if (spentBtc.changePercent <= -12) {
      pushFactor(
        '일간 이동 BTC',
        -0.9,
        `일간 이동 BTC가 전일 대비 ${Math.abs(spentBtc.changePercent).toFixed(1)}% 줄었습니다.`
      );
    }
  }

  if (createdUtxo && createdUtxo.changePercent !== null) {
    if (createdUtxo.changePercent >= 8) {
      pushFactor('신규 UTXO', 0.5, '신규 UTXO가 늘어 신규 활동이 유입되고 있습니다.');
    } else if (createdUtxo.changePercent <= -8) {
      pushFactor('신규 UTXO', -0.5, '신규 UTXO 증가세가 둔화됐습니다.');
    }
  }

  if (
    dormant &&
    dormant.latestValue !== null &&
    dormant.previousValue !== null &&
    dormant.previousValue > 0 &&
    dormant.latestValue >= dormant.previousValue * 1.5
  ) {
    pushFactor('휴면 코인 이동', -0.8, '장기 휴면 코인 이동이 늘어 분배 압력이 커졌습니다.');
  }

  if (alertStats.high >= 4) {
    pushFactor('강한 이벤트 빈도', -0.4, `강한 온체인 이벤트가 ${alertStats.high}건으로 늘었습니다.`);
  } else if (alertStats.medium >= 4) {
    pushFactor('미확정 대형 이동', 0.2, '미확정 대형 이동이 늘어 네트워크 활동이 살아 있습니다.');
  }

  const roundedScore = Number(score.toFixed(1));
  const label = roundedScore >= 1.4 ? '확장' : roundedScore <= -1 ? '위축' : '중립';
  const tone = label === '확장' ? 'expansion' : label === '위축' ? 'contraction' : 'neutral';

  const summary =
    label === '확장'
      ? '최근 활성 공급과 이동량이 함께 늘며 온체인 활동성이 확장되는 구간입니다.'
      : label === '위축'
      ? '활동 지표 둔화와 장기 코인 이동이 겹쳐 보수적으로 해석할 구간입니다.'
      : '활동과 분배 신호가 엇갈려 뚜렷한 방향성보다 균형 구간에 가깝습니다.';

  if (factors.length === 0) {
    factors.push({
      label: '중립 구간',
      contribution: 0,
      detail: '주요 활동 지표가 모두 중립 범위에 머물고 있습니다.',
    });
  }

  return {
    label,
    tone,
    score: roundedScore,
    summary,
    drivers: drivers.slice(0, 3),
    factors: factors.slice(0, 5),
  };
}

export function deriveOnchainDormancyPulse(
  metrics: OnchainMetricSummary[]
): OnchainDormancyPulseData | null {
  const dormant = getMetric(metrics, 'dormant_reactivated_btc');
  if (!dormant || dormant.latestValue === null) {
    return null;
  }

  const active30d = getMetric(metrics, 'active_supply_ratio_30d');
  const active90d = getMetric(metrics, 'active_supply_ratio_90d');
  const active30dValue = active30d?.latestValue ?? null;
  const active90dValue = active90d?.latestValue ?? null;
  const series = dormant.series.slice(-7).map((point) => ({
    day: point.day,
    value: point.value,
  }));
  const priorValues = dormant.series.slice(-8, -1).map((point) => point.value);
  const baselineValue =
    priorValues.length > 0
      ? average(priorValues)
      : dormant.previousValue ?? dormant.latestValue;
  const ratio =
    baselineValue > 0
      ? dormant.latestValue / baselineValue
      : dormant.latestValue > 0
      ? 2
      : 1;
  const changePercent = dormant.changePercent ?? null;

  let tone: OnchainDormancyPulseData['tone'] = 'calm';
  let label = '차분';
  let summary =
    '장기 휴면 코인 이동이 최근 평균 부근에 머물러 있어 장기 보유자 분배 압력은 크지 않습니다.';

  if (ratio >= 1.8 || (changePercent !== null && changePercent >= 80)) {
    tone = 'spike';
    label = '급증';
    summary =
      active30dValue !== null && active30dValue >= 14
        ? '장기 휴면 코인 이동이 평균보다 크게 늘었고 단기 활성 공급도 높아 유통 회전이 빨라지고 있습니다.'
        : '장기 휴면 코인 이동이 평균보다 크게 늘어 내부 재배치인지 분배 신호인지 추가 확인이 필요한 구간입니다.';
  } else if (ratio >= 1.25 || (changePercent !== null && changePercent >= 25)) {
    tone = 'watch';
    label = '주의';
    summary =
      '휴면 코인 이동이 최근 평균보다 높아졌습니다. 추세로 이어지는지 며칠 더 확인할 필요가 있습니다.';
  }

  return {
    tone,
    label,
    summary,
    latestDay: dormant.latestDay,
    latestValue: dormant.latestValue,
    baselineValue,
    ratio,
    changePercent,
    active30dRatio: active30dValue,
    active90dRatio: active90dValue,
    series,
  };
}

export function deriveOnchainFlowPressure(
  entityFlows: OnchainEntityFlowEntry[]
): OnchainFlowPressureData | null {
  if (entityFlows.length === 0) {
    return null;
  }

  const latestDay =
    Array.from(new Set(entityFlows.map((entry) => entry.day)))
      .sort()
      .at(-1) ?? null;
  const latestFlows = latestDay
    ? entityFlows.filter((entry) => entry.day === latestDay)
    : entityFlows;
  if (latestFlows.length === 0) {
    return null;
  }

  const exchangeSlugs = [
    'binance',
    'coinbase',
    'kraken',
    'bitfinex',
    'okx',
    'okex',
    'bybit',
    'kucoin',
    'upbit',
    'bithumb',
    'bitstamp',
    'gemini',
    'gate',
    'mexc',
    'robinhood',
    'bitflyer',
  ];
  const exchangeFlows = latestFlows.filter((entry) =>
    exchangeSlugs.some((slug) => entry.entitySlug.toLowerCase().includes(slug))
  );
  const scopedFlows = exchangeFlows.length > 0 ? exchangeFlows : latestFlows;

  const totalReceivedBtc = scopedFlows.reduce(
    (sum, entry) => sum + entry.receivedSats / 100_000_000,
    0
  );
  const totalSentBtc = scopedFlows.reduce(
    (sum, entry) => sum + entry.sentSats / 100_000_000,
    0
  );
  const netflowBtc = scopedFlows.reduce(
    (sum, entry) => sum + entry.netflowSats / 100_000_000,
    0
  );
  const grossFlow = Math.max(totalReceivedBtc + totalSentBtc, 1);
  const balanceRatio = netflowBtc / grossFlow;

  let tone: OnchainFlowPressureData['tone'] = 'balanced';
  let label = '균형';
  let summary =
    exchangeFlows.length > 0
      ? '거래소 라벨 기준 순유입과 순유출이 비슷해 단기 매도 압력이 한쪽으로 크게 기울지 않았습니다.'
      : '상위 라벨 엔티티 기준 순유입과 순유출이 비슷해 한쪽 방향으로 크게 기울지 않았습니다.';

  if (balanceRatio >= 0.08) {
    tone = 'inflow';
    label = '순유입 우세';
    summary =
      exchangeFlows.length > 0
        ? '거래소 라벨로 코인이 더 많이 들어오고 있습니다. 단기적으로는 매도 대기 물량이 늘어나는 쪽으로 해석합니다.'
        : '상위 라벨 엔티티로 코인이 더 많이 들어오고 있습니다. 거래소 라벨 비중이 높다면 매도 대기 물량으로 해석할 수 있습니다.';
  } else if (balanceRatio <= -0.08) {
    tone = 'outflow';
    label = '순유출 우세';
    summary =
      exchangeFlows.length > 0
        ? '거래소 라벨에서 코인이 더 많이 빠져나가고 있습니다. 축적 또는 외부 보관 이동 수요가 커지는 구간으로 읽을 수 있습니다.'
        : '상위 라벨 엔티티에서 코인이 더 많이 빠져나가고 있습니다. 보관 이동이나 외부 이체 수요가 커진 구간일 수 있습니다.';
  }

  const leaders = [...scopedFlows]
    .sort((left, right) => Math.abs(right.netflowSats) - Math.abs(left.netflowSats))
    .slice(0, 3)
    .map((entry) => {
      const direction: 'inflow' | 'outflow' =
        entry.netflowSats >= 0 ? 'inflow' : 'outflow';

      return {
        entitySlug: entry.entitySlug,
        netflowBtc: entry.netflowSats / 100_000_000,
        receivedBtc: entry.receivedSats / 100_000_000,
        sentBtc: entry.sentSats / 100_000_000,
        txCount: entry.txCount,
        direction,
      };
    });

  return {
    tone,
    scope: exchangeFlows.length > 0 ? 'exchange' : 'labeled',
    label,
    summary,
    latestDay,
    trackedEntityCount: scopedFlows.length,
    exchangeEntityCount: exchangeFlows.length,
    totalReceivedBtc,
    totalSentBtc,
    netflowBtc,
    leaders,
  };
}

export function deriveOnchainAgeBands(
  metrics: OnchainMetricSummary[]
): OnchainAgeBandSummary | null {
  const active30d = getMetric(metrics, 'active_supply_ratio_30d');
  const active90d = getMetric(metrics, 'active_supply_ratio_90d');
  const dormant = getMetric(metrics, 'dormant_reactivated_btc');

  if (!active30d || !active90d || active30d.latestValue === null || active90d.latestValue === null) {
    return null;
  }

  const hotShare = clamp(active30d.latestValue, 0, 100);
  const warmShare = clamp(active90d.latestValue - active30d.latestValue, 0, 100);
  const coldShare = clamp(100 - active90d.latestValue, 0, 100);

  let tone: OnchainAgeBandSummary['tone'] = 'balanced';
  let label = '균형';
  let summary =
    '최근 30일과 90일 활동 공급이 균형적으로 분포해 있습니다. 단기와 중기 참여가 모두 과도하지 않은 구간입니다.';

  if (hotShare >= 14 || (active30d.changeValue ?? 0) >= 0.35) {
    tone = 'rotation';
    label = '회전 강화';
    summary =
      '최근 30일 활동 공급 비중이 높아져 단기 회전율이 커졌습니다. 투기성 유동성이 늘었는지 함께 봐야 합니다.';
  } else if (coldShare >= 78 && (dormant?.latestValue ?? 0) <= (dormant?.previousValue ?? dormant?.latestValue ?? 0) * 1.1) {
    tone = 'dormant';
    label = '장기 보유 우세';
    summary =
      '90일 이상 잠자던 공급 비중이 높고 휴면 코인 이동도 차분해, 장기 보유 성격이 강한 구간으로 읽힙니다.';
  }

  return {
    tone,
    label,
    summary,
    latestDay: active90d.latestDay ?? active30d.latestDay,
    hotShare,
    warmShare,
    coldShare,
    active30d: active30d.latestValue,
    active90d: active90d.latestValue,
    dormantMovedBtc: dormant?.latestValue ?? null,
    segments: [
      {
        key: 'hot',
        label: '0-30D 활동 공급',
        share: hotShare,
        description: '최근 30일 안에 움직인 비교적 뜨거운 공급입니다.',
      },
      {
        key: 'warm',
        label: '31-90D 활동 공급',
        share: warmShare,
        description: '단기 투기보다는 중기 회전 성격이 강한 공급입니다.',
      },
      {
        key: 'cold',
        label: '90D+ 비활성 공급',
        share: coldShare,
        description: '최근 90일 넘게 움직이지 않은 장기 보유 성격의 공급입니다.',
      },
    ],
  };
}

export function deriveOnchainBriefing(input: {
  regime: OnchainRegimeSummary | null;
  whaleSummary: OnchainWhaleSummary | null;
  feePressure: OnchainFeePressureData | null;
  dormancyPulse: OnchainDormancyPulseData | null;
  flowPressure: OnchainFlowPressureData | null;
  ageBands?: OnchainAgeBandSummary | null;
  levels?: OnchainSupportResistanceSummary | null;
}): OnchainBriefingData | null {
  const { regime, whaleSummary, feePressure, dormancyPulse, flowPressure, ageBands, levels } = input;
  if (!regime && !whaleSummary && !feePressure && !dormancyPulse && !flowPressure && !ageBands && !levels) {
    return null;
  }

  const tone =
    regime?.tone ??
    (dormancyPulse?.tone === 'spike'
      ? 'contraction'
      : feePressure?.pressure === '혼잡'
      ? 'expansion'
      : 'neutral');

  let headline = '온체인 신호가 엇갈려 단일 방향보다 조합 해석이 중요한 구간입니다.';
  let summary = '레짐, 대형 이동, 수수료 혼잡도를 함께 보면 현재 네트워크 온도를 더 안정적으로 읽을 수 있습니다.';
  let watchLabel = '같은 방향의 신호가 2~3일 이어지는지 확인';

  if (regime?.tone === 'expansion' && feePressure?.pressure === '혼잡') {
    headline = '활동은 확장 중이고 블록 공간 경쟁도 함께 올라오고 있습니다.';
    summary =
      '네트워크 참여 강도와 수수료 경쟁이 같이 상승하는 조합입니다. 단기 과열이라기보다 트래픽이 살아나는 구간에 가깝습니다.';
    watchLabel = '수수료 혼잡이 며칠 지속되는지 확인';
  } else if (regime?.tone === 'expansion') {
    headline = '온체인 활동은 확장 쪽이지만 과열로 단정할 정도는 아닙니다.';
    summary =
      '활성 공급과 이동량이 개선되고 있습니다. 대형 이동이 차분하다면 비교적 건강한 확장으로 읽을 수 있습니다.';
    watchLabel = '고래 이동이 확장 흐름을 방해하는지 확인';
  } else if (regime?.tone === 'contraction' && dormancyPulse?.tone === 'spike') {
    headline = '활동은 둔화됐고 장기 코인 이동은 늘어 보수적으로 볼 구간입니다.';
    summary =
      '참여 강도는 약해지는데 휴면 코인 이동은 커지고 있어 분배 가능성을 조금 더 경계해야 하는 조합입니다.';
    watchLabel = '휴면 코인 이동이 일시적인지 확인';
  } else if (regime?.tone === 'contraction') {
    headline = '활동은 식어 있고 강한 확장 신호는 아직 보이지 않습니다.';
    summary =
      '수수료와 대형 이동이 빠르게 살아나지 않는다면 네트워크는 당분간 차분한 구간에 머물 수 있습니다.';
    watchLabel = '활성 공급 회복 여부 확인';
  } else if (whaleSummary && whaleSummary.totalMovedBtc >= 1_000) {
    headline = '기조는 중립이지만 대형 자금 이동이 커져 단기 노이즈가 늘 수 있습니다.';
    summary =
      '지표 전체는 균형이지만 고래 이동이 커졌습니다. 해석은 거래소 유입인지, 내부 재배치인지에 따라 달라집니다.';
    watchLabel = '대형 이동 유형과 다음 24시간 흐름 확인';
  }

  const bullets: string[] = [];

  if (regime) {
    bullets.push(
      `레짐은 ${regime.label} 구간입니다. score ${formatSigned(regime.score)}로 ${regime.summary}`
    );
  }

  if (whaleSummary) {
    bullets.push(
      whaleSummary.totalAlerts > 0
        ? `최근 24시간 ${whaleSummary.totalAlerts}건, 총 ${formatCompactBtc(whaleSummary.totalMovedBtc)} 규모의 대형 이동이 감지됐습니다.`
        : '최근 24시간 대형 이동은 두드러지지 않았습니다.'
    );
  }

  if (dormancyPulse) {
    bullets.push(
      `휴면 코인 이동은 ${dormancyPulse.label} 단계입니다. 최근 평균 대비 ${dormancyPulse.ratio.toFixed(1)}배입니다.`
    );
  }

  if (feePressure) {
    bullets.push(
      `수수료 혼잡도는 ${feePressure.pressure}입니다. 빠른 확정 기준 ${feePressure.fastestFee.toFixed(0)} sat/vB입니다.`
    );
  }

  if (flowPressure) {
    bullets.push(
      `상위 라벨 엔티티 흐름은 ${flowPressure.label}입니다. 순흐름 ${formatSigned(flowPressure.netflowBtc)} BTC입니다.`
    );
  }

  if (ageBands) {
    bullets.push(
      `활동 공급 밴드는 ${ageBands.label}입니다. 30D ${ageBands.hotShare.toFixed(1)}% / 90D ${ageBands.active90d.toFixed(1)}% 수준입니다.`
    );
  }

  if (levels) {
    bullets.push(
      `price proxy 상단은 $${levels.resistanceUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}, 하단은 $${levels.supportUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })} 입니다.`
    );
  }

  return {
    tone,
    headline,
    summary,
    bullets: bullets.slice(0, 4),
    watchLabel,
  };
}

export function deriveOnchainSupportResistance(
  marketContext: OnchainMarketContextData | null,
  regime: OnchainRegimeSummary | null,
  whaleSummary: OnchainWhaleSummary | null,
  dormancyPulse: OnchainDormancyPulseData | null,
  flowPressure: OnchainFlowPressureData | null
): OnchainSupportResistanceSummary | null {
  if (!marketContext || marketContext.history.length < 5) {
    return null;
  }

  const prices = marketContext.history.map((point) => point.priceUsd);
  const periodLowUsd = Math.min(...prices);
  const periodHighUsd = Math.max(...prices);
  const periodAverageUsd = average(prices);

  let supportWeight = regime?.tone === 'expansion' ? 0.68 : regime?.tone === 'contraction' ? 0.36 : 0.52;
  let resistanceWeight = regime?.tone === 'contraction' ? 0.68 : regime?.tone === 'expansion' ? 0.36 : 0.52;

  if (flowPressure?.tone === 'outflow') {
    supportWeight += 0.06;
  } else if (flowPressure?.tone === 'inflow') {
    resistanceWeight += 0.05;
  }

  if (dormancyPulse?.tone === 'spike') {
    resistanceWeight += 0.05;
  }

  if (whaleSummary && whaleSummary.totalMovedBtc >= 1_500) {
    resistanceWeight += 0.04;
  }

  supportWeight = clamp(supportWeight, 0.25, 0.82);
  resistanceWeight = clamp(resistanceWeight, 0.25, 0.82);

  const supportUsd = periodLowUsd + (periodAverageUsd - periodLowUsd) * supportWeight;
  const resistanceUsd = periodAverageUsd + (periodHighUsd - periodAverageUsd) * resistanceWeight;
  const supportDistancePercent = ((marketContext.currentPriceUsd - supportUsd) / marketContext.currentPriceUsd) * 100;
  const resistanceDistancePercent = ((resistanceUsd - marketContext.currentPriceUsd) / marketContext.currentPriceUsd) * 100;

  let tone: OnchainSupportResistanceSummary['tone'] = 'neutral';
  let label = '중립';
  let summary =
    '실제 IOMAP이 아니라 최근 30일 가격 범위에 현재 온체인 활동성을 얹은 참고 레벨입니다.';

  if (regime?.tone === 'expansion' && supportDistancePercent <= 6) {
    tone = 'supportive';
    label = '하단 지지 우세';
    summary =
      '확장 레짐과 비교적 가까운 하단 지지 레벨 조합입니다. 눌림 구간에서 수요가 붙는지 확인할 때 쓰는 proxy입니다.';
  } else if (
    (regime?.tone === 'contraction' || dormancyPulse?.tone === 'spike') &&
    resistanceDistancePercent <= 6
  ) {
    tone = 'capped';
    label = '상단 부담';
    summary =
      '위축 또는 장기 코인 이동 증가 구간에서 상단 레벨이 가까워졌습니다. 반등 시 매물 부담을 체크하는 proxy입니다.';
  }

  return {
    tone,
    label,
    summary,
    currentPriceUsd: marketContext.currentPriceUsd,
    periodLowUsd,
    periodAverageUsd,
    periodHighUsd,
    supportUsd,
    resistanceUsd,
    supportDistancePercent,
    resistanceDistancePercent,
    windowDays: marketContext.windowDays,
  };
}

export function deriveFeeRegimeHistory(
  recentBlocks: RecentBlockResponse[]
): OnchainFeeRegimeHistoryData {
  const points = recentBlocks
    .slice(0, 12)
    .reverse()
    .map((block) => ({
      height: block.height,
      timestamp: new Date(block.timestamp * 1000).toISOString(),
      medianFee:
        typeof block.extras?.medianFee === 'number'
          ? block.extras.medianFee
          : typeof block.extras?.avgFeeRate === 'number'
          ? block.extras.avgFeeRate
          : 0,
      avgFeeRate:
        typeof block.extras?.avgFeeRate === 'number'
          ? block.extras.avgFeeRate
          : typeof block.extras?.medianFee === 'number'
          ? block.extras.medianFee
          : 0,
      txCount: block.tx_count,
      totalFeesBtc:
        typeof block.extras?.totalFees === 'number'
          ? block.extras.totalFees / 100_000_000
          : 0,
    }))
    .filter((point) => point.medianFee > 0 || point.avgFeeRate > 0);

  const medianValues = points.map((point) => point.medianFee);
  const latestMedianFee = points.at(-1)?.medianFee ?? 0;
  const averageMedianFee = average(medianValues);
  const peakMedianFee = medianValues.length > 0 ? Math.max(...medianValues) : 0;
  const previousAverage = average(points.slice(0, Math.max(points.length - 3, 1)).map((point) => point.medianFee));
  const recentAverage = average(points.slice(-3).map((point) => point.medianFee));

  let trend: OnchainFeeRegimeHistoryData['trend'] = '안정';
  if (recentAverage > previousAverage * 1.35 || recentAverage - previousAverage >= 1) {
    trend = '상승';
  } else if (previousAverage > recentAverage * 1.35 || previousAverage - recentAverage >= 1) {
    trend = '완화';
  }

  let tone: OnchainFeeRegimeHistoryData['tone'] = 'relief';
  let label = '완화';
  let summary = '최근 블록들의 중간 수수료가 낮아 급한 거래 경쟁은 크지 않습니다.';

  if (latestMedianFee >= 6 || peakMedianFee >= 10) {
    tone = 'hot';
    label = '혼잡';
    summary = '최근 블록들에서 높은 수수료 구간이 반복돼, 급한 거래가 블록 공간을 두고 경쟁하고 있습니다.';
  } else if (latestMedianFee >= 2 || peakMedianFee >= 4) {
    tone = 'balanced';
    label = '균형';
    summary = '수수료 경쟁이 과열되진 않았지만, 블록마다 체감 수수료가 조금씩 흔들리는 구간입니다.';
  }

  return {
    tone,
    label,
    trend,
    summary,
    latestMedianFee,
    averageMedianFee,
    peakMedianFee,
    points,
  };
}

function deriveFeePressure(
  fees: RecommendedFeesResponse,
  mempool: MempoolResponse,
  projectedBlocks: OnchainProjectedBlock[]
): OnchainFeePressureData {
  const nextBlockMedianFee = projectedBlocks[0]?.medianFee ?? fees.halfHourFee;
  const pressureScore =
    (fees.fastestFee >= 10 ? 2 : fees.fastestFee >= 3 ? 1 : 0) +
    (mempool.vsize >= 60_000_000 ? 2 : mempool.vsize >= 20_000_000 ? 1 : 0) +
    (nextBlockMedianFee >= 6 ? 2 : nextBlockMedianFee >= 2 ? 1 : 0);
  const pressure = pressureScore >= 4 ? '혼잡' : pressureScore >= 2 ? '균형' : '완화';

  return {
    pressure,
    fastestFee: fees.fastestFee,
    halfHourFee: fees.halfHourFee,
    hourFee: fees.hourFee,
    economyFee: fees.economyFee,
    minimumFee: fees.minimumFee,
    mempoolTxCount: mempool.count,
    mempoolVsize: mempool.vsize,
    totalFeeBtc: mempool.total_fee / 100_000_000,
    projectedBlocks,
  };
}

function deriveBlockTempo(
  recentBlocks: RecentBlockResponse[],
  difficulty: DifficultyAdjustmentResponse,
  now = new Date()
): OnchainBlockTempoData {
  const latestBlock = recentBlocks[0];
  const intervals: number[] = [];

  for (let index = 1; index < recentBlocks.length; index += 1) {
    const newer = recentBlocks[index - 1];
    const older = recentBlocks[index];
    intervals.push((newer.timestamp - older.timestamp) / 60);
  }

  const averageBlockMinutes =
    intervals.length > 0
      ? intervals.reduce((sum, value) => sum + value, 0) / intervals.length
      : 10;
  const latestTimestamp = latestBlock.timestamp * 1000;
  const minutesSinceLastBlock = clamp((now.getTime() - latestTimestamp) / 60000, 0, 240);

  return {
    currentHeight: latestBlock.height,
    latestBlockAt: new Date(latestTimestamp).toISOString(),
    latestBlockTxCount: latestBlock.tx_count,
    minutesSinceLastBlock,
    averageBlockMinutes,
    difficultyChange: difficulty.difficultyChange,
    difficultyProgress: difficulty.progressPercent,
    remainingBlocksToAdjustment: difficulty.remainingBlocks,
    estimatedRetargetAt:
      typeof difficulty.estimatedRetargetDate === 'number'
        ? new Date(difficulty.estimatedRetargetDate).toISOString()
        : null,
  };
}

export async function fetchOnchainNetworkPulse(): Promise<OnchainNetworkPulseData | null> {
  try {
    const [fees, mempool, projectedBlocks, difficulty, recentBlocks, currentPriceUsd, priceHistory] = await Promise.all([
      fetchJson<RecommendedFeesResponse>('/v1/fees/recommended'),
      fetchJson<MempoolResponse>('/mempool'),
      fetchJson<MempoolProjectedBlockResponse[]>('/v1/fees/mempool-blocks'),
      fetchJson<DifficultyAdjustmentResponse>('/v1/difficulty-adjustment'),
      fetchJson<RecentBlockResponse[]>('/v1/blocks'),
      fetchCurrentBtcPriceUsd(),
      fetchBtcPriceHistory(),
    ]);

    if (!recentBlocks.length) {
      return null;
    }

    const projected = projectedBlocks.slice(0, 3).map((block) => ({
      blockVSize: block.blockVSize,
      txCount: block.nTx,
      medianFee: block.medianFee,
    }));

    return {
      marketContext: {
        currentPriceUsd,
        windowDays: SUPPORT_RESISTANCE_WINDOW_DAYS,
        history: priceHistory,
      },
      feePressure: deriveFeePressure(fees, mempool, projected),
      feeHistory: deriveFeeRegimeHistory(recentBlocks),
      blockTempo: deriveBlockTempo(recentBlocks.slice(0, 8), difficulty),
    };
  } catch {
    return null;
  }
}
