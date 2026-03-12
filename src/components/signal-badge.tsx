'use client';

import type { CompositeSignal } from '@/lib/types';

interface SignalBadgeProps {
  signal: CompositeSignal;
}

function getBgColor(level: string): string {
  switch (level) {
    case '과열': return 'bg-red-900/40 border-red-700';
    case '침체': return 'bg-blue-900/40 border-blue-700';
    default: return 'bg-gray-800/40 border-gray-700';
  }
}

export default function SignalBadge({ signal }: SignalBadgeProps) {
  return (
    <div className={`rounded-2xl border p-6 ${getBgColor(signal.level)}`}>
      <h2 className="text-sm font-medium text-gray-400 mb-2">복합 시그널</h2>
      <p className={`text-3xl font-bold ${signal.color}`}>
        {signal.level}
      </p>
      <p className="text-sm text-gray-400 mt-2">{signal.description}</p>
    </div>
  );
}
