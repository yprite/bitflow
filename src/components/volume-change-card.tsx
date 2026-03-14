'use client';

import type { VolumeChangeData } from '@/lib/types';
import type { DayRange } from './data-provider';
import DotKPIValue from './motion/typography/DotKPIValue';
import DotGauge from './motion/indicators/DotGauge';
import LivePulse from './motion/indicators/LivePulse';
import DayRangeSlider from './day-range-slider';

interface VolumeChangeCardProps {
  data: VolumeChangeData;
  dayRange?: DayRange | null;
}

export default function VolumeChangeCard({ data, dayRange }: VolumeChangeCardProps) {
  const dotCount = Math.min(Math.round(Math.abs(data.changeRate) / 15), 8);
  const isPositive = data.changeRate >= 0;

  return (
    <div className="dot-card p-4 sm:p-5">
      <div className="dot-card-inner">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <LivePulse size={4} />
          BTC 거래량 변화
        </h2>
        <DotKPIValue
          value={data.changeRate}
          decimals={1}
          suffix="%"
          showSign
          fontScale={5}
          morphMode="crossfade"
          morphDuration={400}
        />
        <div className="mt-2 mb-3">
          <DotGauge
            activeDots={dotCount}
            max={8}
            activeColor={isPositive ? '#00c853' : '#e53935'}
          />
        </div>
        <p className="text-xs text-dot-muted font-mono">
          24h: {data.volume24h.toFixed(1)} BTC / 7d평균: {data.volumeAvg7d.toFixed(1)} BTC
        </p>
        {dayRange && dayRange.min !== dayRange.max && (
          <DayRangeSlider range={dayRange} decimals={1} suffix="%" />
        )}
      </div>
    </div>
  );
}
