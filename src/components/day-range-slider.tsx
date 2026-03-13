'use client';

import type { DayRange } from './data-provider';

interface DayRangeSliderProps {
  range: DayRange;
  decimals?: number;
  suffix?: string;
}

export default function DayRangeSlider({ range, decimals = 2, suffix = '' }: DayRangeSliderProps) {
  const { min, max, current } = range;
  const span = max - min;
  const pct = span > 0 ? Math.max(0, Math.min(100, ((current - min) / span) * 100)) : 50;

  return (
    <div className="mt-3 pt-3 border-t border-dot-border/20">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] text-dot-muted font-mono">오늘 범위</span>
      </div>
      <div className="relative h-1 rounded-full bg-dot-border/30 overflow-visible">
        {/* Range bar fill */}
        <div className="absolute inset-0 rounded-full bg-dot-border/20" />
        {/* Current position dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-dot-accent transition-all duration-700 ease-out"
          style={{
            left: `calc(${pct}% - 4px)`,
            boxShadow: '0 0 4px rgba(0,0,0,0.15)',
          }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-dot-muted/60 font-mono">
          {min.toFixed(decimals)}{suffix}
        </span>
        <span className="text-[9px] text-dot-muted/60 font-mono">
          {max.toFixed(decimals)}{suffix}
        </span>
      </div>
    </div>
  );
}
