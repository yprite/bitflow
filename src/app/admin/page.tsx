'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AdminLoadingPanel,
  AdminLoginPanel,
} from '@/components/admin-auth-panel';

interface Totals {
  total_events: number;
  total_pageviews: number;
  unique_sessions: number;
}

interface DailyPageview {
  day: string;
  pageviews: number;
  unique_sessions: number;
}

interface GrowthOverview {
  pageview_sessions: number;
  avg_pageviews_per_session: number;
  activated_sessions: number;
  activation_rate: number;
  utm_sessions: number;
  utm_rate: number;
}

interface PageRow {
  page: string;
  views: number;
  unique_sessions: number;
}

interface ReferrerRow {
  referrer: string;
  count: number;
}

interface DeviceRow {
  device_type: string;
  count: number;
}

interface BrowserRow {
  browser: string;
  count: number;
}

interface FeatureRow {
  event_type: string;
  count: number;
  unique_sessions: number;
}

interface RecentFeatureEvent {
  event_type: string;
  page: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface UtmRow {
  source: string;
  medium: string;
  campaign: string;
  count: number;
}

interface RecentSession {
  session_id: string;
  page: string;
  device_type: string;
  browser: string;
  created_at: string;
}

interface LandingPageRow {
  page: string;
  sessions: number;
  activated_sessions: number;
  activation_rate: number;
  avg_pageviews: number;
}

interface AcquisitionRow {
  channel: string;
  sessions: number;
  activated_sessions: number;
  activation_rate: number;
  avg_pageviews: number;
}

interface GrowthTableRow {
  label: string;
  sessions: number;
  activation_rate: number;
  avg_pageviews: number;
}

interface AdminData {
  period: { days: number; since: string };
  totals: Totals | null;
  dailyPageviews: DailyPageview[];
  growthOverview: GrowthOverview | null;
  landingPageBreakdown: LandingPageRow[];
  acquisitionBreakdown: AcquisitionRow[];
  pageBreakdown: PageRow[];
  referrerBreakdown: ReferrerRow[];
  deviceBreakdown: DeviceRow[];
  browserBreakdown: BrowserRow[];
  featureUsage: FeatureRow[];
  utmBreakdown: UtmRow[];
  recentSessions: RecentSession[];
  recentFeatureEvents: RecentFeatureEvent[];
}

interface InfoDemandRow {
  page: string;
  label: string;
  views: number;
  uniqueSessions: number;
  sessionShare: number;
  landingActivationRate: number | null;
  avgPageviews: number | null;
}

interface FeatureDemandRow {
  eventType: string;
  label: string;
  count: number;
  uniqueSessions: number;
  sessionShare: number;
}

function toNumber(value: number | string | null | undefined): number {
  return Number(value ?? 0);
}

function formatCount(value: number | string | null | undefined): string {
  return toNumber(value).toLocaleString('ko-KR');
}

function formatDecimal(value: number | string | null | undefined, digits: number = 2): string {
  return toNumber(value).toLocaleString('ko-KR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatPercent(value: number | string | null | undefined, digits: number = 1): string {
  return `${formatDecimal(value, digits)}%`;
}

const PAGE_LABELS: Record<string, string> = {
  '/': '홈',
  '/onchain': '온체인',
  '/tools': '도구',
  '/indicators': '지표',
  '/alert': '알림',
  '/admin': '관리자 이벤트',
  '/admin/onchain': '관리자 온체인',
  '/realtime': '실시간',
  '/about': '소개',
  '/contact': '문의',
};

const FEATURE_LABELS: Record<string, string> = {
  telegram_bot_click: '텔레그램 알림 CTA',
  arbitrage_calculator_engaged: '재정거래 계산기 사용',
  tools_fee_calculator_used: '수수료 계산기 사용',
  tools_tx_size_estimator_used: 'TX 크기 추정기 사용',
  tools_stuck_tx_rescue_used: 'Stuck TX 복구 계산',
  tools_tx_status_lookup: 'TX 상태 조회',
  tools_unit_converter_used: 'BTC 단위 환산기 사용',
  tools_utxo_planner_used: 'UTXO 정리 계산기 사용',
};

function describePage(page: string): string {
  return PAGE_LABELS[page] ?? page;
}

function describeFeature(eventType: string): string {
  return FEATURE_LABELS[eventType] ?? eventType;
}

function readMetadataString(
  metadata: Record<string, unknown> | null | undefined,
  key: string
): string | null {
  const value = metadata?.[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function describeFeatureDetail(event: RecentFeatureEvent): string {
  const { event_type: eventType, metadata } = event;

  if (eventType === 'arbitrage_calculator_engaged') {
    const action = readMetadataString(metadata, 'action');
    const coin = readMetadataString(metadata, 'coin');
    const direction = readMetadataString(metadata, 'direction');
    const directionLabel =
      direction === 'buy-global-sell-kr'
        ? '해외 매수 -> 한국 매도'
        : direction === 'buy-kr-sell-global'
          ? '한국 매수 -> 해외 매도'
          : null;
    return [coin, action, directionLabel].filter(Boolean).join(' · ') || '계산 시작';
  }

  if (eventType === 'tools_tx_status_lookup') {
    const result = readMetadataString(metadata, 'result');
    if (result === 'confirmed') return '확정된 tx 조회';
    if (result === 'mempool') return 'mempool 대기 tx 조회';
    if (result === 'not_found') return '미발견 tx 조회';
    if (result === 'error' || result === 'network_error') return '조회 실패';
    return '상태 조회';
  }

  if (eventType === 'tools_fee_calculator_used') {
    const action = readMetadataString(metadata, 'action');
    return action === 'preset' ? '프리셋으로 수수료 계산' : '직접 입력으로 수수료 계산';
  }

  if (eventType === 'tools_tx_size_estimator_used') {
    const inputProfile = readMetadataString(metadata, 'inputProfile');
    const outputProfile = readMetadataString(metadata, 'outputProfile');
    return [inputProfile, outputProfile].filter(Boolean).join(' -> ') || '입출력 타입 추정';
  }

  if (eventType === 'tools_stuck_tx_rescue_used') {
    const targetTier = readMetadataString(metadata, 'targetTier');
    return targetTier ? `${targetTier} 목표 rescue 계산` : 'RBF / CPFP rescue 계산';
  }

  if (eventType === 'tools_unit_converter_used') {
    const mode = readMetadataString(metadata, 'mode');
    return mode ? `${mode.toUpperCase()} 기준 환산` : '단위 환산';
  }

  if (eventType === 'tools_utxo_planner_used') {
    const inputProfile = readMetadataString(metadata, 'inputProfile');
    const outputProfile = readMetadataString(metadata, 'outputProfile');
    return [inputProfile, outputProfile].filter(Boolean).join(' -> ') || 'UTXO 정리 계산';
  }

  return '세부 정보 없음';
}

function buildInfoDemandRows(data: AdminData): InfoDemandRow[] {
  const landingMap = new Map(
    data.landingPageBreakdown.map((row) => [
      row.page,
      {
        activationRate: toNumber(row.activation_rate),
        avgPageviews: toNumber(row.avg_pageviews),
      },
    ])
  );

  return data.pageBreakdown
    .map((row) => {
      const landing = landingMap.get(row.page);
      const uniqueSessions = toNumber(row.unique_sessions);
      return {
        page: row.page,
        label: describePage(row.page),
        views: toNumber(row.views),
        uniqueSessions,
        sessionShare:
          data.totals && toNumber(data.totals.unique_sessions) > 0
            ? (uniqueSessions / toNumber(data.totals.unique_sessions)) * 100
            : 0,
        landingActivationRate: landing?.activationRate ?? null,
        avgPageviews: landing?.avgPageviews ?? null,
      };
    })
    .sort((a, b) => b.uniqueSessions - a.uniqueSessions || b.views - a.views);
}

function buildFeatureDemandRows(data: AdminData): FeatureDemandRow[] {
  return data.featureUsage
    .map((row) => {
      const uniqueSessions = toNumber(row.unique_sessions);
      return {
        eventType: row.event_type,
        label: describeFeature(row.event_type),
        count: toNumber(row.count),
        uniqueSessions,
        sessionShare:
          data.totals && toNumber(data.totals.unique_sessions) > 0
            ? (uniqueSessions / toNumber(data.totals.unique_sessions)) * 100
            : 0,
      };
    })
    .sort((a, b) => b.uniqueSessions - a.uniqueSessions || b.count - a.count);
}

// ─── Mini bar chart using plain divs ────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BarChart({ data, labelKey, valueKey, maxBars = 10 }: {
  data: Array<any>;
  labelKey: string;
  valueKey: string;
  maxBars?: number;
}) {
  const items = data.slice(0, maxBars);
  const maxVal = Math.max(...items.map((d) => Number(d[valueKey]) || 0), 1);

  return (
    <div className="space-y-1.5">
      {items.map((d, i) => {
        const val = Number(d[valueKey]) || 0;
        const pct = (val / maxVal) * 100;
        return (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-28 truncate text-dot-sub font-mono" title={String(d[labelKey])}>
              {String(d[labelKey])}
            </span>
            <div className="flex-1 h-4 bg-gray-100 relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 transition-all duration-500 ease-out"
                style={{
                  width: `${pct}%`,
                  backgroundImage: 'radial-gradient(circle, #1a1a1a 1px, transparent 1px)',
                  backgroundSize: '4px 4px',
                  opacity: 0.6,
                }}
              />
            </div>
            <span className="w-12 text-right font-mono text-dot-accent font-semibold">
              {val.toLocaleString()}
            </span>
          </div>
        );
      })}
      {data.length === 0 && (
        <p className="text-dot-muted text-xs text-center py-2">데이터 없음</p>
      )}
    </div>
  );
}

// ─── Sparkline-style daily chart ────────────────────────────────
function DailyChart({ data }: { data: DailyPageview[] }) {
  if (data.length === 0) {
    return <p className="text-dot-muted text-xs text-center py-4">데이터 없음</p>;
  }

  const maxPv = Math.max(...data.map((d) => d.pageviews), 1);
  const barW = Math.max(100 / data.length, 2);

  return (
    <div>
      <div className="flex items-end gap-px h-32">
        {data.map((d, i) => {
          const pvH = (d.pageviews / maxPv) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-px justify-end h-full group relative">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-dot-accent text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10 pointer-events-none">
                {d.day.slice(5)}: {d.pageviews}PV / {d.unique_sessions}세션
              </div>
              <div
                className="w-full min-w-[3px] transition-all duration-300"
                style={{
                  height: `${pvH}%`,
                  maxWidth: `${barW}%`,
                  backgroundImage: 'radial-gradient(circle, #1a1a1a 1.2px, transparent 1.2px)',
                  backgroundSize: '4px 4px',
                  opacity: 0.55,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-dot-muted mt-1 font-mono">
        <span>{data[0]?.day.slice(5)}</span>
        <span>{data[data.length - 1]?.day.slice(5)}</span>
      </div>
      <p className="text-[10px] text-dot-muted mt-2">
        막대는 일별 PV이며, 마우스를 올리면 해당 날짜의 고유 세션 수를 함께 볼 수 있습니다.
      </p>
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="border border-dot-border/60 p-3 dot-grid-sparse">
      <p className="text-[10px] text-dot-muted uppercase tracking-wider">{label}</p>
      <p className="text-lg sm:text-xl font-bold text-dot-accent font-mono mt-1">{value}</p>
      <p className="text-[10px] text-dot-muted mt-1 leading-relaxed">{hint}</p>
    </div>
  );
}

function GrowthTable({ rows, emptyLabel }: { rows: GrowthTableRow[]; emptyLabel: string }) {
  if (rows.length === 0) {
    return <p className="text-dot-muted text-xs text-center py-2">데이터 없음</p>;
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-dot-muted text-left">
            <th className="pb-2 font-medium">{emptyLabel}</th>
            <th className="pb-2 font-medium text-right">세션</th>
            <th className="pb-2 font-medium text-right">활성률</th>
            <th className="pb-2 font-medium text-right">세션당 PV</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.label}-${index}`} className="border-t border-dot-border/20">
              <td className="py-2 font-mono text-dot-sub max-w-[180px] truncate" title={row.label}>
                {row.label}
              </td>
              <td className="py-2 text-right font-mono text-dot-sub">{formatCount(row.sessions)}</td>
              <td className="py-2 text-right font-mono text-dot-accent">{formatPercent(row.activation_rate)}</td>
              <td className="py-2 text-right font-mono text-dot-sub">{formatDecimal(row.avg_pageviews)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Card wrapper ───────────────────────────────────────────────
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="dot-card p-4">
      <h3 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

// ─── Main Admin Page ────────────────────────────────────────────
export default function AdminPage() {
  const [authState, setAuthState] = useState<'checking' | 'guest' | 'authed'>('checking');
  const [secret, setSecret] = useState('');
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);

  const fetchData = useCallback(async (token: string, d: number, fallbackToGuest: boolean) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/events?days=${d}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        sessionStorage.removeItem('admin_token');
        setSecret('');
        setData(null);
        setAuthState('guest');
        setError('인증 실패');
        return;
      }
      if (!res.ok) throw new Error('API 오류');
      const json: AdminData = await res.json();
      setData(json);
      setAuthState('authed');
    } catch {
      if (fallbackToGuest) {
        sessionStorage.removeItem('admin_token');
        setSecret('');
        setData(null);
        setAuthState('guest');
      }
      setError('데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = () => {
    if (!secret.trim()) return;
    sessionStorage.setItem('admin_token', secret);
    setAuthState('checking');
    fetchData(secret, days, true);
  };

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_token');
    if (saved) {
      setSecret(saved);
      setAuthState('checking');
      fetchData(saved, days, true);
      return;
    }

    setAuthState('guest');
  }, [fetchData]);

  useEffect(() => {
    if (authState === 'authed' && secret) {
      fetchData(secret, days, false);
    }
  }, [days]);

  if (authState === 'checking') {
    return (
      <AdminLoadingPanel
        title="Admin"
        description="저장된 관리자 세션을 확인하고 이벤트 대시보드를 준비하고 있습니다."
      />
    );
  }

  if (authState === 'guest') {
    return (
      <AdminLoginPanel
        title="Admin"
        error={error}
        secret={secret}
        onSecretChange={setSecret}
        onSubmit={handleLogin}
      />
    );
  }

  const totals = data?.totals;
  const growthOverview = data?.growthOverview;
  const infoDemandRows = data ? buildInfoDemandRows(data) : [];
  const featureDemandRows = data ? buildFeatureDemandRows(data) : [];
  const topInfo = infoDemandRows[0] ?? null;
  const topLanding = data?.landingPageBreakdown[0] ?? null;
  const topFeature = featureDemandRows[0] ?? null;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-dot-sub uppercase tracking-wider">이벤트 대시보드</h1>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="border-2 border-dot-border px-2 py-1 text-xs font-mono focus:border-dot-accent outline-none"
          >
            <option value={7}>7일</option>
            <option value={14}>14일</option>
            <option value={30}>30일</option>
            <option value={60}>60일</option>
            <option value={90}>90일</option>
          </select>
          <button
            onClick={() => fetchData(secret, days, false)}
            disabled={loading}
            className="text-xs text-dot-sub hover:text-dot-accent transition px-2 py-1 border-2 border-dot-border hover:border-dot-accent disabled:opacity-50"
          >
            {loading ? '로딩...' : '새로고침'}
          </button>
        </div>
      </div>

      {error && <p className="text-dot-red text-xs">{error}</p>}

      {/* Summary cards */}
      {totals && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="dot-card p-3 text-center dot-entrance" style={{ '--entrance-delay': '0ms' } as React.CSSProperties}>
            <p className="text-[10px] text-dot-muted uppercase tracking-wider">총 페이지뷰</p>
            <p className="text-xl sm:text-2xl font-bold text-dot-accent font-mono">
              {formatCount(totals.total_pageviews)}
            </p>
          </div>
          <div className="dot-card p-3 text-center dot-entrance" style={{ '--entrance-delay': '60ms' } as React.CSSProperties}>
            <p className="text-[10px] text-dot-muted uppercase tracking-wider">고유 세션</p>
            <p className="text-xl sm:text-2xl font-bold text-dot-accent font-mono">
              {formatCount(totals.unique_sessions)}
            </p>
          </div>
          <div className="dot-card p-3 text-center dot-entrance" style={{ '--entrance-delay': '120ms' } as React.CSSProperties}>
            <p className="text-[10px] text-dot-muted uppercase tracking-wider">총 이벤트</p>
            <p className="text-xl sm:text-2xl font-bold text-dot-accent font-mono">
              {formatCount(totals.total_events)}
            </p>
          </div>
        </div>
      )}

      {data && (topInfo || topLanding || topFeature) && (
        <Card title="사용자 관심 요약">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            <MetricCard
              label="가장 많이 찾는 정보"
              value={topInfo ? topInfo.label : '-'}
              hint={
                topInfo
                  ? `${formatPercent(topInfo.sessionShare)} 세션 도달 · ${formatCount(topInfo.views)} PV`
                  : '데이터 없음'
              }
            />
            <MetricCard
              label="전환 강한 첫 진입"
              value={topLanding ? describePage(topLanding.page) : '-'}
              hint={
                topLanding
                  ? `활성률 ${formatPercent(topLanding.activation_rate)} · 세션당 PV ${formatDecimal(topLanding.avg_pageviews)}`
                  : '데이터 없음'
              }
            />
            <MetricCard
              label="행동이 많은 기능"
              value={topFeature ? topFeature.label : '-'}
              hint={
                topFeature
                  ? `${formatCount(topFeature.uniqueSessions)}세션 · 전체의 ${formatPercent(topFeature.sessionShare)}`
                  : '아직 pageview 중심 트래픽'
              }
            />
          </div>
        </Card>
      )}

      {/* Growth overview */}
      {growthOverview && (
        <Card title="그로스 체크">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <MetricCard
              label="트래픽 세션"
              value={formatCount(growthOverview.pageview_sessions)}
              hint="선택한 기간에 페이지뷰가 기록된 세션 수"
            />
            <MetricCard
              label="세션당 PV"
              value={formatDecimal(growthOverview.avg_pageviews_per_session)}
              hint="세션 하나가 평균 몇 페이지를 봤는지"
            />
            <MetricCard
              label="활성 세션 비율"
              value={formatPercent(growthOverview.activation_rate)}
              hint={`${formatCount(growthOverview.activated_sessions)}세션이 2페이지 이상 조회`}
            />
            <MetricCard
              label="UTM 세션 비율"
              value={formatPercent(growthOverview.utm_rate)}
              hint={`${formatCount(growthOverview.utm_sessions)}세션에 source/medium 태그 존재`}
            />
          </div>
        </Card>
      )}

      {/* Daily pageviews chart */}
      {data && (
        <Card title="일자별 페이지 조회 수 (PV)">
          <DailyChart data={data.dailyPageviews} />
        </Card>
      )}

      {/* Growth tables */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          <Card title="첫 진입 페이지 성과">
            <p className="text-[10px] text-dot-muted mb-3">선택 기간 내 세션의 첫 페이지뷰 기준</p>
            <GrowthTable
              emptyLabel="페이지"
              rows={data.landingPageBreakdown.map((row) => ({
                label: row.page,
                sessions: row.sessions,
                activation_rate: row.activation_rate,
                avg_pageviews: row.avg_pageviews,
              }))}
            />
          </Card>

          <Card title="획득 채널 성과">
            <p className="text-[10px] text-dot-muted mb-3">첫 유입 채널 기준 세션 품질 비교</p>
            <GrowthTable
              emptyLabel="채널"
              rows={data.acquisitionBreakdown.map((row) => ({
                label: row.channel,
                sessions: row.sessions,
                activation_rate: row.activation_rate,
                avg_pageviews: row.avg_pageviews,
              }))}
            />
          </Card>
        </div>
      )}

      {/* Two-column grid */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          <Card title="실제 많이 찾는 정보">
            {infoDemandRows.length > 0 ? (
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-dot-muted text-left">
                      <th className="pb-2 font-medium">정보</th>
                      <th className="pb-2 font-medium text-right">PV</th>
                      <th className="pb-2 font-medium text-right">세션 점유</th>
                      <th className="pb-2 font-medium text-right">랜딩 활성률</th>
                    </tr>
                  </thead>
                  <tbody>
                    {infoDemandRows.slice(0, 8).map((row) => (
                      <tr key={row.page} className="border-t border-dot-border/20">
                        <td className="py-2">
                          <p className="font-mono text-dot-sub">{row.label}</p>
                          <p className="text-[10px] text-dot-muted">{row.page}</p>
                        </td>
                        <td className="py-2 text-right font-mono text-dot-sub">
                          {formatCount(row.views)}
                        </td>
                        <td className="py-2 text-right font-mono text-dot-accent">
                          {formatPercent(row.sessionShare)}
                        </td>
                        <td className="py-2 text-right font-mono text-dot-sub">
                          {row.landingActivationRate !== null
                            ? formatPercent(row.landingActivationRate)
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-dot-muted text-xs text-center py-2">데이터 없음</p>
            )}
          </Card>

          <Card title="실행 행동 랭킹">
            {featureDemandRows.length > 0 ? (
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-dot-muted text-left">
                      <th className="pb-2 font-medium">기능</th>
                      <th className="pb-2 font-medium text-right">이벤트</th>
                      <th className="pb-2 font-medium text-right">세션</th>
                      <th className="pb-2 font-medium text-right">세션 점유</th>
                    </tr>
                  </thead>
                  <tbody>
                    {featureDemandRows.slice(0, 8).map((row) => (
                      <tr key={row.eventType} className="border-t border-dot-border/20">
                        <td className="py-2 font-mono text-dot-sub">{row.label}</td>
                        <td className="py-2 text-right font-mono text-dot-sub">
                          {formatCount(row.count)}
                        </td>
                        <td className="py-2 text-right font-mono text-dot-sub">
                          {formatCount(row.uniqueSessions)}
                        </td>
                        <td className="py-2 text-right font-mono text-dot-accent">
                          {formatPercent(row.sessionShare)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-dot-muted text-xs text-center py-2">데이터 없음</p>
            )}
          </Card>

          <Card title="페이지별 방문">
            <BarChart data={data.pageBreakdown} labelKey="page" valueKey="views" />
          </Card>

          <Card title="유입 경로">
            <BarChart data={data.referrerBreakdown} labelKey="referrer" valueKey="count" />
          </Card>

          <Card title="디바이스">
            <BarChart data={data.deviceBreakdown} labelKey="device_type" valueKey="count" />
          </Card>

          <Card title="브라우저">
            <BarChart data={data.browserBreakdown} labelKey="browser" valueKey="count" />
          </Card>

          <Card title="기능/CTA 사용">
            <BarChart data={data.featureUsage} labelKey="event_type" valueKey="count" />
          </Card>

          <Card title="UTM 유입">
            {data.utmBreakdown.length > 0 ? (
              <div className="space-y-1 text-xs">
                {data.utmBreakdown.slice(0, 10).map((u, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <span className="truncate text-dot-sub font-mono">
                      {u.source}/{u.medium}
                      {u.campaign !== '(none)' && `/${u.campaign}`}
                    </span>
                    <span className="font-mono text-dot-accent font-semibold">{u.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-dot-muted text-xs text-center py-2">데이터 없음</p>
            )}
          </Card>
        </div>
      )}

      {data && data.recentFeatureEvents.length > 0 && (
        <Card title="최근 행동 로그">
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-dot-muted text-left">
                  <th className="pb-1 font-medium">시간</th>
                  <th className="pb-1 font-medium">기능</th>
                  <th className="pb-1 font-medium">페이지</th>
                  <th className="pb-1 font-medium">세부 내용</th>
                </tr>
              </thead>
              <tbody>
                {data.recentFeatureEvents.slice(0, 20).map((event, index) => (
                  <tr key={`${event.event_type}-${event.created_at}-${index}`} className="border-t border-dot-border/20 hover:bg-dot-accent/[0.02] transition-colors">
                    <td className="py-1 font-mono text-dot-muted">
                      {new Date(event.created_at).toLocaleTimeString('ko-KR', {
                        timeZone: 'Asia/Seoul',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-1 font-mono text-dot-sub">{describeFeature(event.event_type)}</td>
                    <td className="py-1 text-dot-muted">{describePage(event.page)}</td>
                    <td className="py-1 text-dot-sub">{describeFeatureDetail(event)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Recent sessions */}
      {data && data.recentSessions.length > 0 && (
        <Card title="최근 세션 (24시간)">
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-dot-muted text-left">
                  <th className="pb-1 font-medium">시간</th>
                  <th className="pb-1 font-medium">페이지</th>
                  <th className="pb-1 font-medium">디바이스</th>
                  <th className="pb-1 font-medium">브라우저</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSessions.slice(0, 20).map((s, i) => (
                  <tr key={i} className="border-t border-dot-border/20 hover:bg-dot-accent/[0.02] transition-colors">
                    <td className="py-1 font-mono text-dot-muted">
                      {new Date(s.created_at).toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-1 font-mono text-dot-sub">{s.page}</td>
                    <td className="py-1 text-dot-muted">{s.device_type}</td>
                    <td className="py-1 text-dot-muted">{s.browser}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Logout */}
      <div className="text-center pb-4">
        <button
          onClick={() => {
            sessionStorage.removeItem('admin_token');
            setAuthState('guest');
            setData(null);
            setSecret('');
          }}
          className="text-xs text-dot-muted hover:text-dot-red transition"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
