'use client';

import type { UsdtPremiumData } from '@/lib/types';
import type { DayRange } from './data-provider';
import DotKPIValue from './motion/typography/DotKPIValue';
import DotGauge from './motion/indicators/DotGauge';
import LivePulse from './motion/indicators/LivePulse';
import DayRangeSlider from './day-range-slider';

interface UsdtPremiumCardProps {
  data: UsdtPremiumData;
  dayRange?: DayRange | null;
}

export default function UsdtPremiumCard({ data, dayRange }: UsdtPremiumCardProps) {
  const isPositive = data.premium >= 0;
  const dotCount = Math.min(Math.round(Math.abs(data.premium) * 3), 8);
  const krwFormatter = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 });

  return (
    <div className="dot-card p-4 sm:p-5">
      <div className="dot-card-inner">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <LivePulse size={4} />
          USDT 프리미엄
        </h2>
        <DotKPIValue
          value={data.premium}
          decimals={2}
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
        {data.usdtKrwPrice > 0 && (
          <p className="text-xs text-dot-muted font-mono">
            {krwFormatter.format(data.usdtKrwPrice)}원 / {krwFormatter.format(data.actualUsdKrw)}원
          </p>
        )}
        {dayRange && dayRange.min !== dayRange.max && (
          <DayRangeSlider range={dayRange} decimals={2} suffix="%" />
        )}
      </div>
    </div>
  );
}
