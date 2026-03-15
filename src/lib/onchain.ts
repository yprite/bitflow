import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getBitflowPgPool, hasBitflowPgDsn } from './postgres';
import { createServiceClient, hasSupabaseServiceConfig } from './supabase';
import type {
  OnchainAlertEvent,
  OnchainEntityFlowEntry,
  OnchainMetricId,
  OnchainMetricSummary,
  OnchainSummaryData,
} from './types';

interface OnchainMetricDefinition {
  id: OnchainMetricId;
  label: string;
  description: string;
  metricName: string;
  dimensionKey: string;
  unit: string;
}

interface OnchainMetricRow {
  day: string;
  metricName: string;
  metricValue: number;
  unit: string;
  dimensionKey: string;
}

interface OnchainFallbackPayload {
  generatedAt: string;
  source: string;
  latestBlockHeight: number;
  metrics: OnchainMetricRow[];
}

const DEFAULT_METRIC_LOOKBACK_DAYS = 30;
const DEFAULT_ALERT_LIMIT = 8;
const DEFAULT_ENTITY_LIMIT = 6;

export const ONCHAIN_METRIC_DEFINITIONS: OnchainMetricDefinition[] = [
  {
    id: 'created_utxo_count',
    label: '신규 UTXO',
    description: '해당 일자에 새로 생성된 UTXO 수',
    metricName: 'created_utxo_count',
    dimensionKey: 'all',
    unit: 'count',
  },
  {
    id: 'spent_utxo_count',
    label: '소비 UTXO',
    description: '해당 일자에 사용된 UTXO 수',
    metricName: 'spent_utxo_count',
    dimensionKey: 'all',
    unit: 'count',
  },
  {
    id: 'spent_btc',
    label: '일간 이동 BTC',
    description: '확정된 소비 출력 기준 하루 이동량',
    metricName: 'spent_btc',
    dimensionKey: 'all',
    unit: 'btc',
  },
  {
    id: 'dormant_reactivated_btc',
    label: '휴면 재활성 BTC',
    description: '180일 이상 묵은 코인의 재이동량',
    metricName: 'dormant_reactivated_btc',
    dimensionKey: 'all',
    unit: 'btc',
  },
  {
    id: 'active_supply_ratio_30d',
    label: '활성 공급 30D',
    description: '최근 30일 내 이동한 공급 비중',
    metricName: 'active_supply_ratio',
    dimensionKey: '30d',
    unit: 'percent',
  },
  {
    id: 'active_supply_ratio_90d',
    label: '활성 공급 90D',
    description: '최근 90일 내 이동한 공급 비중',
    metricName: 'active_supply_ratio',
    dimensionKey: '90d',
    unit: 'percent',
  },
];

const ONCHAIN_METRIC_IDS = new Set<OnchainMetricId>(
  ONCHAIN_METRIC_DEFINITIONS.map((definition) => definition.id)
);

function getMetricDefinition(id: OnchainMetricId): OnchainMetricDefinition {
  const definition = ONCHAIN_METRIC_DEFINITIONS.find((item) => item.id === id);
  if (!definition) {
    throw new Error(`Unknown on-chain metric: ${id}`);
  }

  return definition;
}

