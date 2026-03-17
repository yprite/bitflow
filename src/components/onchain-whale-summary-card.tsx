import type { OnchainWhaleSummary } from '@/lib/types';

interface OnchainWhaleSummaryCardProps {
  summary: OnchainWhaleSummary;
}

function formatBtc(value: number): string {
  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: value >= 100 ? 0 : 1,
    maximumFractionDigits: value >= 100 ? 0 : 1,
  })} BTC`;
}

function formatDateTime(value: string | null): string {
  if (!value) return '최근 감지 없음';
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

function formatDominantType(value: string | null): string {
  if (value === 'large_confirmed_spend') return '확정 대형 이동 우세';
  if (value === 'mempool_large_tx') return '미확정 대형 이동 우세';
  if (value === 'dormant_reactivation') return '휴면 재활성 우세';
  return '대형 이동 감지 없음';
}

export default function OnchainWhaleSummaryCard({
  summary,
}: OnchainWhaleSummaryCardProps) {
  return (
    <article className="dot-card p-4 sm:p-5">
      <div className="dot-card-inner space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">
              Whale Summary
            </p>
            <h2 className="text-lg font-semibold text-dot-accent tracking-tight">
              {formatBtc(summary.totalMovedBtc)}
            </h2>
          </div>
          <span className="text-[10px] font-mono text-dot-muted">
            최근 {summary.windowHours}h
          </span>
        </div>

        <p className="text-xs text-dot-sub leading-relaxed">
          확정 이동, mempool 대기 이동, 휴면 재활성 중 어떤 흐름이 우세한지 빠르게 보여줍니다.
        </p>

        <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
          <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-2">
            <p className="text-[10px] text-dot-muted">확정</p>
            <p className="mt-1 text-dot-accent">{summary.confirmedCount}건</p>
            <p className="text-[10px] text-dot-muted">{formatBtc(summary.confirmedMovedBtc)}</p>
          </div>
          <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-2">
            <p className="text-[10px] text-dot-muted">미확정</p>
            <p className="mt-1 text-dot-accent">{summary.pendingCount}건</p>
            <p className="text-[10px] text-dot-muted">{formatBtc(summary.pendingMovedBtc)}</p>
          </div>
          <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-2">
            <p className="text-[10px] text-dot-muted">휴면</p>
            <p className="mt-1 text-dot-accent">{summary.dormantCount}건</p>
            <p className="text-[10px] text-dot-muted">{formatBtc(summary.dormantMovedBtc)}</p>
          </div>
        </div>

        <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3 space-y-2">
          <div className="flex items-center justify-between gap-3 text-[11px] font-mono">
            <span className="text-dot-muted">largest move</span>
            <span className="text-dot-accent">{formatBtc(summary.largestMoveBtc)}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-[11px] font-mono">
            <span className="text-dot-muted">dominant flow</span>
            <span className="text-dot-sub">{formatDominantType(summary.dominantAlertType)}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-[11px] font-mono">
            <span className="text-dot-muted">latest</span>
            <span className="text-dot-sub">{formatDateTime(summary.latestDetectedAt)}</span>
          </div>
        </div>

        <p className="dot-insight">
          대형 이동은 단독 시그널보다 활동 지표와 함께 볼 때 해석력이 높습니다.
        </p>
      </div>
    </article>
  );
}
