'use client';

import type { CompositeSignal } from '@/lib/types';

interface SignalBadgeProps {
  signal: CompositeSignal;
}

function getDotPattern(level: string): { color: string; density: number } {
  switch (level) {
    case '과열': return { color: '#e53935', density: 8 };
    case '침체': return { color: '#1e88e5', density: 8 };
    default: return { color: '#9ca3af', density: 4 };
  }
}

export default function SignalBadge({ signal }: SignalBadgeProps) {
  const { color, density } = getDotPattern(signal.level);

  return (
    <div className="dot-card p-5 relative overflow-hidden">
      {/* Halftone pattern overlay in corner */}
      <div
        className="absolute top-0 right-0 w-20 h-20 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle, ${color} 2px, transparent 2px)`,
          backgroundSize: `${12 - density}px ${12 - density}px`,
        }}
      />
      <div className="dot-card-inner">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-3">복합 시그널</h2>
        <p className="text-2xl font-bold" style={{ color }}>
          {signal.level}
        </p>
        <p className="text-xs text-dot-muted mt-2">{signal.description}</p>
      </div>
    </div>
  );
}
