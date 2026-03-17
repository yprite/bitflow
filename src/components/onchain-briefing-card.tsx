import type { OnchainBriefingData } from '@/lib/types';

interface OnchainBriefingCardProps {
  briefing: OnchainBriefingData;
}

const TONE_META = {
  expansion: {
    badge: 'border-dot-green/30 bg-dot-green/10 text-dot-green',
    label: '확장 해석',
  },
  neutral: {
    badge: 'border-dot-border/40 bg-white/80 text-dot-muted',
    label: '균형 해석',
  },
  contraction: {
    badge: 'border-dot-red/30 bg-dot-red/10 text-dot-red',
    label: '보수 해석',
  },
} as const;

export default function OnchainBriefingCard({ briefing }: OnchainBriefingCardProps) {
  const tone = TONE_META[briefing.tone];

  return (
    <section className="dot-card p-4 sm:p-5">
      <div className="dot-card-inner space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">
              On-chain Briefing
            </p>
            <h2 className="text-lg font-semibold tracking-tight text-dot-accent">
              {briefing.headline}
            </h2>
          </div>
          <span className={`inline-flex rounded-sm border px-2 py-1 text-[10px] font-mono uppercase tracking-[0.14em] ${tone.badge}`}>
            {tone.label}
          </span>
        </div>

        <p className="text-xs leading-relaxed text-dot-sub">{briefing.summary}</p>

        <div className="grid gap-2 lg:grid-cols-2">
          {briefing.bullets.map((bullet, index) => (
            <div
              key={`${index}-${bullet}`}
              className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3 text-[11px] leading-relaxed text-dot-sub"
            >
              <span className="mr-2 font-mono text-dot-muted/60">{String(index + 1).padStart(2, '0')}</span>
              {bullet}
            </div>
          ))}
        </div>

        <p className="dot-insight">다음 체크: {briefing.watchLabel}</p>
      </div>
    </section>
  );
}
