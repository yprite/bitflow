import type {
  OnchainAlertEvent,
  OnchainAlertStats,
  OnchainBlockTempoData,
  OnchainFeePressureData,
  OnchainRegimeFactor,
  OnchainMetricId,
  OnchainMetricSummary,
  OnchainNetworkPulseData,
  OnchainProjectedBlock,
  OnchainRegimeSummary,
  OnchainWhaleSummary,
} from './types';

const MEMPOOL_SPACE_API_BASE = 'https://mempool.space/api';
const DAY_MS = 24 * 60 * 60 * 1000;
const WHALE_BUCKET_HOURS = 3;
const WHALE_BUCKET_COUNT = 8;

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getMetric(metrics: OnchainMetricSummary[], id: OnchainMetricId): OnchainMetricSummary | null {
  return metrics.find((metric) => metric.id === id) ?? null;
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
    const [fees, mempool, projectedBlocks, difficulty, recentBlocks] = await Promise.all([
      fetchJson<RecommendedFeesResponse>('/v1/fees/recommended'),
      fetchJson<MempoolResponse>('/mempool'),
      fetchJson<MempoolProjectedBlockResponse[]>('/v1/fees/mempool-blocks'),
      fetchJson<DifficultyAdjustmentResponse>('/v1/difficulty-adjustment'),
      fetchJson<RecentBlockResponse[]>('/v1/blocks'),
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
      feePressure: deriveFeePressure(fees, mempool, projected),
      blockTempo: deriveBlockTempo(recentBlocks.slice(0, 8), difficulty),
    };
  } catch {
    return null;
  }
}
