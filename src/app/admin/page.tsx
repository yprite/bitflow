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

interface AdminData {
  period: { days: number; since: string };
  totals: Totals | null;
  dailyPageviews: DailyPageview[];
  pageBreakdown: PageRow[];
  referrerBreakdown: ReferrerRow[];
  deviceBreakdown: DeviceRow[];
  browserBreakdown: BrowserRow[];
  featureUsage: FeatureRow[];
  utmBreakdown: UtmRow[];
  recentSessions: RecentSession[];
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
            <div className="flex-1 h-4 bg-gray-100 relative">
              <div
                className="absolute inset-y-0 left-0 bg-dot-accent/80"
                style={{ width: `${pct}%` }}
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
  const maxSess = Math.max(...data.map((d) => d.unique_sessions), 1);
  const barW = Math.max(100 / data.length, 2);

  return (
    <div>
      <div className="flex items-end gap-px h-32">
        {data.map((d, i) => {
          const pvH = (d.pageviews / maxPv) * 100;
          const sessH = (d.unique_sessions / maxSess) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-px justify-end h-full group relative">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-dot-accent text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10 pointer-events-none">
                {d.day.slice(5)}: {d.pageviews}PV / {d.unique_sessions}세션
              </div>
              <div
                className="bg-dot-accent/70 w-full min-w-[3px]"
                style={{ height: `${pvH}%`, maxWidth: `${barW}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-dot-muted mt-1 font-mono">
        <span>{data[0]?.day.slice(5)}</span>
        <span>{data[data.length - 1]?.day.slice(5)}</span>
      </div>
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
        <div className="dot-card p-6 w-full max-w-xs space-y-4">
          <h1 className="text-sm font-semibold text-dot-accent uppercase tracking-wider text-center">
            Admin
          </h1>
          {error && <p className="text-dot-red text-xs text-center">{error}</p>}
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="관리자 비밀키"
            className="w-full border-2 border-dot-border px-3 py-2 text-sm focus:border-dot-accent outline-none font-mono"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-dot-accent text-white py-2 text-sm font-semibold hover:bg-dot-accent/90 transition"
          >
            로그인
          </button>
        </div>
      </div>
    );
  }

  // ── Dashboard ──
  const totals = data?.totals;

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
          <div className="dot-card p-3 text-center">
            <p className="text-[10px] text-dot-muted uppercase tracking-wider">총 페이지뷰</p>
            <p className="text-xl sm:text-2xl font-bold text-dot-accent font-mono">
              {totals.total_pageviews.toLocaleString()}
            </p>
          </div>
          <div className="dot-card p-3 text-center">
            <p className="text-[10px] text-dot-muted uppercase tracking-wider">고유 세션</p>
            <p className="text-xl sm:text-2xl font-bold text-dot-accent font-mono">
              {totals.unique_sessions.toLocaleString()}
            </p>
          </div>
          <div className="dot-card p-3 text-center">
            <p className="text-[10px] text-dot-muted uppercase tracking-wider">총 이벤트</p>
            <p className="text-xl sm:text-2xl font-bold text-dot-accent font-mono">
              {totals.total_events.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Daily pageviews chart */}
      {data && (
        <Card title="일별 페이지뷰 추이">
          <DailyChart data={data.dailyPageviews} />
        </Card>
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

          <Card title="기능 사용">
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
                  <tr key={i} className="border-t border-gray-100">
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
