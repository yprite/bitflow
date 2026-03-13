'use client';

import type { CompositeSignal } from '@/lib/types';
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

export default function SignalBadge({ signal }: SignalBadgeProps) {
  const color = getColor(signal.level);

  return (
    <div className="dot-card p-4 sm:p-5 relative overflow-hidden">
      {/* Animated signal intensity field */}
      <SignalField level={signal.level} width={240} height={120} />

      <div className="dot-card-inner">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <LivePulse size={4} color={color} />
          복합 시그널
        </h2>
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
