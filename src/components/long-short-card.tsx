'use client';

import type { LongShortRatioData } from '@/lib/types';
import type { DayRange } from './data-provider';
import DotKPIValue from './motion/typography/DotKPIValue';
import LivePulse from './motion/indicators/LivePulse';
import DayRangeSlider from './day-range-slider';
import { clamp } from './motion/core/dot-math';

interface LongShortCardProps {
  data: LongShortRatioData;
  dayRange?: DayRange | null;
}

/**
 * Dot-density bar showing long vs short distribution.
 * Long fills from left, short fills from right, meeting at the ratio point.
 */
function LongShortBar({ longPct, shortPct }: { longPct: number; shortPct: number }) {
  const longWidth = clamp(longPct, 0, 100);

  return (
    <div className="mt-2 mb-3">
      <div className="relative h-3 bg-gray-50 overflow-hidden">
        {/* Long side (left) */}
        <div
          className="absolute inset-y-0 left-0"
          style={{
            width: `${longWidth}%`,
            backgroundImage: 'radial-gradient(circle, #1a1a1a 1px, transparent 1px)',
            backgroundSize: '4px 4px',
            opacity: 0.25 + (longWidth / 100) * 0.35,
          }}
        />
        {/* Short side (right) */}
        <div
          className="absolute inset-y-0 right-0"
          style={{
            width: `${100 - longWidth}%`,
            backgroundImage: 'radial-gradient(circle, #1a1a1a 0.8px, transparent 0.8px)',
            backgroundSize: '5px 5px',
            opacity: 0.12 + ((100 - longWidth) / 100) * 0.25,
          }}
        />
        {/* Divider */}
        <div
          className="absolute top-0 bottom-0 w-px bg-dot-border transition-all duration-500"
          style={{ left: `${longWidth}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-dot-muted font-mono">롱 {longPct.toFixed(1)}%</span>
        <span className="text-[9px] text-dot-muted font-mono">숏 {shortPct.toFixed(1)}%</span>
      </div>
    </div>
  );
}

function getInsight(ratio: number): string {
  if (ratio > 2) return '극단적 롱 편향 — 조정 위험 높음';
  if (ratio > 1.3) return '롱 우세 — 상승 기대감 반영';
  if (ratio > 0.7) return '균형 — 방향성 탐색 중';
  if (ratio > 0.5) return '숏 우세 — 하락 경계';
  return '극단적 숏 편향 — 반등 가능성';
}

export default function LongShortCard({ data, dayRange }: LongShortCardProps) {
  return (
    <div className="dot-card p-4 sm:p-5">
      <div className="dot-card-inner">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <LivePulse size={4} />
          롱숏 비율 (BTC)
        </h2>
        <DotKPIValue
          value={data.longShortRatio}
          decimals={2}
          showSign={false}
          colorBySentiment={false}
          fontScale={5}
          morphMode="crossfade"
          morphDuration={400}
        />
        <LongShortBar longPct={data.longRatio} shortPct={data.shortRatio} />
        {dayRange && dayRange.min !== dayRange.max && (
          <DayRangeSlider range={dayRange} decimals={2} />
        )}
        <p className="dot-insight">{getInsight(data.longShortRatio)}</p>
      </div>
    </div>
  );
}
