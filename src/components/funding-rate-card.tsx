'use client';

import type { FundingRateData } from '@/lib/types';
import DotGauge from './motion/indicators/DotGauge';
import DotKPIValue from './motion/typography/DotKPIValue';
import LivePulse from './motion/indicators/LivePulse';

interface FundingRateCardProps {
  data: FundingRateData;
}

export default function FundingRateCard({ data }: FundingRateCardProps) {
  const isPositive = data.fundingRate >= 0;
  const nextTime = new Date(data.nextFundingTime).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
  });

  const dotCount = Math.min(Math.round(Math.abs(data.fundingRate) * 100 * 50), 8);

  return (
    <div className="dot-card p-4 sm:p-5">
      <div className="dot-card-inner">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <LivePulse size={4} />
          펀딩비 (BTCUSDT)
        </h2>
        <DotKPIValue
          value={data.fundingRate * 100}
          decimals={4}
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
          다음 정산: {nextTime}
        </p>
      </div>
    </div>
  );
}
