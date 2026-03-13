'use client';

import type { CompositeSignal, SignalFactor } from '@/lib/types';
import InsightBloom from './motion/indicators/InsightBloom';
import SignalField from './motion/indicators/SignalField';
import DotMorphTransition from './motion/transitions/DotMorphTransition';
import LivePulse from './motion/indicators/LivePulse';

interface SignalBadgeProps {
  signal: CompositeSignal;
}

function getColor(level: string): string {
  switch (level) {
    case '과열': return '#e53935';
    case '침체': return '#1e88e5';
    default: return '#9ca3af';
  }
}

function getFactorColor(direction: string): string {
  switch (direction) {
    case '과열': return '#e53935';
    case '침체': return '#1e88e5';
    default: return '#6b7280';
  }
}

function getFactorArrow(direction: string): string {
  switch (direction) {
    case '과열': return '▲';
    case '침체': return '▼';
    default: return '—';
  }
}

function getLevelLabel(level: string): string {
  switch (level) {
    case '과열': return '과열';
    case '침체': return '침체';
    default: return '중립';
  }
}

function ScoreGauge({ score }: { score: number }) {
  // score ranges from -6 to +6, map to 0-100%
  const pct = Math.max(0, Math.min(100, ((score + 6) / 12) * 100));
  const color = score >= 3 ? '#e53935' : score <= -3 ? '#1e88e5' : '#6b7280';

  return (
    <div className="w-full mt-2 mb-1">
      <div className="relative h-1.5 rounded-full bg-dot-border/30 overflow-hidden">
        {/* Zone markers */}
        <div className="absolute left-[25%] top-0 bottom-0 w-px bg-dot-border/20" />
        <div className="absolute left-[75%] top-0 bottom-0 w-px bg-dot-border/20" />
        {/* Indicator dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full transition-all duration-700 ease-out"
          style={{
            left: `calc(${pct}% - 5px)`,
            backgroundColor: color,
            boxShadow: `0 0 6px ${color}60`,
          }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-blue-400/60 font-mono">침체</span>
        <span className="text-[9px] text-dot-muted/40 font-mono">중립</span>
        <span className="text-[9px] text-red-400/60 font-mono">과열</span>
      </div>
    </div>
  );
}

function FactorRow({ factor }: { factor: SignalFactor }) {
  const color = getFactorColor(factor.direction);
  const arrow = getFactorArrow(factor.direction);

  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[10px] text-dot-muted">{factor.label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-mono text-dot-sub">{factor.value}</span>
        <span className="text-[9px]" style={{ color }}>{arrow}</span>
      </div>
    </div>
  );
}

export default function SignalBadge({ signal }: SignalBadgeProps) {
  const color = getColor(signal.level);
  const levelLabel = getLevelLabel(signal.level);

  return (
    <div className="dot-card p-4 sm:p-5 relative overflow-hidden">
      {/* Animated signal intensity field */}
      <SignalField level={signal.level} width={240} height={120} />

      <div className="dot-card-inner">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <LivePulse size={4} color={color} />
          시장 온도
        </h2>
        <p className="text-[10px] text-dot-muted/60 mb-3">김프 + 펀딩비 + 공포탐욕 종합</p>

        <div className="relative">
          <DotMorphTransition
            text={levelLabel}
            fontScale={5}
            mode="dissolve"
            morphDuration={600}
            color={color}
          />
          <InsightBloom trigger={signal.level} dotCount={5} travelDistance={18} dotSize={2} color={color} />
        </div>

        <ScoreGauge score={signal.score} />

        {/* Factor breakdown */}
        <div className="mt-2 pt-2 border-t border-dot-border/20 space-y-0.5">
          {signal.factors.map((f) => (
            <FactorRow key={f.label} factor={f} />
          ))}
        </div>

        <p className="text-[11px] text-dot-muted mt-2.5 leading-relaxed">{signal.description}</p>
      </div>
    </div>
  );
}