function getMetricSummary(
  definition: OnchainMetricDefinition,
  rows: OnchainMetricRow[]
): OnchainMetricSummary {
  const series = rows
    .filter(
      (row) =>
        row.metricName === definition.metricName &&
        row.dimensionKey === definition.dimensionKey
    )
    .sort((a, b) => a.day.localeCompare(b.day))
    .map((row) => ({
      day: row.day,
      value: row.metricValue,
      unit: row.unit,
    }));

  const latest = series.at(-1) ?? null;
  const previous = series.at(-2) ?? null;
  const changeValue =
    latest && previous ? latest.value - previous.value : null;
  const changePercent =
    latest && previous && previous.value !== 0
      ? ((latest.value - previous.value) / Math.abs(previous.value)) * 100
      : null;

  return {
    id: definition.id,
    label: definition.label,
    description: definition.description,
    metricName: definition.metricName,
    dimensionKey: definition.dimensionKey,
    unit: latest?.unit ?? definition.unit,
    latestDay: latest?.day ?? null,
    latestValue: latest?.value ?? null,
    previousValue: previous?.value ?? null,
    changeValue,
    changePercent,
    series,
  };
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toIsoDate(value: unknown): string {
  if (typeof value === 'string') return value.slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return '';
}

function latestDate(values: Array<string | null | undefined>): string | null {
  const filtered = values.filter((value): value is string => Boolean(value));
  if (filtered.length === 0) return null;
  return filtered.sort().at(-1) ?? null;
}

function buildAlertStats(alerts: OnchainAlertEvent[]) {
  return alerts.reduce(
    (stats, alert) => {
      stats.total += 1;

      if (alert.severity === 'high') stats.high += 1;
      else if (alert.severity === 'medium') stats.medium += 1;
      else if (alert.severity === 'info') stats.info += 1;

      return stats;
    },
    { total: 0, high: 0, medium: 0, info: 0 }
  );
}

export function isOnchainMetricId(value: string): value is OnchainMetricId {
  return ONCHAIN_METRIC_IDS.has(value as OnchainMetricId);
}

export function buildOnchainMetricSummaries(
  metricRows: OnchainMetricRow[]
): OnchainMetricSummary[] {
  return ONCHAIN_METRIC_DEFINITIONS.map((definition) =>
    getMetricSummary(definition, metricRows)
  );
}

export function buildOnchainSummary(input: {
  metricRows?: OnchainMetricRow[];
  alerts?: OnchainAlertEvent[];
  entityFlows?: OnchainEntityFlowEntry[];
  message?: string | null;
  updatedAt?: string;
  source?: 'supabase' | 'local-postgres' | 'fallback';
}): OnchainSummaryData {
  const metricRows = input.metricRows ?? [];
  const alerts = input.alerts ?? [];
  const entityFlows = input.entityFlows ?? [];
  const metrics = buildOnchainMetricSummaries(metricRows);
  const latestDay = latestDate([
    ...metrics.map((metric) => metric.latestDay),
    entityFlows[0]?.day,
  ]);
  const hasData =
    metrics.some((metric) => metric.latestValue !== null) ||
    alerts.length > 0 ||
    entityFlows.length > 0;

  return {
    status: hasData ? 'available' : 'unavailable',
    source: input.source ?? 'supabase',
    message: input.message ?? null,
    latestDay,
    metrics,
    entityFlows,
    alerts,
    alertStats: buildAlertStats(alerts),
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  };
}

export function createUnavailableOnchainSummary(
  message: string
): OnchainSummaryData {
  return buildOnchainSummary({ message, source: 'supabase' });
}

async function loadFallbackMetricRows(): Promise<OnchainFallbackPayload | null> {
  try {
    const filePath = path.join(process.cwd(), 'src/data/onchain-fallback.json');
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw) as OnchainFallbackPayload;
  } catch {
    return null;
  }
}

async function loadFallbackOnchainSummary(reason: string): Promise<OnchainSummaryData | null> {
  const payload = await loadFallbackMetricRows();
  if (!payload) return null;

  return buildOnchainSummary({
    metricRows: payload.metrics,
    message: `${reason} ${payload.source} snapshot fallback을 사용 중입니다. 고급 지표와 알림/엔티티 플로우는 direct worker 경로가 필요합니다.`,
    updatedAt: payload.generatedAt,
    source: 'fallback',
  });
}

async function fetchLocalPostgresMetricRows(
  lookbackDays: number
): Promise<OnchainMetricRow[]> {
  const pool = getBitflowPgPool();
  const metricNames = Array.from(
    new Set(ONCHAIN_METRIC_DEFINITIONS.map((definition) => definition.metricName))
  );

  const result = await pool.query<{
    day: string | Date;
    metric_name: string;
    metric_value: string | number;
    unit: string;
    dimension_key: string;
  }>(
    `
      WITH latest_days AS (
        SELECT day
        FROM btc_daily_metrics
        GROUP BY day
        ORDER BY day DESC
        LIMIT $1
      )
      SELECT day, metric_name, metric_value, unit, dimension_key
      FROM btc_daily_metrics
      WHERE metric_name = ANY($2::text[])
        AND day IN (SELECT day FROM latest_days)
      ORDER BY day ASC
    `,
    [Math.max(lookbackDays, 1), metricNames]
  );

  return result.rows.map((row) => ({
    day: toIsoDate(row.day),
    metricName: row.metric_name,
    metricValue: toNumber(row.metric_value),
    unit: row.unit,
    dimensionKey: row.dimension_key,
  }));
}

