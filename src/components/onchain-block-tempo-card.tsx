import type { OnchainBlockTempoData } from '@/lib/types';

interface OnchainBlockTempoCardProps {
  data: OnchainBlockTempoData;
}

function formatRelativeMinutes(value: number): string {
  if (value < 1) return '방금';
  if (value < 60) return `${Math.round(value)}분 전`;
  return `${(value / 60).toFixed(1)}시간 전`;
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

export default function OnchainBlockTempoCard({ data }: OnchainBlockTempoCardProps) {
  const progress = Math.min(Math.max(data.difficultyProgress, 0), 100);
  const difficultyTone =
    data.difficultyChange >= 0 ? 'text-dot-green' : data.difficultyChange <= -5 ? 'text-dot-red' : 'text-dot-yellow';

  return (
    <article className="dot-card p-4 sm:p-5">
      <div className="dot-card-inner space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">
              Block Tempo
            </p>
            <h2 className="text-lg font-semibold text-dot-accent tracking-tight">
              {formatRelativeMinutes(data.minutesSinceLastBlock)}
            </h2>
          </div>
          <span className="text-[10px] font-mono text-dot-muted">
            #{data.currentHeight.toLocaleString('ko-KR')}
          </span>
        </div>

        <p className="text-xs text-dot-sub leading-relaxed">
          마지막 블록과 difficulty epoch 진행률을 기준으로 최근 네트워크 리듬을 읽습니다.
        </p>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-2">
            <p className="text-[10px] text-dot-muted">최근 8블록 평균</p>
            <p className="mt-1 text-dot-accent">{data.averageBlockMinutes.toFixed(1)}분</p>
          </div>
          <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-2">
            <p className="text-[10px] text-dot-muted">최신 블록 tx</p>
            <p className="mt-1 text-dot-accent">{data.latestBlockTxCount.toLocaleString('ko-KR')}</p>
          </div>
        </div>

        <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-dot-muted">
            <span>Difficulty Epoch</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <div className="h-2 rounded-full bg-dot-border/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-dot-accent/80"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className={difficultyTone}>
              {data.difficultyChange > 0 ? '+' : ''}
              {data.difficultyChange.toFixed(2)}%
            </span>
            <span className="text-dot-muted">
              {data.remainingBlocksToAdjustment.toLocaleString('ko-KR')} blocks left
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 text-[11px] font-mono">
          <span className="text-dot-muted">{formatDateTime(data.latestBlockAt)}</span>
          {data.estimatedRetargetAt ? (
            <span className="text-dot-muted">retarget {formatDateTime(data.estimatedRetargetAt)}</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
