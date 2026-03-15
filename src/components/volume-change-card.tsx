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

function getInsight(changeRate: number): string {
  if (changeRate > 50) return '거래량 폭증 — 강한 추세 진행 중';
  if (changeRate > 15) return '거래량 증가 — 모멘텀 강화';
  if (changeRate > -15) return '거래량 보통 — 관망세';
  if (changeRate > -50) return '거래량 감소 — 시장 관심 저하';
  return '거래량 급감 — 시장 침체 신호';
}

export default function VolumeChangeCard({ data, dayRange }: VolumeChangeCardProps) {
  // Binance(글로벌) 데이터가 있으면 기본 표시, 없으면 Upbit 폴백
  const primaryRate = data.binanceChangeRate || data.changeRate;
  const dotCount = Math.min(Math.round(Math.abs(primaryRate) / 15), 8);
  const isPositive = primaryRate >= 0;

  return (
    <div className="dot-card p-4 sm:p-5">
      <div className="dot-card-inner">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <LivePulse size={4} />
          BTC 거래량 변화
        </h2>
        <DotKPIValue
          value={primaryRate}
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
        <div className="space-y-0.5">
          <p className="text-xs text-dot-muted font-mono">
            Binance 24h: {data.binanceVolume24h.toFixed(0)} BTC / 7d평균: {data.binanceVolumeAvg7d.toFixed(0)} BTC
          </p>
          <p className="text-xs text-dot-muted font-mono">
            Upbit 24h: {data.volume24h.toFixed(1)} BTC / 7d평균: {data.volumeAvg7d.toFixed(1)} BTC
          </p>
        </div>
        {dayRange && dayRange.min !== dayRange.max && (
          <DayRangeSlider range={dayRange} decimals={1} suffix="%" />
        )}
        <p className="dot-insight">{getInsight(primaryRate)}</p>
      </div>
    </div>
  );
}
