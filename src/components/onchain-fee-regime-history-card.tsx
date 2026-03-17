import type { OnchainFeeRegimeHistoryData } from '@/lib/types';

interface OnchainFeeRegimeHistoryCardProps {
  data: OnchainFeeRegimeHistoryData;
}

const TONE_META = {
  relief: {
    badge: 'border-dot-green/30 bg-dot-green/10 text-dot-green',
    label: '완화',
    bar: 'bg-dot-green/80',
  },
  balanced: {
    badge: 'border-dot-yellow/30 bg-dot-yellow/10 text-dot-yellow',
    label: '균형',
    bar: 'bg-dot-yellow/80',
  },
  hot: {
    badge: 'border-dot-red/30 bg-dot-red/10 text-dot-red',
    label: '혼잡',
    bar: 'bg-dot-red/80',
  },
} as const;

function formatFee(value: number): string {
  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: value < 1 ? 2 : 1,
    maximumFractionDigits: value < 1 ? 2 : 1,
  })} sat/vB`;
}

export default function OnchainFeeRegimeHistoryCard({
  data,
}: OnchainFeeRegimeHistoryCardProps) {
  const tone = TONE_META[data.tone];
  const maxFee = Math.max(...data.points.map((point) => point.medianFee), data.latestMedianFee, 1);

  return (
    <article className="dot-card h-full p-4 sm:p-5">
      <div className="dot-card-inner space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">
              Fee Regime History
            </p>
            <h2 className="text-lg font-semibold tracking-tight text-dot-accent">
              {formatFee(data.latestMedianFee)}
            </h2>
          </div>
          <div className="text-right">
            <span className={`inline-flex rounded-sm border px-2 py-1 text-[10px] font-mono uppercase tracking-[0.14em] ${tone.badge}`}>
              {tone.label}
            </span>
            <p className="mt-2 text-[10px] font-mono text-dot-muted">{data.trend}</p>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-dot-sub">{data.summary}</p>

        <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-dot-muted">
            <span>최근 블록 fee regime</span>
            <span>{data.points.length} blocks</span>
          </div>
          <div className="grid h-24 grid-cols-12 items-end gap-1">
            {data.points.map((point, index) => {
              const height = Math.max((point.medianFee / maxFee) * 100, point.medianFee > 0 ? 8 : 5);

              return (
                <div key={point.height} className="flex h-full flex-col items-center justify-end gap-1">
                  <div className="flex h-20 w-full items-end">
                    <div
                      className={`w-full rounded-t-sm ${tone.bar}`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-dot-muted">
                    {index === 0 || index === data.points.length - 1 ? String(point.height).slice(-3) : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
          <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-2">
            <p className="text-[10px] text-dot-muted">최근값</p>
            <p className="mt-1 text-dot-accent">{formatFee(data.latestMedianFee)}</p>
          </div>
          <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-2">
            <p className="text-[10px] text-dot-muted">평균</p>
            <p className="mt-1 text-dot-accent">{formatFee(data.averageMedianFee)}</p>
          </div>
          <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-2">
            <p className="text-[10px] text-dot-muted">피크</p>
            <p className="mt-1 text-dot-accent">{formatFee(data.peakMedianFee)}</p>
          </div>
        </div>

        <p className="dot-insight">
          현재 fee pressure 한 점이 아니라, 최근 여러 블록에서 수수료 경쟁이 계속 올라오는지 내려오는지 보여줍니다.
        </p>
      </div>
    </article>
  );
}
