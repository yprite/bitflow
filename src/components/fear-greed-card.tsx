'use client';

import type { FearGreedData } from '@/lib/types';

interface FearGreedCardProps {
  data: FearGreedData;
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

export default function FearGreedCard({ data }: FearGreedCardProps) {
  const color = getColor(data.value);
  const label = CLASSIFICATION_KR[data.classification] || data.classification;
  const totalDots = 10;
  const activeDots = Math.round((data.value / 100) * totalDots);

  return (
    <div className="dot-card p-5">
      <div className="dot-card-inner">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-3">공포탐욕지수</h2>
        <div className="flex items-baseline gap-3">
          <p className="text-2xl font-bold font-mono" style={{ color }}>{data.value}</p>
          <p className="text-xs font-medium" style={{ color }}>{label}</p>
        </div>
        <div className="flex gap-[4px] mt-3">
          {[...Array(totalDots)].map((_, i) => {
            const dotActive = i < activeDots;
            const dotSize = dotActive ? 10 + Math.round((i / totalDots) * 6) : 6;
            return (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: `${dotSize}px`,
                  height: `${dotSize}px`,
                  backgroundColor: dotActive ? color : '#e5e7eb',
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
