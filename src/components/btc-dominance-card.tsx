'use client';

import type { BtcDominanceData } from '@/lib/types';
import type { DayRange } from './data-provider';
import DotKPIValue from './motion/typography/DotKPIValue';
import DotGauge from './motion/indicators/DotGauge';
import LivePulse from './motion/indicators/LivePulse';
import DayRangeSlider from './day-range-slider';

interface BtcDominanceCardProps {
  data: BtcDominanceData;
  dayRange?: DayRange | null;
}

function getDominanceLabel(dom: number): string {
  if (dom >= 62) return '비트 강세';
  if (dom >= 58) return '비트 우위';
  if (dom <= 52) return '알트시즌';
  if (dom <= 55) return '알트 강세';
  return '균형';
}

function getInsight(dom: number): string {
  if (dom >= 62) return '비트 강세 — 알트코인 약세 예상';
  if (dom >= 58) return '비트 우위 — 안전자산 선호 구간';
  if (dom >= 55) return '균형 — 방향성 주시';
  if (dom >= 52) return '알트 강세 — 자금 분산 시작';
  return '알트시즌 신호 — 알트코인 주목';
}

export default function BtcDominanceCard({ data, dayRange }: BtcDominanceCardProps) {
  // Gauge: more dots = more dominance (higher = BTC heavier)
  const dotCount = Math.min(Math.round((data.dominance / 100) * 8), 8);
  const label = getDominanceLabel(data.dominance);

  return (
    <div className="dot-card p-4 sm:p-5">
      <div className="dot-card-inner">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <LivePulse size={4} />
          BTC 도미넌스
        </h2>
        <DotKPIValue
          value={data.dominance}
          decimals={1}
          suffix="%"
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
            activeColor="#1a1a1a"
          />
        </div>
        <p className="text-xs text-dot-muted font-mono">{label}</p>
        {dayRange && dayRange.min !== dayRange.max && (
          <DayRangeSlider range={dayRange} decimals={1} suffix="%" />
        )}
        <p className="dot-insight">{getInsight(data.dominance)}</p>
      </div>
    </div>
  );
}
