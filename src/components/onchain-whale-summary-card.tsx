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

function formatHourLabel(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString('ko-KR', {
    hour: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul',
  });
}

const SLICE_META = {
  confirmed: {
    bar: 'bg-dot-accent',
    tone: 'text-dot-accent',
  },
  pending: {
    bar: 'bg-dot-yellow/80',
    tone: 'text-dot-yellow',
  },
  dormant: {
    bar: 'bg-dot-red/80',
    tone: 'text-dot-red',
  },
} as const;

export default function OnchainWhaleSummaryCard({
  summary,
}: OnchainWhaleSummaryCardProps) {
  const totalMoved = Math.max(summary.totalMovedBtc, 0);
  const maxBucketValue = Math.max(...summary.buckets.map((bucket) => bucket.movedBtc), 1);
  const largestMoveShare = totalMoved > 0 ? (summary.largestMoveBtc / totalMoved) * 100 : 0;

  return (
    <article className="dot-card h-full p-4 sm:p-5">
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

        <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-dot-muted">
              <span>이동 비중</span>
              <span>{summary.totalAlerts} alerts</span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-stone-100">
              {summary.slices.map((slice) => {
                const meta = SLICE_META[slice.key];
                const width = totalMoved > 0 ? (slice.movedBtc / totalMoved) * 100 : 0;

                return (
                  <div
                    key={slice.key}
                    className={meta.bar}
                    style={{ width: `${width}%`, minWidth: width > 0 ? '6px' : '0px' }}
                  />
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
            {summary.slices.map((slice) => {
              const meta = SLICE_META[slice.key];
              const share = totalMoved > 0 ? (slice.movedBtc / totalMoved) * 100 : 0;

              return (
                <div key={slice.key} className="rounded-sm border border-dot-border/30 bg-white/80 px-3 py-2">
                  <p className="text-[10px] text-dot-muted">{slice.label}</p>
                  <p className={`mt-1 ${meta.tone}`}>{share.toFixed(0)}%</p>
                  <p className="text-[10px] text-dot-muted">{slice.count}건 · {formatBtc(slice.movedBtc)}</p>
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-dot-muted">
              <span>최근 24시간 활동 히스토그램</span>
              <span>3h bins</span>
            </div>
            <div className="flex h-24 items-end gap-1">
              {summary.buckets.map((bucket) => {
                const height =
                  bucket.movedBtc > 0
                    ? Math.max((bucket.movedBtc / maxBucketValue) * 100, 8)
                    : 6;
                const active = bucket.alertCount > 0;

                return (
                  <div key={bucket.startAt} className="flex flex-1 flex-col items-center justify-end gap-1">
                    <div className="group relative flex w-full justify-center">
                      <div className="absolute -top-8 rounded-sm bg-dot-accent px-1.5 py-0.5 text-[9px] font-mono text-white opacity-0 transition group-hover:opacity-100">
                        {bucket.alertCount}건 · {formatBtc(bucket.movedBtc)}
                      </div>
                      <div
                        className={`w-full rounded-t-sm ${active ? 'bg-dot-accent/85' : 'bg-dot-border/25'}`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-dot-muted">{formatHourLabel(bucket.startAt)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 rounded-sm border border-dot-border/30 bg-white/80 px-3 py-3">
            <div className="flex items-center justify-between gap-3 text-[11px] font-mono">
              <span className="text-dot-muted">largest move</span>
              <span className="text-dot-accent">{formatBtc(summary.largestMoveBtc)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-dot-accent"
                style={{ width: `${Math.max(largestMoveShare, summary.largestMoveBtc > 0 ? 6 : 0)}%` }}
              />
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
        </div>

        <p className="dot-insight">
          스택 바는 이동 비중을, 히스토그램은 최근 24시간 동안 활동이 어느 구간에 몰렸는지 보여줍니다.
        </p>
      </div>
    </article>
  );
}
