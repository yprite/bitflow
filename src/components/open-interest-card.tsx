'use client';

import type { OpenInterestData } from '@/lib/types';
import type { DayRange } from './data-provider';
import DotKPIValue from './motion/typography/DotKPIValue';
import DotGauge from './motion/indicators/DotGauge';
import LivePulse from './motion/indicators/LivePulse';
import DayRangeSlider from './day-range-slider';

interface OpenInterestCardProps {
  data: OpenInterestData;
  dayRange?: DayRange | null;
}

function formatBtc(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toFixed(0);
}

function getInsight(changeRate: number): string {
  if (changeRate > 20) return 'OI 급증 — 레버리지 과열 경고';
  if (changeRate > 5) return 'OI 증가 — 신규 포지션 유입';
  if (changeRate > -5) return 'OI 안정 — 포지션 변동 적음';
  if (changeRate > -20) return 'OI 감소 — 포지션 정리 진행 중';
  return 'OI 급감 — 대규모 청산 발생 가능';
}

export default function OpenInterestCard({ data, dayRange }: OpenInterestCardProps) {
  const dotCount = Math.min(Math.round(Math.abs(data.changeRate) / 5), 8);

  return (
    <div className="dot-card p-4 sm:p-5">
      <div className="dot-card-inner">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <LivePulse size={4} />
          미결제약정 (BTC)
        </h2>
        <DotKPIValue
          value={data.oiUsd}
          decimals={0}
          suffix=" BTC"
          showSign={false}
          colorBySentiment={false}
          fontScale={5}
          morphMode="crossfade"
          morphDuration={400}
        />
        <div className="mt-2 mb-3">
          <DotGauge
            activeDots={dotCount}
            max={8}
            activeColor={data.changeRate > 0 ? '#00c853' : '#e53935'}
          />
        </div>
        <p className="text-xs text-dot-muted font-mono">
          계약 수: {data.oi.toLocaleString()}
        </p>
        {dayRange && dayRange.min !== dayRange.max && (
          <DayRangeSlider range={dayRange} decimals={0} suffix=" BTC" />
        )}
        <p className="dot-insight">{getInsight(data.changeRate)}</p>
      </div>
    </div>
  );
}
