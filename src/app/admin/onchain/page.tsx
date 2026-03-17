'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { OnchainSummaryData } from '@/lib/types';

interface AdminOnchainData {
  summary: OnchainSummaryData;
  pipeline: {
    nodeTipHeight: number | null;
    headerHeight: number | null;
    indexedHeight: number | null;
    lagBlocks: number | null;
    syncPercent: number | null;
    latestIndexedDay: string | null;
    publishedSource: 'supabase' | 'local-postgres' | 'fallback';
    publishedLatestDay: string | null;
    alertTotal: number;
    initialBlockDownload: boolean | null;
    pruned: boolean | null;
    pruneHeight: number | null;
    updatedAt: string;
  };
}

function formatCount(value: number | null): string {
  if (value === null) return '—';
  return value.toLocaleString('ko-KR');
}

function formatPercent(value: number | null): string {
  if (value === null) return '—';
  return `${value.toFixed(2)}%`;
}

function formatDay(value: string | null): string {
  if (!value) return '—';

  return new Date(`${value}T00:00:00Z`).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul',
  });
}

function formatSource(value: AdminOnchainData['pipeline']['publishedSource']): string {
  if (value === 'supabase') return 'Supabase';
  if (value === 'local-postgres') return 'Local Postgres';
  return 'Fallback';
}

function formatBoolean(value: boolean | null, truthy: string, falsy: string): string {
  if (value === null) return '—';
  return value ? truthy : falsy;
}

function severityMeta(severity: string) {
  if (severity === 'high') {
    return {
      label: 'HIGH',
      chipClass: 'border-dot-red/30 bg-dot-red/10 text-dot-red',
    };
  }

  if (severity === 'medium') {
    return {
      label: 'MED',
      chipClass: 'border-dot-yellow/30 bg-dot-yellow/10 text-dot-yellow',
    };
  }

  return {
    label: 'INFO',
    chipClass: 'border-dot-green/30 bg-dot-green/10 text-dot-green',
  };
}

function truncateTxid(txid: string | null): string {
  if (!txid) return '—';
  return `${txid.slice(0, 12)}…${txid.slice(-10)}`;
}

function StatusCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="dot-card p-4 space-y-2">
      <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">{label}</p>
      <p className="text-xl font-semibold text-dot-accent font-mono">{value}</p>
      <p className="text-[11px] text-dot-muted leading-relaxed">{hint}</p>
    </div>
  );
}

function OpsPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="dot-card p-4 sm:p-5">
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">
            {title}
          </p>
          <p className="text-xs text-dot-sub leading-relaxed">{description}</p>
        </div>
        {children}
      </div>
    </section>
  );
}

