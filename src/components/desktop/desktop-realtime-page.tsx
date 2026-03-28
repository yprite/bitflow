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
    data, error, loading, lastUpdated,
    fundingRange, fearGreedRange,
    usdtPremiumRange, btcDominanceRange, longShortRange,
    oiRange, liqRange, stableRange, volumeRange, strategyBtcRange, capitalRange,
  } = useData();

  if (loading) {
    return (
      <DesktopSurface className="p-8">
        <p className="desktop-kicker">Realtime</p>
        <p className="mt-2 text-[12px] leading-6 text-dot-sub">실시간 지표를 정리하는 중입니다.</p>
      </DesktopSurface>
    );
  }

  if (error || !data) {
    return (
      <DesktopSurface className="p-8">
        <p className="desktop-kicker">Realtime</p>
        <h1 className="mt-2 text-[18px] font-semibold tracking-[-0.02em] text-dot-accent">실시간 지표를 아직 표시할 수 없습니다.</h1>
        <p className="mt-2 text-[12px] leading-6 text-dot-sub">{error ?? '잠시 후 다시 자동 갱신됩니다.'}</p>
      </DesktopSurface>
    );
  }

  return (
    <div className="space-y-6">
      <DesktopHero
        eyebrow="Realtime Command Deck"
        title="실시간 지표"
        description={(
          <>
            실시간 상태를 한 화면에 모으되, 먼저 핵심 신호를 보고 이어서 구조와 유동성을 읽는 순서로 정리했습니다.
            값 자체보다 현재 문맥과 상대적 위치를 빠르게 파악하는 데 초점을 둡니다.
          </>
        )}
      />

      <div className="grid grid-cols-[minmax(0,1.05fr)_420px] gap-6">
        <div className="min-w-0">
          <SignalBadge signal={data.signal} upbitPrice={data.kimp.upbitPrice} />
        </div>
        <div className="min-w-0">
          <MarketBriefing data={data} />
        </div>
      </div>

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
    </div>
  );
}
