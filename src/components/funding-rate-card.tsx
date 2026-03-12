'use client';

import type { FundingRateData } from '@/lib/types';

interface FundingRateCardProps {
  data: FundingRateData;
}

export default function FundingRateCard({ data }: FundingRateCardProps) {
  const ratePercent = (data.fundingRate * 100).toFixed(4);
  const isPositive = data.fundingRate >= 0;
  const color = isPositive ? 'text-green-400' : 'text-red-400';
  const nextTime = new Date(data.nextFundingTime).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
      <h2 className="text-sm font-medium text-gray-400 mb-2">펀딩비 (Bybit BTCUSDT)</h2>
      <p className={`text-3xl font-bold ${color}`}>
        {isPositive ? '+' : ''}{ratePercent}%
      </p>
      <p className="text-xs text-gray-500 mt-2">
        다음 정산: {nextTime}
      </p>
    </div>
  );
}
