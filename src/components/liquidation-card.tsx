'use client';

import type { LiquidationData } from '@/lib/types';
import type { DayRange } from './data-provider';
import DotKPIValue from './motion/typography/DotKPIValue';
import LivePulse from './motion/indicators/LivePulse';
import DayRangeSlider from './day-range-slider';
import { clamp } from './motion/core/dot-math';

interface LiquidationCardProps {
  data: LiquidationData;
  dayRange?: DayRange | null;
}

function LiquidationBar({ ratio }: { ratio: number }) {
  const longPct = clamp(ratio * 100, 0, 100);

  return (
    <div className="mt-2 mb-3">
      <div className="relative h-3 bg-gray-50 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-red-100"
          style={{ width: `${longPct}%` }}
        >
          <div className="w-full h-full" style={{
            backgroundImage: 'radial-gradient(circle, #e53935 1px, transparent 1px)',
            backgroundSize: '4px 4px',
            opacity: 0.3,
          }} />
        </div>
        <div
          className="absolute inset-y-0 right-0 bg-blue-50"
          style={{ width: `${100 - longPct}%` }}
        >
          <div className="w-full h-full" style={{
            backgroundImage: 'radial-gradient(circle, #1e88e5 1px, transparent 1px)',
            backgroundSize: '4px 4px',
            opacity: 0.3,
          }} />
        </div>
        <div
          className="absolute top-0 bottom-0 w-px bg-dot-border transition-all duration-500"
          style={{ left: `${longPct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-red-400/60 font-mono">롱 {longPct.toFixed(0)}%</span>
        <span className="text-[9px] text-blue-400/60 font-mono">숏 {(100 - longPct).toFixed(0)}%</span>
      </div>
    </div>
  );
}

function formatUsd(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export default function LiquidationCard({ data, dayRange }: LiquidationCardProps) {
  return (
    <div className="dot-card p-4 sm:p-5">
      <div className="dot-card-inner">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <LivePulse size={4} />
          청산 압력 (BTC)
        </h2>
        <DotKPIValue
          value={data.ratio * 100}
          decimals={1}
          suffix="% 롱"
          showSign={false}
          colorBySentiment={false}
          fontScale={5}
          morphMode="crossfade"
          morphDuration={400}
        />
        <LiquidationBar ratio={data.ratio} />
        {dayRange && dayRange.min !== dayRange.max && (
          <DayRangeSlider range={dayRange} decimals={2} />
        )}
      </div>
    </div>
  );
}
