'use client';

import type { FearGreedData } from '@/lib/types';

interface FearGreedCardProps {
  data: FearGreedData;
}

function getGaugeColor(value: number): string {
  if (value <= 25) return 'text-red-400';
  if (value <= 45) return 'text-orange-400';
  if (value <= 55) return 'text-yellow-400';
  if (value <= 75) return 'text-lime-400';
  return 'text-green-400';
}

function getBarColor(value: number): string {
  if (value <= 25) return 'bg-red-500';
  if (value <= 45) return 'bg-orange-500';
  if (value <= 55) return 'bg-yellow-500';
  if (value <= 75) return 'bg-lime-500';
  return 'bg-green-500';
}

const CLASSIFICATION_KR: Record<string, string> = {
  'Extreme Fear': '극도의 공포',
  'Fear': '공포',
  'Neutral': '중립',
  'Greed': '탐욕',
  'Extreme Greed': '극도의 탐욕',
};

export default function FearGreedCard({ data }: FearGreedCardProps) {
  const color = getGaugeColor(data.value);
  const barColor = getBarColor(data.value);
  const label = CLASSIFICATION_KR[data.classification] || data.classification;

  return (
    <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
      <h2 className="text-sm font-medium text-gray-400 mb-2">공포탐욕지수</h2>
      <div className="flex items-baseline gap-3">
        <p className={`text-3xl font-bold ${color}`}>{data.value}</p>
        <p className={`text-sm ${color}`}>{label}</p>
      </div>
      <div className="mt-3 w-full h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${data.value}%` }}
        />
      </div>
    </div>
  );
}
