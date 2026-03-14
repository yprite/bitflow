'use client';

import KimpCard from './kimp-card';
import FundingRateCard from './funding-rate-card';
import FearGreedCard from './fear-greed-card';
import UsdtPremiumCard from './usdt-premium-card';
import BtcDominanceCard from './btc-dominance-card';
import LongShortCard from './long-short-card';
import OpenInterestCard from './open-interest-card';
import LiquidationCard from './liquidation-card';
import StablecoinCard from './stablecoin-card';
import StrategyBtcCard from './strategy-btc-card';
import VolumeChangeCard from './volume-change-card';
import SignalBadge from './signal-badge';
import IndicatorCarousel from './indicator-carousel';
import OrbitalSilence from './motion/storytelling/OrbitalSilence';
import { useData } from './data-provider';

const CAROUSEL_LABELS = [
  '김프', '펀딩비', '공포탐욕', 'USDT', '도미넌스',
  '롱숏', 'OI', '청산', '스테이블', '거래량', 'MSTR',
];

export default function Dashboard() {
  const {
    data, error, loading, lastUpdated, fetchData,
    fundingRange, fearGreedRange,
    usdtPremiumRange, btcDominanceRange, longShortRange,
    oiRange, liqRange, stableRange, volumeRange, strategyRange,
  } = useData();

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
    <div className="space-y-3 sm:space-y-4">
      <div className="dot-entrance flex items-center justify-between" style={{ '--entrance-delay': '0ms' } as React.CSSProperties}>
        <p className="text-xs text-dot-muted font-mono">마지막 업데이트: {lastUpdated}</p>
        <button
          onClick={fetchData}
          className="text-xs text-dot-muted hover:text-dot-accent transition font-mono"
        >
          [ 새로고침 ]
        </button>
      </div>

      {/* Fixed: 시장 온도 (11-factor signal) */}
      <div className="dot-entrance" style={{ '--entrance-delay': '80ms' } as React.CSSProperties}>
        <SignalBadge signal={data.signal} />
      </div>

      {/* Carousel: 개별 지표 상세 */}
      <div className="dot-entrance" style={{ '--entrance-delay': '160ms' } as React.CSSProperties}>
        <IndicatorCarousel labels={CAROUSEL_LABELS}>
          <KimpCard kimp={data.kimp} avg30d={data.avg30d} />
          <FundingRateCard data={data.fundingRate} dayRange={fundingRange} />
          <FearGreedCard data={data.fearGreed} dayRange={fearGreedRange} />
          <UsdtPremiumCard data={data.usdtPremium} dayRange={usdtPremiumRange} />
          <BtcDominanceCard data={data.btcDominance} dayRange={btcDominanceRange} />
          <LongShortCard data={data.longShortRatio} dayRange={longShortRange} />
          <OpenInterestCard data={data.openInterest} dayRange={oiRange} />
          <LiquidationCard data={data.liquidation} dayRange={liqRange} />
          <StablecoinCard data={data.stablecoinMcap} dayRange={stableRange} />
          <VolumeChangeCard data={data.volumeChange} dayRange={volumeRange} />
          <StrategyBtcCard data={data.strategyBtc} dayRange={strategyRange} />
        </IndicatorCarousel>
      </div>
    </div>
  );
}
