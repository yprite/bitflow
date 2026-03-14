'use client';

import { useState, useEffect, useCallback } from 'react';

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
  const [secret, setSecret] = useState('');
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);

  const fetchData = useCallback(async (token: string, d: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/events?days=${d}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        setAuthed(false);
        setError('인증 실패');
        return;
      }
      if (!res.ok) throw new Error('API 오류');
      const json: AdminData = await res.json();
      setData(json);
      setAuthed(true);
    } catch {
      setError('데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = () => {
    if (!secret.trim()) return;
    sessionStorage.setItem('admin_token', secret);
    fetchData(secret, days);
  };

  // Auto-login if token was saved
  useEffect(() => {
    const saved = sessionStorage.getItem('admin_token');
    if (saved) {
      setSecret(saved);
      fetchData(saved, days);
    }
  }, []);

  useEffect(() => {
    if (authed && secret) {
      fetchData(secret, days);
    }
  }, [days]);

  // ── Login screen ──
  if (!authed) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="dot-card p-6 w-full max-w-xs space-y-4 dot-entrance dot-grid-sparse">
          <h1 className="text-xs font-semibold text-dot-accent uppercase tracking-wider text-center">
            Admin
          </h1>
          {error && <p className="text-dot-red text-xs text-center">{error}</p>}
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="관리자 비밀키"
            className="w-full border border-dot-border px-3 py-2 text-xs focus:border-dot-accent outline-none font-mono bg-white"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-dot-accent text-white py-2 text-xs font-semibold hover:bg-dot-accent/90 transition font-mono uppercase tracking-wider"
          >
            로그인
          </button>
        </div>
      </div>
    );
  }

  // ── Dashboard ──
  const totals = data?.totals;
  const growthOverview = data?.growthOverview;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/" className="text-dot-muted hover:text-dot-accent transition text-sm font-mono">
            ← 홈
          </a>
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
            onClick={() => fetchData(secret, days)}
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
            setAuthed(false);
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
