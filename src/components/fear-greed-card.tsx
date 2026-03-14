'use client';

import type { FearGreedData } from '@/lib/types';
import type { DayRange } from './data-provider';
import DotScale from './motion/indicators/DotScale';
import DotKPIValue from './motion/typography/DotKPIValue';
import DotMorphTransition from './motion/transitions/DotMorphTransition';
import LivePulse from './motion/indicators/LivePulse';
import DayRangeSlider from './day-range-slider';

interface FearGreedCardProps {
  data: FearGreedData;
  dayRange?: DayRange | null;
}

function getColor(value: number): string {
  if (value <= 25) return '#e53935';
  if (value <= 45) return '#f9a825';
  if (value <= 55) return '#9ca3af';
  if (value <= 75) return '#66bb6a';
  return '#00c853';
}

const CLASSIFICATION_KR: Record<string, string> = {
  'Extreme Fear': '극도의 공포',
  'Fear': '공포',
  'Neutral': '중립',
  'Greed': '탐욕',
  'Extreme Greed': '극도의 탐욕',
};

function getInsight(value: number): string {
  if (value >= 75) return '극도의 탐욕 — 과매수 경고, 리스크 관리 필요';
  if (value >= 55) return '탐욕 구간 — 상승 모멘텀 유지 중';
  if (value >= 45) return '중립 — 시장 방향성 탐색 중';
  if (value >= 25) return '공포 구간 — 역발상 매수 기회 탐색';
  return '극도의 공포 — 바닥 신호, 역발상 매수 구간';
}

export default function FearGreedCard({ data, dayRange }: FearGreedCardProps) {
  const color = getColor(data.value);
  const label = CLASSIFICATION_KR[data.classification] || data.classification;

  return (
    <div className="dot-card p-4 sm:p-5">
      <div className="dot-card-inner">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <LivePulse size={4} color={color} />
          공포탐욕지수
        </h2>
        <div className="flex items-end gap-3">
          <DotKPIValue
            value={data.value}
            decimals={0}
            showSign={false}
            colorBySentiment={false}
            color={color}
            fontScale={5}
            morphMode="threshold"
            morphDuration={500}
          />
          <DotMorphTransition
            text={label}
            fontScale={3}
            mode="crossfade"
            morphDuration={400}
            color={color}
            className="mb-0.5"
          />
        </div>
        <div className="mt-3">
          <DotScale
            value={data.value / 100}
            max={10}
            color={color}
            minSize={6}
            maxSize={16}
          />
        </div>
        {dayRange && dayRange.min !== dayRange.max && (
          <DayRangeSlider range={dayRange} decimals={0} />
        )}
        <p className="dot-insight">{getInsight(data.value)}</p>
      </div>
    </div>
  );
}