async function fetchLocalPostgresAlerts(limit: number): Promise<OnchainAlertEvent[]> {
  const pool = getBitflowPgPool();
  const result = await pool.query<{
    detected_at: string | Date;
    alert_type: string;
    severity: string;
    title: string;
    body: string;
    related_txid: string | null;
    related_entity_slug: string | null;
    context: Record<string, unknown> | null;
  }>(
    `
      SELECT detected_at, alert_type, severity, title, body, related_txid, related_entity_slug, context
      FROM btc_alert_events
      ORDER BY detected_at DESC
      LIMIT $1
    `,
    [limit]
  );

  return result.rows.map((row) => ({
    detectedAt:
      row.detected_at instanceof Date
        ? row.detected_at.toISOString()
        : new Date(String(row.detected_at)).toISOString(),
    alertType: row.alert_type,
    severity: row.severity,
    title: row.title,
    body: row.body,
    relatedTxid: row.related_txid,
    relatedEntitySlug: row.related_entity_slug,
    context: row.context ?? {},
  }));
}

async function fetchLocalPostgresEntityFlows(
  limit: number
): Promise<OnchainEntityFlowEntry[]> {
  const pool = getBitflowPgPool();
  const latestDayResult = await pool.query<{ day: string | Date }>(
    `
      SELECT day
      FROM btc_entity_flow_daily
      ORDER BY day DESC
      LIMIT 1
    `
  );

  const latestDay = latestDayResult.rows[0]?.day
    ? toIsoDate(latestDayResult.rows[0].day)
    : null;
  if (!latestDay) {
    return [];
  }

  const result = await pool.query<{
    day: string | Date;
    entity_slug: string;
    received_sats: string | number;
    sent_sats: string | number;
    netflow_sats: string | number;
    tx_count: string | number;
  }>(
    `
      SELECT day, entity_slug, received_sats, sent_sats, netflow_sats, tx_count
      FROM btc_entity_flow_daily
      WHERE day = $1::date
      LIMIT $2
    `,
    [latestDay, Math.max(limit * 4, 24)]
  );

  return result.rows
    .map((row) => ({
      day: toIsoDate(row.day),
      entitySlug: row.entity_slug,
      receivedSats: toNumber(row.received_sats),
      sentSats: toNumber(row.sent_sats),
      netflowSats: toNumber(row.netflow_sats),
      txCount: toNumber(row.tx_count),
    }))
    .sort((a, b) => Math.abs(b.netflowSats) - Math.abs(a.netflowSats))
    .slice(0, limit);
}

