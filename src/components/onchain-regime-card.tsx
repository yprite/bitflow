import type { OnchainRegimeSummary } from '@/lib/types';

interface OnchainRegimeCardProps {
  regime: OnchainRegimeSummary;
}

const TONE_META: Record<
  OnchainRegimeSummary['tone'],
  { badge: string; text: string; label: string }
> = {
  expansion: {
    badge: 'border-dot-green/30 bg-dot-green/10 text-dot-green',
    text: 'text-dot-green',
    label: '확장 신호',
  },
  neutral: {
    badge: 'border-dot-border/40 bg-white/80 text-dot-muted',
    text: 'text-dot-accent',
    label: '균형 구간',
  },
  contraction: {
    badge: 'border-dot-red/30 bg-dot-red/10 text-dot-red',
    text: 'text-dot-red',
    label: '위축 신호',
  },
};

export default function OnchainRegimeCard({ regime }: OnchainRegimeCardProps) {
  const tone = TONE_META[regime.tone];

  return (
    <article className="dot-card p-4 sm:p-5">
      <div className="dot-card-inner space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">
              On-chain Regime
            </p>
            <h2 className={`text-lg font-semibold tracking-tight ${tone.text}`}>{regime.label}</h2>
          </div>
          <div className="text-right">
            <span className={`inline-flex rounded-sm border px-2 py-1 text-[10px] font-mono uppercase tracking-[0.14em] ${tone.badge}`}>
              {tone.label}
            </span>
            <p className="mt-2 text-[10px] font-mono text-dot-muted">
              score {regime.score > 0 ? '+' : ''}
              {regime.score.toFixed(1)}
            </p>
          </div>
        </div>

        <p className="text-xs text-dot-sub leading-relaxed">{regime.summary}</p>

        <div className="space-y-2">
          {regime.drivers.map((driver) => (
            <div
              key={driver}
              className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-2 text-[11px] leading-relaxed text-dot-sub"
            >
              {driver}
            </div>
          ))}
        </div>

        <p className="dot-insight">
          네트워크 활동 확장과 분배 신호를 함께 반영한 운영용 해석 배지입니다.
        </p>
      </div>
    </article>
  );
}
