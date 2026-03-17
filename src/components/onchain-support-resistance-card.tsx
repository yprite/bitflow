import type { OnchainSupportResistanceSummary } from '@/lib/types';

interface OnchainSupportResistanceCardProps {
  data: OnchainSupportResistanceSummary;
}

const TONE_META = {
  supportive: {
    badge: 'border-dot-green/30 bg-dot-green/10 text-dot-green',
    label: '하단 지지 우세',
  },
  neutral: {
    badge: 'border-dot-border/40 bg-white/80 text-dot-muted',
    label: '중립',
  },
  capped: {
    badge: 'border-dot-red/30 bg-dot-red/10 text-dot-red',
    label: '상단 부담',
  },
} as const;

function formatUsd(value: number): string {
  return `$${value.toLocaleString('en-US', {
    maximumFractionDigits: 0,
  })}`;
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export default function OnchainSupportResistanceCard({
  data,
}: OnchainSupportResistanceCardProps) {
  const tone = TONE_META[data.tone];
  const range = Math.max(data.periodHighUsd - data.periodLowUsd, 1);
  const currentPosition = ((data.currentPriceUsd - data.periodLowUsd) / range) * 100;
  const supportPosition = ((data.supportUsd - data.periodLowUsd) / range) * 100;
  const resistancePosition = ((data.resistanceUsd - data.periodLowUsd) / range) * 100;

  return (
    <article className="dot-card h-full p-4 sm:p-5">
      <div className="dot-card-inner space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">
              Support / Resistance Proxy
            </p>
            <h2 className="text-lg font-semibold tracking-tight text-dot-accent">
              {formatUsd(data.currentPriceUsd)}
            </h2>
          </div>
          <span className={`inline-flex rounded-sm border px-2 py-1 text-[10px] font-mono uppercase tracking-[0.14em] ${tone.badge}`}>
            {tone.label}
          </span>
        </div>

        <p className="text-xs leading-relaxed text-dot-sub">{data.summary}</p>

        <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3 space-y-3">
          <div className="flex items-center justify-between text-[10px] font-mono text-dot-muted">
            <span>{data.windowDays}D price range + on-chain tone</span>
            <span>{formatUsd(data.periodLowUsd)} - {formatUsd(data.periodHighUsd)}</span>
          </div>

          <div className="relative h-12 rounded-sm border border-dot-border/30 bg-stone-50/80">
            <div className="absolute inset-y-0 left-0 w-px bg-dot-border/40" />
            <div className="absolute inset-y-0 right-0 w-px bg-dot-border/40" />
            <div
              className="absolute top-2 bottom-2 rounded-sm bg-dot-green/12"
              style={{ left: `${Math.max(Math.min(supportPosition - 4, 96), 0)}%`, width: '8%' }}
            />
            <div
              className="absolute top-2 bottom-2 rounded-sm bg-dot-red/12"
              style={{ left: `${Math.max(Math.min(resistancePosition - 4, 96), 0)}%`, width: '8%' }}
            />
            <div
              className="absolute top-1/2 h-5 w-1.5 -translate-y-1/2 rounded-full bg-dot-accent"
              style={{ left: `calc(${Math.max(Math.min(currentPosition, 100), 0)}% - 3px)` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="rounded-sm border border-dot-border/30 bg-white/80 px-3 py-2">
              <p className="text-[10px] text-dot-muted">Support</p>
              <p className="mt-1 text-dot-green">{formatUsd(data.supportUsd)}</p>
              <p className="text-[10px] text-dot-muted">{formatPercent(-data.supportDistancePercent)}</p>
            </div>
            <div className="rounded-sm border border-dot-border/30 bg-white/80 px-3 py-2">
              <p className="text-[10px] text-dot-muted">Resistance</p>
              <p className="mt-1 text-dot-red">{formatUsd(data.resistanceUsd)}</p>
              <p className="text-[10px] text-dot-muted">{formatPercent(data.resistanceDistancePercent)}</p>
            </div>
          </div>
        </div>

        <p className="dot-insight">
          이 카드는 실제 wallet cost-basis 분포가 아니라 최근 30일 가격 범위와 현재 온체인 압력을 조합한 참고 레벨입니다.
        </p>
      </div>
    </article>
  );
}
