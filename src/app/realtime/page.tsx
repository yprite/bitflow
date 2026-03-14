'use client';

import KimpCard from '@/components/kimp-card';
import FundingRateCard from '@/components/funding-rate-card';
import FearGreedCard from '@/components/fear-greed-card';
import UsdtPremiumCard from '@/components/usdt-premium-card';
import BtcDominanceCard from '@/components/btc-dominance-card';
import LongShortCard from '@/components/long-short-card';
import OpenInterestCard from '@/components/open-interest-card';
import LiquidationCard from '@/components/liquidation-card';
import StablecoinCard from '@/components/stablecoin-card';
import StrategyBtcCard from '@/components/strategy-btc-card';
import VolumeChangeCard from '@/components/volume-change-card';
import IndicatorCarousel from '@/components/indicator-carousel';
import OrbitalSilence from '@/components/motion/storytelling/OrbitalSilence';
import { useData } from '@/components/data-provider';

const CAROUSEL_LABELS = [
  '김프', '펀딩비', '공포탐욕', 'USDT', '도미넌스',
  '롱숏', 'OI', '청산', '스테이블', '거래량', 'MSTR',
];

export default function RealtimePage() {
  const {
    data, error, loading, fetchData,
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
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold text-dot-sub uppercase tracking-wider">
          실시간 지표
        </h1>
        <a href="/" className="text-xs text-dot-muted hover:text-dot-accent transition font-mono">
          ← 홈
        </a>
      </div>

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
  );
}