async function fetchOnchainSummaryFromLocalPostgres(options?: {
  metricLookbackDays?: number;
  alertLimit?: number;
  entityLimit?: number;
}): Promise<OnchainSummaryData> {
  const metricLookbackDays =
    options?.metricLookbackDays ?? DEFAULT_METRIC_LOOKBACK_DAYS;
  const alertLimit = options?.alertLimit ?? DEFAULT_ALERT_LIMIT;
  const entityLimit = options?.entityLimit ?? DEFAULT_ENTITY_LIMIT;
  const results = await Promise.allSettled([
    fetchLocalPostgresMetricRows(metricLookbackDays),
    fetchLocalPostgresAlerts(alertLimit),
    fetchLocalPostgresEntityFlows(entityLimit),
  ]);

  const messages: string[] = [];
  const metrics =
    results[0].status === 'fulfilled'
      ? buildOnchainMetricSummaries(results[0].value)
      : (messages.push('로컬 Postgres 일별 지표 조회 실패'), buildOnchainMetricSummaries([]));
  const alerts =
    results[1].status === 'fulfilled'
      ? results[1].value
      : (messages.push('로컬 Postgres 알림 피드 조회 실패'), []);
  const entityFlows =
    results[2].status === 'fulfilled'
      ? results[2].value
      : (messages.push('로컬 Postgres 엔티티 순유입 조회 실패'), []);
  const latestDay =
    [...metrics.map((metric) => metric.latestDay), entityFlows[0]?.day]
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? null;
  const hasData =
    metrics.some((metric) => metric.latestValue !== null) ||
    alerts.length > 0 ||
    entityFlows.length > 0;

  return {
    status: hasData ? 'available' : 'unavailable',
    source: 'local-postgres',
    latestDay,
    metrics,
    entityFlows,
    alerts,
    alertStats: buildAlertStats(alerts),
    updatedAt: new Date().toISOString(),
    message:
      messages.length > 0
        ? `${messages.join(' / ')}. 로컬 worker/Postgres 상태를 확인하세요.`
        : !hasData
        ? '로컬 Postgres 온체인 테이블이 비어 있습니다. bitcoind sync와 Python backfill/metrics 진행 상태를 확인하세요.'
        : '로컬 bitcoind -> Python worker -> Postgres 경로를 우선 사용 중입니다.',
  };
}

export async function fetchOnchainMetricSummaries(
  lookbackDays = DEFAULT_METRIC_LOOKBACK_DAYS
): Promise<OnchainMetricSummary[]> {
  if (!hasSupabaseServiceConfig()) {
    return buildOnchainMetricSummaries([]);
  }

  const supabase = createServiceClient();
  const lookbackStart = new Date();
  lookbackStart.setUTCDate(lookbackStart.getUTCDate() - Math.max(lookbackDays - 1, 0));

  const { data, error } = await supabase
    .from('btc_daily_metrics')
    .select('day, metric_name, metric_value, unit, dimension_key')
    .in(
      'metric_name',
      Array.from(
        new Set(ONCHAIN_METRIC_DEFINITIONS.map((definition) => definition.metricName))
      )
    )
    .gte('day', lookbackStart.toISOString().slice(0, 10))
    .order('day', { ascending: true });

  if (error) {
    throw error;
  }

  const rows: OnchainMetricRow[] = (data ?? []).map((row) => ({
    day: toIsoDate(row.day),
    metricName: String(row.metric_name),
    metricValue: toNumber(row.metric_value),
    unit: String(row.unit),
    dimensionKey: String(row.dimension_key),
  }));

  return buildOnchainMetricSummaries(rows);
}

export async function fetchOnchainAlerts(
  limit = DEFAULT_ALERT_LIMIT
): Promise<OnchainAlertEvent[]> {
  if (!hasSupabaseServiceConfig()) {
    return [];
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('btc_alert_events')
    .select(
      'detected_at, alert_type, severity, title, body, related_txid, related_entity_slug, context'
    )
    .order('detected_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    detectedAt: typeof row.detected_at === 'string'
      ? row.detected_at
      : new Date(String(row.detected_at)).toISOString(),
    alertType: String(row.alert_type),
    severity: String(row.severity),
    title: String(row.title),
    body: String(row.body),
    relatedTxid: row.related_txid ? String(row.related_txid) : null,
    relatedEntitySlug: row.related_entity_slug
      ? String(row.related_entity_slug)
      : null,
    context:
      row.context && typeof row.context === 'object'
        ? (row.context as Record<string, unknown>)
        : {},
  }));
}

export async function fetchOnchainEntityFlows(
  limit = DEFAULT_ENTITY_LIMIT
): Promise<OnchainEntityFlowEntry[]> {
  if (!hasSupabaseServiceConfig()) {
    return [];
  }

  const supabase = createServiceClient();
  const { data: latestDayRow, error: latestDayError } = await supabase
    .from('btc_entity_flow_daily')
    .select('day')
    .order('day', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestDayError) {
    throw latestDayError;
  }

  const latestDay = latestDayRow?.day ? toIsoDate(latestDayRow.day) : null;
  if (!latestDay) {
    return [];
  }

  const { data, error } = await supabase
    .from('btc_entity_flow_daily')
    .select('day, entity_slug, received_sats, sent_sats, netflow_sats, tx_count')
    .eq('day', latestDay)
    .limit(Math.max(limit * 4, 24));

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((row) => ({
      day: latestDay,
      entitySlug: String(row.entity_slug),
      receivedSats: toNumber(row.received_sats),
      sentSats: toNumber(row.sent_sats),
      netflowSats: toNumber(row.netflow_sats),
      txCount: toNumber(row.tx_count),
    }))
    .sort((a, b) => Math.abs(b.netflowSats) - Math.abs(a.netflowSats))
    .slice(0, limit);
}

