'use client';

import type { StablecoinMcapData } from '@/lib/types';
import type { DayRange } from './data-provider';
import DotKPIValue from './motion/typography/DotKPIValue';
import DotGauge from './motion/indicators/DotGauge';
import LivePulse from './motion/indicators/LivePulse';
import DayRangeSlider from './day-range-slider';

interface StablecoinCardProps {
  data: StablecoinMcapData;
  dayRange?: DayRange | null;
}

function formatUsd(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  return `$${value.toFixed(0)}`;
}

function getInsight(change: number): string {
  if (change > 2) return '스테이블 대규모 유입 — 매수 대기 자금 증가';
  if (change > 0.5) return '스테이블 유입 — 시장 긍정적';
  if (change > -0.5) return '스테이블 안정 — 자금 흐름 변동 없음';
  if (change > -2) return '스테이블 유출 — 현금화 진행 중';
  return '스테이블 대규모 유출 — 시장 이탈 경고';
}

export default function StablecoinCard({ data, dayRange }: StablecoinCardProps) {
  const dotCount = Math.min(Math.round(Math.abs(data.change24h) * 4), 8);
  const isPositive = data.change24h >= 0;

  return (
    <div className="dot-card p-4 sm:p-5">
      <div className="dot-card-inner">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <LivePulse size={4} />
          스테이블코인 시총
        </h2>
        <DotKPIValue
          value={data.change24h}
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
        <p className="text-xs text-dot-muted font-mono">
          USDT+USDC: {formatUsd(data.totalMcap)}
        </p>
        {dayRange && dayRange.min !== dayRange.max && (
          <DayRangeSlider range={dayRange} decimals={2} suffix="%" />
        )}
        <p className="dot-insight">{getInsight(data.change24h)}</p>
      </div>
    </div>
  );
}
