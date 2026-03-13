'use client';

import type { CompositeSignal } from '@/lib/types';
import InsightBloom from './motion/indicators/InsightBloom';
import SignalField from './motion/indicators/SignalField';
import DotMorphTransition from './motion/transitions/DotMorphTransition';

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

export default function SignalBadge({ signal }: SignalBadgeProps) {
  const color = getColor(signal.level);

  return (
    <div className="dot-card p-5 relative overflow-hidden">
      {/* Animated signal intensity field */}
      <SignalField level={signal.level} width={80} height={80} />

      <div className="dot-card-inner">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-3">복합 시그널</h2>
        <div className="relative">
          <DotMorphTransition
            text={signal.level}
            fontScale={5}
            mode="dissolve"
            morphDuration={600}
            color={color}
          />
          <InsightBloom trigger={signal.level} dotCount={5} travelDistance={18} dotSize={2} color={color} />
        </div>
        <p className="text-xs text-dot-muted mt-2">{signal.description}</p>
      </div>
    </div>
  );
}