function KeyValueGrid({
  items,
}: {
  items: Array<{ label: string; value: string; hint?: string }>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-sm border border-dot-border/40 bg-white/70 px-3 py-3 space-y-1"
        >
          <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-dot-muted">
            {item.label}
          </p>
          <p className="text-sm font-semibold text-dot-text break-words">{item.value}</p>
          {item.hint ? (
            <p className="text-[11px] text-dot-muted leading-relaxed">{item.hint}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function RecentAlertsPanel({ summary }: { summary: OnchainSummaryData }) {
  return (
    <section className="dot-card p-4 sm:p-5">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">
              Recent Alerts
            </p>
            <h2 className="text-sm font-semibold text-dot-accent tracking-tight">
              최근 온체인 알림
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-[0.14em]">
            <span className="rounded-sm border border-dot-border/40 px-2 py-1 text-dot-muted">
              Total {summary.alertStats.total}
            </span>
            <span className="rounded-sm border border-dot-red/30 bg-dot-red/10 px-2 py-1 text-dot-red">
              High {summary.alertStats.high}
            </span>
            <span className="rounded-sm border border-dot-yellow/30 bg-dot-yellow/10 px-2 py-1 text-dot-yellow">
              Med {summary.alertStats.medium}
            </span>
            <span className="rounded-sm border border-dot-green/30 bg-dot-green/10 px-2 py-1 text-dot-green">
              Info {summary.alertStats.info}
            </span>
          </div>
        </div>

        {summary.alerts.length === 0 ? (
          <p className="text-sm text-dot-muted leading-relaxed">
            최근 published alert가 없습니다. 새 이벤트가 들어오면 여기에서 시간순으로 확인합니다.
          </p>
        ) : (
          <div className="space-y-3">
            {summary.alerts.map((alert) => {
              const meta = severityMeta(alert.severity);

              return (
                <article
                  key={`${alert.detectedAt}-${alert.alertType}-${alert.relatedTxid ?? 'none'}`}
                  className="rounded-sm border border-dot-border/40 bg-white/75 px-3 py-3 sm:px-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-[0.14em]">
                        <span className={`rounded-sm border px-2 py-1 ${meta.chipClass}`}>
                          {meta.label}
                        </span>
                        <span className="text-dot-muted">{formatDateTime(alert.detectedAt)}</span>
                        <span className="text-dot-muted break-all">{alert.alertType}</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-dot-text break-words">
                          {alert.title}
                        </p>
                        <p className="text-xs text-dot-sub leading-relaxed break-words">
                          {alert.body}
                        </p>
                      </div>
                    </div>
                    <div className="min-w-0 rounded-sm border border-dot-border/30 bg-stone-50/80 px-3 py-2 text-[11px] font-mono text-dot-muted lg:w-[240px]">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-dot-muted">
                        Related Tx
                      </p>
                      <p className="mt-1 break-all text-dot-sub">
                        {truncateTxid(alert.relatedTxid)}
                      </p>
                      {alert.relatedEntitySlug ? (
                        <>
                          <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-dot-muted">
                            Entity
                          </p>
                          <p className="mt-1 break-all text-dot-sub">{alert.relatedEntitySlug}</p>
                        </>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default function AdminOnchainPage() {
  const [secret, setSecret] = useState('');
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<AdminOnchainData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async (token: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/onchain', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        setAuthed(false);
        setError('인증 실패');
        return;
      }

      if (!res.ok) {
        throw new Error('API 오류');
      }

      const json: AdminOnchainData = await res.json();
      setData(json);
      setAuthed(true);
    } catch {
      setError('온체인 관리자 데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = () => {
    if (!secret.trim()) return;
    sessionStorage.setItem('admin_token', secret);
    fetchData(secret);
  };

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_token');
    if (saved) {
      setSecret(saved);
      fetchData(saved);
    }
  }, [fetchData]);

  if (!authed) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="dot-card p-6 w-full max-w-xs space-y-4 dot-entrance dot-grid-sparse">
          <h1 className="text-xs font-semibold text-dot-accent uppercase tracking-wider text-center">
            Admin On-chain
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

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-sm font-semibold text-dot-sub uppercase tracking-wider">
            온체인 파이프라인
          </h1>
          <p className="text-xs text-dot-muted">
            node runtime, indexer lag, published stream 상태를 관리자 전용으로 확인합니다.
          </p>
        </div>
        <button
          onClick={() => secret && fetchData(secret)}
          disabled={loading}
          className="text-xs text-dot-sub hover:text-dot-accent transition px-2 py-1 border-2 border-dot-border hover:border-dot-accent disabled:opacity-50"
        >
          {loading ? '로딩...' : '새로고침'}
        </button>
      </div>

      {error && <p className="text-dot-red text-xs">{error}</p>}

      {data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatusCard
              label="Node Tip"
              value={formatCount(data.pipeline.nodeTipHeight)}
              hint="bitcoind가 검증한 최신 블록 높이"
            />
            <StatusCard
              label="Headers"
              value={formatCount(data.pipeline.headerHeight)}
              hint="피어 네트워크에서 수신한 최신 헤더 높이"
            />
            <StatusCard
              label="Indexed Height"
              value={formatCount(data.pipeline.indexedHeight)}
              hint="로컬 인덱서가 적재한 마지막 블록 높이"
            />
            <StatusCard
              label="Sync Progress"
              value={formatPercent(data.pipeline.syncPercent)}
              hint={`lag ${formatCount(data.pipeline.lagBlocks)} blocks`}
            />
          </div>

          <div className="grid gap-3 xl:grid-cols-3">
            <OpsPanel
              title="Node Runtime"
              description="현재 비트코인 노드의 동기화와 실행 모드를 확인합니다."
            >
              <KeyValueGrid
                items={[
                  {
                    label: 'IBD',
                    value: formatBoolean(
                      data.pipeline.initialBlockDownload,
                      '초기 동기화 중',
                      '동기화 완료'
                    ),
                  },
                  {
                    label: 'Storage Mode',
                    value: formatBoolean(data.pipeline.pruned, 'Pruned Node', 'Full Node'),
                  },
                  {
                    label: 'Prune Height',
                    value: formatCount(data.pipeline.pruneHeight),
                  },
                  {
                    label: 'Last Refresh',
                    value: formatDateTime(data.pipeline.updatedAt),
                  },
                ]}
              />
            </OpsPanel>

            <OpsPanel
              title="Indexer"
              description="로컬 인덱서가 체인을 얼마나 따라왔는지 보여줍니다."
            >
              <KeyValueGrid
                items={[
                  {
                    label: 'Indexed Day',
                    value: formatDay(data.pipeline.latestIndexedDay),
                  },
                  {
                    label: 'Lag Blocks',
                    value: formatCount(data.pipeline.lagBlocks),
                  },
                  {
                    label: 'Tip Gap',
                    value:
                      data.pipeline.headerHeight !== null &&
                      data.pipeline.nodeTipHeight !== null
                        ? formatCount(
                            Math.max(
                              data.pipeline.headerHeight - data.pipeline.nodeTipHeight,
                              0
                            )
                          )
                        : '—',
                    hint: 'headers와 blocks 차이',
                  },
                  {
                    label: 'Sync Percent',
                    value: formatPercent(data.pipeline.syncPercent),
                  },
                ]}
              />
            </OpsPanel>

            <OpsPanel
              title="Published Stream"
              description="웹이 읽는 published 테이블 상태와 알림 볼륨을 확인합니다."
            >
              <KeyValueGrid
                items={[
                  {
                    label: 'Source',
                    value: formatSource(data.pipeline.publishedSource),
                  },
                  {
                    label: 'Published Day',
                    value: formatDay(data.pipeline.publishedLatestDay),
                  },
                  {
                    label: 'Published Status',
                    value: data.summary.status === 'available' ? 'Available' : 'Unavailable',
                  },
                  {
                    label: 'Alert Total',
                    value: formatCount(data.pipeline.alertTotal),
                  },
                ]}
              />
            </OpsPanel>
          </div>

          <RecentAlertsPanel summary={data.summary} />
        </>
      ) : null}
    </div>
  );
}
