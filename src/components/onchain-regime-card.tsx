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
  const clampedScore = Math.max(Math.min(regime.score, 3), -3);
  const gaugePosition = ((clampedScore + 3) / 6) * 100;
  const maxAbsFactor = Math.max(...regime.factors.map((factor) => Math.abs(factor.contribution)), 1);

  return (
    <article className="dot-card h-full p-4 sm:p-5">
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

        <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-dot-muted">
              <span>위축</span>
              <span>중립</span>
              <span>확장</span>
            </div>
            <div className="relative h-2 rounded-full bg-gradient-to-r from-red-100 via-stone-200 to-emerald-100">
              <div className="absolute inset-y-[-3px] left-1/2 w-px bg-dot-border/70" />
              <div
                className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 bg-white shadow-sm ${regime.tone === 'expansion' ? 'border-dot-green' : regime.tone === 'contraction' ? 'border-dot-red' : 'border-dot-accent'}`}
                style={{ left: `calc(${gaugePosition}% - 8px)` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            {regime.factors.map((factor) => {
              const width = Math.max((Math.abs(factor.contribution) / maxAbsFactor) * 50, factor.contribution === 0 ? 2 : 8);
              const isPositive = factor.contribution > 0;

              return (
                <div key={`${factor.label}-${factor.detail}`} className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-[10px] font-mono">
                    <span className="text-dot-sub">{factor.label}</span>
                    <span className={isPositive ? 'text-dot-green' : factor.contribution < 0 ? 'text-dot-red' : 'text-dot-muted'}>
                      {factor.contribution > 0 ? '+' : ''}
                      {factor.contribution.toFixed(1)}
                    </span>
                  </div>
                  <div className="relative h-7 rounded-sm border border-dot-border/30 bg-stone-50/80">
                    <div className="absolute inset-y-0 left-1/2 w-px bg-dot-border/70" />
                    <div
                      className={`absolute top-1/2 h-3 -translate-y-1/2 rounded-full ${isPositive ? 'bg-dot-green/80' : factor.contribution < 0 ? 'bg-dot-red/80' : 'bg-dot-border/70'}`}
                      style={
                        isPositive
                          ? { left: '50%', width: `${width}%` }
                          : factor.contribution < 0
                          ? { left: `calc(50% - ${width}%)`, width: `${width}%` }
                          : { left: 'calc(50% - 1%)', width: '2%' }
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

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
          게이지는 현재 레짐 위치를, 기여도 막대는 어떤 요인이 확장/위축 쪽으로 점수를 밀고 있는지 보여줍니다.
        </p>
      </div>
    </article>
  );
}
