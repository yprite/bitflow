'use client';

import BtcDominanceCard from '@/components/btc-dominance-card';
import FearGreedCard from '@/components/fear-greed-card';
import FundingRateCard from '@/components/funding-rate-card';
import KimpCard from '@/components/kimp-card';
import LiquidationCard from '@/components/liquidation-card';
import LongShortCard from '@/components/long-short-card';
import MarketBriefing from '@/components/market-briefing';
import MicroStrategyCard from '@/components/microstrategy-card';
import OpenInterestCard from '@/components/open-interest-card';
import DotAssemblyReveal from '@/components/motion/transitions/DotAssemblyReveal';
import OrbitalSilence from '@/components/motion/storytelling/OrbitalSilence';
import SignalBadge from '@/components/signal-badge';
import StablecoinCard from '@/components/stablecoin-card';
import UsdtPremiumCard from '@/components/usdt-premium-card';
import VolumeChangeCard from '@/components/volume-change-card';
import {
  DesktopHero,
  DesktopSectionHeader,
  DesktopStatCard,
  DesktopSurface,
} from '@/components/desktop/desktop-ui';
import { useData } from '@/components/data-provider';

function formatPercent(value: number, digits = 2) {
  return `${value > 0 ? '+' : ''}${value.toFixed(digits)}%`;
}

export default function DesktopRealtimePage() {
  const {
    data, error, loading, lastUpdated, fetchData,
    fundingRange, fearGreedRange,
    usdtPremiumRange, btcDominanceRange, longShortRange,
    oiRange, liqRange, stableRange, volumeRange, strategyBtcRange, capitalRange,
  } = useData();

  if (loading) {
    return (
      <DesktopSurface className="flex min-h-[620px] items-center justify-center">
        <OrbitalSilence />
      </DesktopSurface>
    );
  }

  if (error || !data) {
    return (
      <DesktopSurface className="p-12 text-center">
        <p className="desktop-kicker">Load Error</p>
        <h1 className="mt-3 text-[30px] font-semibold tracking-[-0.03em] text-dot-red">실시간 지표를 불러올 수 없습니다.</h1>
        <p className="mt-3 text-[14px] leading-7 text-dot-sub">{error ?? '알 수 없는 오류'}</p>
        <button
          type="button"
          onClick={fetchData}
          className="mt-5 inline-flex border border-dot-border bg-white px-4 py-2 text-[12px] font-medium text-dot-accent transition hover:border-dot-accent"
        >
          다시 시도
        </button>
      </DesktopSurface>
    );
  }

  return (
    <div className="space-y-6">
      <DotAssemblyReveal delay={0} duration={500} density="low">
        <DesktopHero
          eyebrow="Realtime Command Deck"
          title="실시간 지표"
          description={(
            <>
              11개 핵심 지표를 한 화면에서 모두 확인할 수 있습니다.
              각 카드는 현재 값, 당일 범위, 해석을 함께 보여줍니다.
            </>
          )}
          sidebar={(
            <div className="space-y-4">
              <DesktopStatCard label="마지막 업데이트" value={lastUpdated || '동기화 중'} tone="neutral" />
              <DesktopStatCard label="현재 신호" value={data.signal.level} />
              <DesktopStatCard label="김치프리미엄" value={formatPercent(data.kimp.kimchiPremium)} />
            </div>
          )}
        />
      </DotAssemblyReveal>

      <DotAssemblyReveal delay={80} duration={650}>
        <div className="grid grid-cols-[minmax(0,1.05fr)_420px] gap-6">
          <div className="min-w-0">
            <SignalBadge signal={data.signal} upbitPrice={data.kimp.upbitPrice} />
          </div>
          <div className="min-w-0">
            <MarketBriefing data={data} />
          </div>
        </div>
      </DotAssemblyReveal>

      <DotAssemblyReveal delay={150} duration={700}>
        <DesktopSurface className="p-6">
          <DesktopSectionHeader
            eyebrow="Core Indicators"
            title="핵심 지표"
            description="김치프리미엄, 펀딩비, 공포탐욕지수, USDT 프리미엄을 함께 비교합니다."
          />
          <div className="mt-6 grid grid-cols-2 gap-5">
            <div className="min-w-0">
              <KimpCard kimp={data.kimp} avg30d={data.avg30d} />
            </div>
            <div className="min-w-0">
              <FundingRateCard data={data.fundingRate} dayRange={fundingRange} />
            </div>
            <div className="min-w-0">
              <FearGreedCard data={data.fearGreed} dayRange={fearGreedRange} />
            </div>
            <div className="min-w-0">
              <UsdtPremiumCard data={data.usdtPremium} dayRange={usdtPremiumRange} />
            </div>
          </div>
        </DesktopSurface>
      </DotAssemblyReveal>

      <DotAssemblyReveal delay={220} duration={720}>
        <DesktopSurface className="p-6">
          <DesktopSectionHeader
            eyebrow="Market Structure"
            title="시장 구조"
            description="도미넌스, 포지션 쏠림, 미결제약정, 청산 비율을 함께 읽습니다."
          />
          <div className="mt-6 grid grid-cols-2 gap-5">
            <div className="min-w-0">
              <BtcDominanceCard data={data.btcDominance} dayRange={btcDominanceRange} />
            </div>
            <div className="min-w-0">
              <LongShortCard data={data.longShortRatio} dayRange={longShortRange} />
            </div>
            <div className="min-w-0">
              <OpenInterestCard data={data.openInterest} dayRange={oiRange} />
            </div>
            <div className="min-w-0">
              <LiquidationCard data={data.liquidation} dayRange={liqRange} />
            </div>
          </div>
        </DesktopSurface>
      </DotAssemblyReveal>

      <DotAssemblyReveal delay={290} duration={740}>
        <DesktopSurface className="p-6">
          <DesktopSectionHeader
            eyebrow="Flow & Volume"
            title="유동성과 거래량"
            description="스테이블코인 시총, BTC 거래량, 마이크로스트레티지 보유량을 확인합니다."
          />
          <div className="mt-6 grid grid-cols-3 gap-5">
            <div className="min-w-0">
              <StablecoinCard data={data.stablecoinMcap} dayRange={stableRange} />
            </div>
            <div className="min-w-0">
              <VolumeChangeCard data={data.volumeChange} dayRange={volumeRange} />
            </div>
            <div className="min-w-0">
              <MicroStrategyCard
                btcData={data.strategyBtc}
                capitalData={data.strategyCapital}
                btcRange={strategyBtcRange}
                capitalRange={capitalRange}
              />
            </div>
          </div>
        </DesktopSurface>
      </DotAssemblyReveal>
    </div>
  );
}
