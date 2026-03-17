import type { OnchainAgeBandSummary } from '@/lib/types';

interface OnchainAgeBandCardProps {
  data: OnchainAgeBandSummary;
}

const TONE_META = {
  rotation: {
    badge: 'border-dot-yellow/30 bg-dot-yellow/10 text-dot-yellow',
    label: '회전 강화',
  },
  balanced: {
    badge: 'border-dot-border/40 bg-white/80 text-dot-muted',
    label: '균형',
  },
  dormant: {
    badge: 'border-dot-green/30 bg-dot-green/10 text-dot-green',
    label: '장기 보유 우세',
  },
} as const;

const SEGMENT_META = {
  hot: 'bg-dot-yellow/80',
  warm: 'bg-dot-accent/80',
  cold: 'bg-dot-green/80',
} as const;

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatBtc(value: number | null): string {
  if (value === null) return 'N/A';
  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: value >= 100 ? 0 : 1,
    maximumFractionDigits: value >= 100 ? 0 : 1,
  })} BTC`;
}

export default function OnchainAgeBandCard({ data }: OnchainAgeBandCardProps) {
  const tone = TONE_META[data.tone];

  return (
    <article className="dot-card h-full p-4 sm:p-5">
      <div className="dot-card-inner space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">
              Age-band Cohort
            </p>
            <h2 className="text-lg font-semibold tracking-tight text-dot-accent">
              {data.label}
            </h2>
          </div>
          <span className={`inline-flex rounded-sm border px-2 py-1 text-[10px] font-mono uppercase tracking-[0.14em] ${tone.badge}`}>
            {tone.label}
          </span>
        </div>

        <p className="text-xs leading-relaxed text-dot-sub">{data.summary}</p>

        <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-dot-muted">
              <span>활동 공급 밴드</span>
              <span>30D / 90D proxy</span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-stone-100">
              {data.segments.map((segment) => (
                <div
                  key={segment.key}
                  className={SEGMENT_META[segment.key]}
                  style={{ width: `${Math.max(segment.share, segment.share > 0 ? 4 : 0)}%` }}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-2 text-[11px] font-mono">
            {data.segments.map((segment) => (
              <div key={segment.key} className="rounded-sm border border-dot-border/30 bg-white/80 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-dot-sub">{segment.label}</p>
                  <p className="text-dot-accent">{formatPercent(segment.share)}</p>
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-dot-muted">{segment.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
          <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-2">
            <p className="text-[10px] text-dot-muted">30D 활동</p>
            <p className="mt-1 text-dot-accent">{formatPercent(data.active30d)}</p>
          </div>
          <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-2">
            <p className="text-[10px] text-dot-muted">90D 활동</p>
            <p className="mt-1 text-dot-accent">{formatPercent(data.active90d)}</p>
          </div>
          <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-2">
            <p className="text-[10px] text-dot-muted">휴면 이동</p>
            <p className="mt-1 text-dot-accent">{formatBtc(data.dormantMovedBtc)}</p>
          </div>
        </div>

        <p className="dot-insight">
          실제 LTH/STH 원가 밴드는 아니고, 최근 30일과 90일 활동 공급으로 나눈 age-band proxy입니다.
        </p>
      </div>
    </article>
  );
}