export async function fetchOnchainSummary(options?: {
  metricLookbackDays?: number;
  alertLimit?: number;
  entityLimit?: number;
}): Promise<OnchainSummaryData> {
  if (hasBitflowPgDsn()) {
    try {
      const localSummary = await fetchOnchainSummaryFromLocalPostgres(options);
      if (localSummary.status === 'available') {
        return localSummary;
      }
    } catch {
      // Fall through to hosted Supabase/fallback sources when local Postgres is unavailable.
    }
  }

  if (!hasSupabaseServiceConfig()) {
    const fallback = await loadFallbackOnchainSummary(
      'SUPABASE_URL 또는 SUPABASE_SERVICE_KEY가 없어 hosted serving layer를 읽지 못했습니다.'
    );
    return fallback ?? createUnavailableOnchainSummary(
      'SUPABASE_URL 또는 SUPABASE_SERVICE_KEY가 없어 온체인 serving layer를 읽을 수 없습니다.'
    );
  }

  const metricLookbackDays =
    options?.metricLookbackDays ?? DEFAULT_METRIC_LOOKBACK_DAYS;
  const alertLimit = options?.alertLimit ?? DEFAULT_ALERT_LIMIT;
  const entityLimit = options?.entityLimit ?? DEFAULT_ENTITY_LIMIT;
  const results = await Promise.allSettled([
    fetchOnchainMetricSummaries(metricLookbackDays),
    fetchOnchainAlerts(alertLimit),
    fetchOnchainEntityFlows(entityLimit),
  ]);

  const messages: string[] = [];
  const metrics =
    results[0].status === 'fulfilled'
      ? results[0].value
      : (messages.push('일별 지표 조회 실패'), buildOnchainMetricSummaries([]));
  const alerts =
    results[1].status === 'fulfilled'
      ? results[1].value
      : (messages.push('알림 피드 조회 실패'), []);
  const entityFlows =
    results[2].status === 'fulfilled'
      ? results[2].value
      : (messages.push('엔티티 순유입 조회 실패'), []);
  const latestDay =
    [...metrics.map((metric) => metric.latestDay), entityFlows[0]?.day]
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? null;
  const hasData =
    metrics.some((metric) => metric.latestValue !== null) ||
    alerts.length > 0 ||
    entityFlows.length > 0;

  const summary: OnchainSummaryData = {
    status: hasData ? 'available' : 'unavailable',
    source: 'supabase',
    latestDay,
    metrics,
    entityFlows,
    alerts,
    alertStats: buildAlertStats(alerts),
    updatedAt: new Date().toISOString(),
    message:
      messages.length > 0
        ? `${messages.join(' / ')}. Supabase 마이그레이션과 백필 상태를 확인하세요.`
        : !hasData
        ? '온체인 serving 테이블에 아직 적재된 데이터가 없습니다. 마이그레이션 적용과 Python backfill/metrics 실행 여부를 확인하세요.'
        : null,
  };

  if (summary.status === 'unavailable') {
    const fallback = await loadFallbackOnchainSummary(
      'Hosted Supabase serving 테이블이 비어 있어'
    );
    if (fallback) {
      return fallback;
    }
  }

  return summary;
}

export function getOnchainMetricById(
  metrics: OnchainMetricSummary[],
  id: OnchainMetricId
): OnchainMetricSummary {
  const metric = metrics.find((item) => item.id === id);
  if (!metric) {
    return getMetricSummary(getMetricDefinition(id), []);
  }

  return metric;
}
