'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { OnchainSummaryData } from '@/lib/types';

interface AdminOnchainData {
  summary: OnchainSummaryData;
  pipeline: {
    states: {
      node: 'ok' | 'rpc_error';
      indexer: 'ok' | 'dsn_missing' | 'empty' | 'query_error';
      published: 'ok' | 'empty' | 'local_only' | 'fallback';
    };
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
  if (value === null) return '';
  return value.toLocaleString('ko-KR');
}

function formatPercent(value: number | null): string {
  if (value === null) return '';
  return `${value.toFixed(2)}%`;
}

function formatDay(value: string | null): string {
  if (!value) return '';

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
  if (value === null) return '';
  return value ? truthy : falsy;
}

function indexerStateLabel(
  state: AdminOnchainData['pipeline']['states']['indexer']
): string {
  if (state === 'dsn_missing') return 'DSN 미설정';
  if (state === 'query_error') return '조회 실패';
  if (state === 'empty') return '미적재';
  return '정상';
}

function publishedStateLabel(
  state: AdminOnchainData['pipeline']['states']['published']
): string {
  if (state === 'fallback') return 'Fallback 사용 중';
  if (state === 'local_only') return 'Local만 사용 중';
  if (state === 'empty') return '미적재';
  return '정상';
}

function fieldFallbackLabel(
  kind: 'node' | 'indexer' | 'published',
  state:
    | AdminOnchainData['pipeline']['states']['node']
    | AdminOnchainData['pipeline']['states']['indexer']
    | AdminOnchainData['pipeline']['states']['published']
): string {
  if (kind === 'node') {
    return state === 'rpc_error' ? 'RPC 실패' : '정보 없음';
  }

  if (kind === 'indexer') {
    return indexerStateLabel(
      state as AdminOnchainData['pipeline']['states']['indexer']
    );
  }

  return publishedStateLabel(
    state as AdminOnchainData['pipeline']['states']['published']
  );
}

function valueOrFallback(
  value: string,
  fallback: string
): string {
  return value.length > 0 ? value : fallback;
}

function panelStatusMeta(
  kind: 'node' | 'indexer' | 'published',
  state:
    | AdminOnchainData['pipeline']['states']['node']
    | AdminOnchainData['pipeline']['states']['indexer']
    | AdminOnchainData['pipeline']['states']['published']
) {
  if (kind === 'node') {
    if (state === 'ok') {
      return {
        label: 'RPC 정상',
        className: 'border-dot-green/30 bg-dot-green/10 text-dot-green',
      };
    }

    return {
      label: 'RPC 실패',
      className: 'border-dot-red/30 bg-dot-red/10 text-dot-red',
    };
  }

  if (kind === 'indexer') {
    if (state === 'ok') {
      return {
        label: '인덱서 정상',
        className: 'border-dot-green/30 bg-dot-green/10 text-dot-green',
      };
    }
    if (state === 'dsn_missing') {
      return {
        label: 'DSN 미설정',
        className: 'border-dot-yellow/30 bg-dot-yellow/10 text-dot-yellow',
      };
    }
    if (state === 'empty') {
      return {
        label: '미적재',
        className: 'border-dot-yellow/30 bg-dot-yellow/10 text-dot-yellow',
      };
    }
    return {
      label: '조회 실패',
      className: 'border-dot-red/30 bg-dot-red/10 text-dot-red',
    };
  }

  if (state === 'ok') {
    return {
      label: 'Published 정상',
      className: 'border-dot-green/30 bg-dot-green/10 text-dot-green',
    };
  }
  if (state === 'local_only') {
    return {
      label: 'Local만 사용',
      className: 'border-dot-yellow/30 bg-dot-yellow/10 text-dot-yellow',
    };
  }
  if (state === 'fallback') {
    return {
      label: 'Fallback 사용',
      className: 'border-dot-yellow/30 bg-dot-yellow/10 text-dot-yellow',
    };
  }
  return {
    label: '미적재',
    className: 'border-dot-yellow/30 bg-dot-yellow/10 text-dot-yellow',
  };
}

function severityMeta(severity: string) {
  if (severity === 'high') {
    return {
      label: '확정 강한 이벤트',
      chipClass: 'border-dot-red/30 bg-dot-red/10 text-dot-red',
    };
  }

  if (severity === 'medium') {
    return {
      label: '미확정 큰 거래',
      chipClass: 'border-dot-yellow/30 bg-dot-yellow/10 text-dot-yellow',
    };
  }

  return {
    label: '운영 알림',
    chipClass: 'border-dot-green/30 bg-dot-green/10 text-dot-green',
  };
}

function formatAlertType(alertType: string): string {
  if (alertType === 'large_confirmed_spend') return '확정 대형 이동';
  if (alertType === 'dormant_reactivation') return '휴면 코인 재활성';
  if (alertType === 'mempool_large_tx') return '미확정 대형 이동';
  if (alertType === 'new_block') return '새 블록';
  return alertType;
}

function truncateTxid(txid: string | null): string {
  if (!txid) return '—';
  return `${txid.slice(0, 12)}…${txid.slice(-10)}`;
}

function getAlertAmountBtc(alert: OnchainSummaryData['alerts'][number]): number | null {
  const value = alert.context.amount_btc;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return null;
}

function formatBtcAmount(value: number | null): string {
  if (value === null) return 'N/A';

  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: value >= 100 ? 0 : 1,
    maximumFractionDigits: value >= 100 ? 0 : 1,
  })} BTC`;
}

function getAlertInterpretation(alert: OnchainSummaryData['alerts'][number]): string {
  if (alert.alertType === 'large_confirmed_spend') {
    return '확정된 대형 이동입니다. 실제 자금 이동이 블록에 포함됐다는 뜻이라 해석 강도가 높습니다.';
  }

  if (alert.alertType === 'mempool_large_tx') {
    return '아직 블록에 포함되지 않은 대형 이동입니다. 취소되거나 경로가 달라질 수 있어 확인 강도는 한 단계 낮습니다.';
  }

  if (alert.alertType === 'dormant_reactivation') {
    return '오랫동안 잠자던 코인이 다시 움직였습니다. 내부 재배치일 수도 있지만 장기 보유자 행동 변화로도 읽힙니다.';
  }

  if (alert.alertType === 'new_block') {
    return '운영성 이벤트입니다. 시장 해석보다 파이프라인 동작 확인에 더 가깝습니다.';
  }

  return '이 이벤트는 추가 라벨 정보가 붙을수록 더 정확하게 해석할 수 있습니다.';
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
  statusLabel,
  statusClassName,
  children,
}: {
  title: string;
  description: string;
  statusLabel?: string;
  statusClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className="dot-card p-4 sm:p-5">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">
              {title}
            </p>
            <p className="text-xs text-dot-sub leading-relaxed">{description}</p>
          </div>
          {statusLabel ? (
            <span
              className={`rounded-sm border px-2 py-1 text-[10px] font-mono uppercase tracking-[0.14em] ${statusClassName ?? 'border-dot-border/40 text-dot-muted'}`}
            >
              {statusLabel}
            </span>
          ) : null}
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
              확정 강한 이벤트 {summary.alertStats.high}
            </span>
            <span className="rounded-sm border border-dot-yellow/30 bg-dot-yellow/10 px-2 py-1 text-dot-yellow">
              미확정 큰 거래 {summary.alertStats.medium}
            </span>
            <span className="rounded-sm border border-dot-green/30 bg-dot-green/10 px-2 py-1 text-dot-green">
              운영 알림 {summary.alertStats.info}
            </span>
          </div>
        </div>

        {summary.alerts.length === 0 ? (
          <p className="text-sm text-dot-muted leading-relaxed">
            최근 published alert가 없습니다. 새 이벤트가 들어오면 여기에서 시간순으로 확인합니다.
          </p>
        ) : (
          <div className="space-y-3">
            {summary.alerts.map((alert, index) => {
              const meta = severityMeta(alert.severity);
              const amountBtc = getAlertAmountBtc(alert);
              const explorerUrl = alert.relatedTxid
                ? `https://mempool.space/tx/${alert.relatedTxid}`
                : null;

              return (
                <details
                  key={`${alert.detectedAt}-${alert.alertType}-${alert.relatedTxid ?? 'none'}`}
                  className="rounded-sm border border-dot-border/40 bg-white/75 px-3 py-3 sm:px-4"
                  open={index === 0}
                >
                  <summary className="list-none cursor-pointer">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-[0.14em]">
                          <span className={`rounded-sm border px-2 py-1 ${meta.chipClass}`}>
                            {meta.label}
                          </span>
                          <span className="text-dot-muted">{formatDateTime(alert.detectedAt)}</span>
                          <span className="text-dot-muted break-all">
                            {formatAlertType(alert.alertType)}
                          </span>
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
                      <div className="min-w-0 rounded-sm border border-dot-border/30 bg-stone-50/80 px-3 py-2 text-[11px] font-mono text-dot-muted lg:w-[260px]">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-dot-muted">
                          Related Tx
                        </p>
                        <p className="mt-1 break-all text-dot-sub">
                          {truncateTxid(alert.relatedTxid)}
                        </p>
                        <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-dot-muted">
                          Amount
                        </p>
                        <p className="mt-1 break-all text-dot-sub">{formatBtcAmount(amountBtc)}</p>
                      </div>
                    </div>
                  </summary>

                  <div className="mt-3 grid gap-3 border-t border-dashed border-dot-border/40 pt-3 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="space-y-3">
                      <div className="rounded-sm border border-dot-border/30 bg-white/80 px-3 py-3">
                        <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-dot-muted">
                          Interpretation
                        </p>
                        <p className="mt-2 text-[11px] leading-relaxed text-dot-sub">
                          {getAlertInterpretation(alert)}
                        </p>
                      </div>
                      {explorerUrl ? (
                        <div className="rounded-sm border border-dot-border/30 bg-white/80 px-3 py-3">
                          <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-dot-muted">
                            Explorer
                          </p>
                          <a
                            href={explorerUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex text-[11px] font-mono text-dot-accent underline underline-offset-2"
                          >
                            mempool.space에서 보기
                          </a>
                        </div>
                      ) : null}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                      <div className="rounded-sm border border-dot-border/30 bg-white/80 px-3 py-3">
                        <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-dot-muted">
                          Raw Type
                        </p>
                        <p className="mt-2 text-[11px] break-all text-dot-sub">{alert.alertType}</p>
                      </div>
                      <div className="rounded-sm border border-dot-border/30 bg-white/80 px-3 py-3">
                        <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-dot-muted">
                          Entity
                        </p>
                        <p className="mt-2 text-[11px] break-all text-dot-sub">
                          {alert.relatedEntitySlug ?? '라벨 없음'}
                        </p>
                      </div>
                      <div className="rounded-sm border border-dot-border/30 bg-white/80 px-3 py-3">
                        <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-dot-muted">
                          Source
                        </p>
                        <p className="mt-2 text-[11px] break-all text-dot-sub">
                          {typeof alert.context.source === 'string' ? alert.context.source : 'bitflow_onchain'}
                        </p>
                      </div>
                    </div>
                  </div>
                </details>
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

  const nodePanelStatus = data ? panelStatusMeta('node', data.pipeline.states.node) : null;
  const indexerPanelStatus = data ? panelStatusMeta('indexer', data.pipeline.states.indexer) : null;
  const publishedPanelStatus = data
    ? panelStatusMeta('published', data.pipeline.states.published)
    : null;

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
              value={valueOrFallback(
                formatCount(data.pipeline.nodeTipHeight),
                fieldFallbackLabel('node', data.pipeline.states.node)
              )}
              hint="bitcoind가 검증한 최신 블록 높이"
            />
            <StatusCard
              label="Headers"
              value={valueOrFallback(
                formatCount(data.pipeline.headerHeight),
                fieldFallbackLabel('node', data.pipeline.states.node)
              )}
              hint="피어 네트워크에서 수신한 최신 헤더 높이"
            />
            <StatusCard
              label="Indexed Height"
              value={valueOrFallback(
                formatCount(data.pipeline.indexedHeight),
                fieldFallbackLabel('indexer', data.pipeline.states.indexer)
              )}
              hint="로컬 인덱서가 적재한 마지막 블록 높이"
            />
            <StatusCard
              label="Sync Progress"
              value={valueOrFallback(
                formatPercent(data.pipeline.syncPercent),
                data.pipeline.states.node !== 'ok'
                  ? fieldFallbackLabel('node', data.pipeline.states.node)
                  : fieldFallbackLabel('indexer', data.pipeline.states.indexer)
              )}
              hint={
                data.pipeline.lagBlocks !== null
                  ? `lag ${formatCount(data.pipeline.lagBlocks)} blocks`
                  : data.pipeline.states.node !== 'ok'
                  ? 'node RPC를 읽지 못해 계산하지 못했습니다.'
                  : '인덱서 상태를 읽지 못해 계산하지 못했습니다.'
              }
            />
          </div>

          <div className="grid gap-3 xl:grid-cols-3">
            <OpsPanel
              title="Node Runtime"
              description="현재 비트코인 노드의 동기화와 실행 모드를 확인합니다."
              statusLabel={nodePanelStatus?.label}
              statusClassName={nodePanelStatus?.className}
            >
              <KeyValueGrid
                items={[
                  {
                    label: 'IBD',
                    value: valueOrFallback(
                      formatBoolean(
                        data.pipeline.initialBlockDownload,
                        '초기 동기화 중',
                        '동기화 완료'
                      ),
                      fieldFallbackLabel('node', data.pipeline.states.node)
                    ),
                  },
                  {
                    label: 'Storage Mode',
                    value: valueOrFallback(
                      formatBoolean(data.pipeline.pruned, 'Pruned Node', 'Full Node'),
                      fieldFallbackLabel('node', data.pipeline.states.node)
                    ),
                  },
                  {
                    label: 'Prune Height',
                    value:
                      data.pipeline.pruned === false
                        ? '해당 없음'
                        : valueOrFallback(
                            formatCount(data.pipeline.pruneHeight),
                            fieldFallbackLabel('node', data.pipeline.states.node)
                          ),
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
              statusLabel={indexerPanelStatus?.label}
              statusClassName={indexerPanelStatus?.className}
            >
              <KeyValueGrid
                items={[
                  {
                    label: 'Indexed Day',
                    value: valueOrFallback(
                      formatDay(data.pipeline.latestIndexedDay),
                      fieldFallbackLabel('indexer', data.pipeline.states.indexer)
                    ),
                  },
                  {
                    label: 'Lag Blocks',
                    value: valueOrFallback(
                      formatCount(data.pipeline.lagBlocks),
                      data.pipeline.states.node !== 'ok'
                        ? fieldFallbackLabel('node', data.pipeline.states.node)
                        : fieldFallbackLabel('indexer', data.pipeline.states.indexer)
                    ),
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
                        : fieldFallbackLabel('node', data.pipeline.states.node),
                    hint: 'headers와 blocks 차이',
                  },
                  {
                    label: 'Sync Percent',
                    value: valueOrFallback(
                      formatPercent(data.pipeline.syncPercent),
                      data.pipeline.states.node !== 'ok'
                        ? fieldFallbackLabel('node', data.pipeline.states.node)
                        : fieldFallbackLabel('indexer', data.pipeline.states.indexer)
                    ),
                  },
                ]}
              />
            </OpsPanel>

            <OpsPanel
              title="Published Stream"
              description="웹이 읽는 published 테이블 상태와 알림 볼륨을 확인합니다."
              statusLabel={publishedPanelStatus?.label}
              statusClassName={publishedPanelStatus?.className}
            >
              <KeyValueGrid
                items={[
                  {
                    label: 'Source',
                    value: formatSource(data.pipeline.publishedSource),
                  },
                  {
                    label: 'Published Day',
                    value: valueOrFallback(
                      formatDay(data.pipeline.publishedLatestDay),
                      fieldFallbackLabel('published', data.pipeline.states.published)
                    ),
                  },
                  {
                    label: 'Published Status',
                    value: publishedStateLabel(data.pipeline.states.published),
                  },
                  {
                    label: 'Alert Total',
                    value:
                      data.pipeline.alertTotal > 0
                        ? formatCount(data.pipeline.alertTotal)
                        : fieldFallbackLabel('published', data.pipeline.states.published),
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
