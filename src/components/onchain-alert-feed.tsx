import type { OnchainAlertEvent, OnchainAlertStats } from '@/lib/types';

interface OnchainAlertFeedProps {
  alerts: OnchainAlertEvent[];
  stats: OnchainAlertStats;
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

function severityMeta(severity: string) {
  if (severity === 'high') {
    return { label: '확정 강한 이벤트', dot: '#d63939', tone: 'text-dot-red' };
  }

  if (severity === 'medium') {
    return { label: '미확정 큰 거래', dot: '#f59e0b', tone: 'text-dot-yellow' };
  }

  return { label: '운영 알림', dot: '#275649', tone: 'text-dot-green' };
}

function formatAlertType(alertType: string): string {
  if (alertType === 'large_confirmed_spend') return '확정 대형 이동';
  if (alertType === 'dormant_reactivation') return '휴면 코인 재활성';
  if (alertType === 'mempool_large_tx') return '미확정 대형 이동';
  if (alertType === 'new_block') return '새 블록';
  return alertType;
}

function truncateTxid(txid: string | null): string {
  if (!txid) return '';
  return `${txid.slice(0, 8)}…${txid.slice(-6)}`;
}

export default function OnchainAlertFeed({
  alerts,
  stats,
}: OnchainAlertFeedProps) {
  return (
    <section className="dot-card p-4 sm:p-5">
      <div className="dot-card-inner space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">
              Alert Feed
            </p>
            <h2 className="text-sm font-semibold text-dot-accent tracking-tight">
              최근 온체인 알림
            </h2>
          </div>
          <div className="text-right text-[10px] font-mono text-dot-muted">
            <p>{stats.total} events</p>
            <p>확정 {stats.high} / 미확정 {stats.medium} / 운영 {stats.info}</p>
          </div>
        </div>

        {alerts.length === 0 ? (
          <p className="text-sm text-dot-muted leading-relaxed">
            현재 감지된 이상 거래가 없습니다. 고액 이동이나 휴면 코인 재활성 등 주요 이벤트가 발생하면 여기에 표시됩니다.
          </p>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => {
              const meta = severityMeta(alert.severity);

              return (
                <article
                  key={`${alert.detectedAt}-${alert.alertType}-${alert.relatedTxid ?? 'none'}`}
                  className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: meta.dot }}
                        />
                        <span className={`text-[10px] font-mono ${meta.tone}`}>{meta.label}</span>
                        <span className="text-[10px] font-mono text-dot-muted">
                          {formatDateTime(alert.detectedAt)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-dot-text">{alert.title}</p>
                      <p className="text-xs text-dot-sub leading-relaxed">{alert.body}</p>
                    </div>
                    <div className="shrink-0 text-right text-[10px] font-mono text-dot-muted">
                      <p>{formatAlertType(alert.alertType)}</p>
                      {alert.relatedTxid ? <p>{truncateTxid(alert.relatedTxid)}</p> : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <p className="dot-insight">
          고액 이동, 휴면 코인 재활성, mempool 이벤트를 한 피드에서 확인할 수 있게 설계했습니다.
        </p>
      </div>
    </section>
  );
}
