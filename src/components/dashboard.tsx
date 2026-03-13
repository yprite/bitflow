'use client';

import KimpCard from './kimp-card';
import FundingRateCard from './funding-rate-card';
import FearGreedCard from './fear-greed-card';
import SignalBadge from './signal-badge';
import OrbitalSilence from './motion/storytelling/OrbitalSilence';
import { useData } from './data-provider';

export default function Dashboard() {
  const { data, error, loading, lastUpdated, fetchData } = useData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <OrbitalSilence />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-dot-red text-lg mb-2">{error}</p>
          <button
            onClick={fetchData}
            className="text-sm text-dot-sub hover:text-dot-accent transition px-4 py-2 border-2 border-dot-border hover:border-dot-accent"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-dot-muted font-mono">마지막 업데이트: {lastUpdated}</p>
        <button
          onClick={fetchData}
          className="text-xs text-dot-muted hover:text-dot-accent transition font-mono"
        >
          [ 새로고침 ]
        </button>
      </div>

      <KimpCard kimp={data.kimp} avg30d={data.avg30d} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <FundingRateCard data={data.fundingRate} />
        <FearGreedCard data={data.fearGreed} />
        <SignalBadge signal={data.signal} />
      </div>
    </div>
  );
}
