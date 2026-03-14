'use client';

import type { StrategyBtcData } from '@/lib/types';
import type { DayRange } from './data-provider';
import DotGauge from './motion/indicators/DotGauge';
import DotKPIValue from './motion/typography/DotKPIValue';
import LivePulse from './motion/indicators/LivePulse';
import DayRangeSlider from './day-range-slider';

interface StrategyBtcCardProps {
  data: StrategyBtcData;
  dayRange?: DayRange | null;
}

function formatUsdBillions(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  return `$${value.toFixed(0)}`;
}

export default function StrategyBtcCard({ data, dayRange }: StrategyBtcCardProps) {
  const isPositive = data.changeRate >= 0;
  const dotCount = data.holdingsChange === 0
    ? 0
    : Math.min(Math.max(Math.round(Math.abs(data.changeRate) * 4), 1), 8);
  const holdingsChangeText = `${data.holdingsChange >= 0 ? '+' : ''}${data.holdingsChange.toLocaleString()} BTC`;

  return (
    <div className="dot-card p-4 sm:p-5">
      <div className="dot-card-inner">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <LivePulse size={4} />
          MSTR 매입
        </h2>
        <DotKPIValue
          value={data.changeRate}
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
        <div className="space-y-1 text-xs text-dot-muted font-mono">
          <p>최근 변화: {holdingsChangeText}</p>
          <p>총 보유: {data.totalHoldings.toLocaleString()} BTC</p>
          <p>평가액: {formatUsdBillions(data.currentValueUsd)} / 공급비중: {data.supplyPercentage.toFixed(2)}%</p>
        </div>
        {dayRange && dayRange.min !== dayRange.max && (
          <DayRangeSlider range={dayRange} decimals={2} suffix="%" />
        )}
      </div>
    </div>
  );
}
