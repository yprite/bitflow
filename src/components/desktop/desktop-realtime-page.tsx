'use client';

import { useState } from 'react';
import BtcDominanceCard from '@/components/btc-dominance-card';
import FearGreedCard from '@/components/fear-greed-card';
import FundingRateCard from '@/components/funding-rate-card';
import KimpCard from '@/components/kimp-card';
import LiquidationCard from '@/components/liquidation-card';
import LongShortCard from '@/components/long-short-card';
import MarketBriefing from '@/components/market-briefing';
import MicroStrategyCard from '@/components/microstrategy-card';
import OpenInterestCard from '@/components/open-interest-card';
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

const INDICATOR_ORDER = [
  { factorLabel: '김프', displayLabel: '김치프리미엄' },
  { factorLabel: '펀딩비', displayLabel: '펀딩비' },
  { factorLabel: '공포탐욕', displayLabel: '공포탐욕지수' },
  { factorLabel: 'USDT프리미엄', displayLabel: 'USDT 프리미엄' },
  { factorLabel: 'BTC도미넌스', displayLabel: 'BTC 도미넌스' },
  { factorLabel: '롱비율', displayLabel: '롱숏 비율' },
  { factorLabel: '미결제약정', displayLabel: '미결제약정' },
  { factorLabel: '청산비율', displayLabel: '청산 비율' },
  { factorLabel: '스테이블', displayLabel: '스테이블코인' },
  { factorLabel: '거래량', displayLabel: 'BTC 거래량' },
  { factorLabel: '마이크로스트레티지', displayLabel: '마이크로스트레티지' },
] as const;

function directionTone(direction: '과열' | '중립' | '침체') {
  if (direction === '과열') return 'text-dot-red border-dot-red/30 bg-dot-red/[0.05]';
  if (direction === '침체') return 'text-dot-blue border-dot-blue/30 bg-dot-blue/[0.05]';
  return 'text-dot-sub border-dot-border/60 bg-white/70';
}

function formatPercent(value: number, digits = 2) {
  return `${value > 0 ? '+' : ''}${value.toFixed(digits)}%`;
}

export default function DesktopRealtimePage() {
  const [selectedIndex, setSelectedIndex] = useState(0);
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

  const factorMap = new Map(data.signal.factors.map((factor) => [factor.label, factor]));

  const renderDetailCard = () => {
    switch (selectedIndex) {
      case 0:
        return <KimpCard kimp={data.kimp} avg30d={data.avg30d} />;
      case 1:
        return <FundingRateCard data={data.fundingRate} dayRange={fundingRange} />;
      case 2:
        return <FearGreedCard data={data.fearGreed} dayRange={fearGreedRange} />;
      case 3:
        return <UsdtPremiumCard data={data.usdtPremium} dayRange={usdtPremiumRange} />;
      case 4:
        return <BtcDominanceCard data={data.btcDominance} dayRange={btcDominanceRange} />;
      case 5:
        return <LongShortCard data={data.longShortRatio} dayRange={longShortRange} />;
      case 6:
        return <OpenInterestCard data={data.openInterest} dayRange={oiRange} />;
      case 7:
        return <LiquidationCard data={data.liquidation} dayRange={liqRange} />;
      case 8:
        return <StablecoinCard data={data.stablecoinMcap} dayRange={stableRange} />;
      case 9:
        return <VolumeChangeCard data={data.volumeChange} dayRange={volumeRange} />;
      case 10:
        return (
          <MicroStrategyCard
            btcData={data.strategyBtc}
            capitalData={data.strategyCapital}
            btcRange={strategyBtcRange}
            capitalRange={capitalRange}
          />
        );
      default:
        return null;
    }
  };

  const selectedFactor = INDICATOR_ORDER[selectedIndex];

  return (
    <div className="space-y-6">
      <DesktopHero
        eyebrow="Realtime Command Deck"
        title="실시간 지표 Desktop"
        description={(
          <>
            PC 화면에서는 지표 목록과 상세 카드를 분리해 두었습니다. 좌측에서 팩터를 선택하면 우측 분석 카드가 고정되어,
            모바일처럼 펼치고 접지 않아도 빠르게 비교할 수 있습니다.
          </>
        )}
        action={(
          <button
            type="button"
            onClick={fetchData}
            className="desktop-chip hover:border-dot-accent/40 hover:text-dot-accent"
          >
            새로고침
          </button>
        )}
        sidebar={(
          <div className="space-y-4">
            <DesktopStatCard label="마지막 업데이트" value={lastUpdated || '동기화 중'} tone="neutral" />
            <DesktopStatCard label="현재 신호" value={data.signal.level} />
            <DesktopStatCard label="선택 지표" value={selectedFactor.displayLabel} tone="neutral" />
            <DesktopStatCard label="김치프리미엄" value={formatPercent(data.kimp.kimchiPremium)} />
          </div>
        )}
      />

      <DesktopSurface className="p-6">
        <DesktopSectionHeader
          eyebrow="Indicator Matrix"
          title="실시간 상세 패널"
          description="좌측 목록에서 지표를 고르면 우측에 상세 카드가 고정됩니다."
        />
        <div className="mt-6 grid grid-cols-[340px_minmax(0,1fr)] gap-5">
          <div className="desktop-surface p-4">
            <div className="space-y-2">
              <p className="desktop-kicker">Indicators</p>
              {INDICATOR_ORDER.map((item, index) => {
                const factor = factorMap.get(item.factorLabel);
                if (!factor) return null;
                const active = selectedIndex === index;

                return (
                  <button
                    key={item.factorLabel}
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                    className={`flex w-full items-center justify-between border px-3 py-3 text-left transition ${
                      active
                        ? 'border-dot-accent bg-dot-accent text-white'
                        : 'border-dot-border/60 bg-white/72 text-dot-sub hover:border-dot-accent/30 hover:text-dot-accent'
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="text-[13px] font-medium">{item.displayLabel}</p>
                      <p className={`inline-flex border px-2 py-0.5 text-[10px] font-mono ${active ? 'border-white/20 bg-white/10 text-white' : directionTone(factor.direction)}`}>
                        {factor.direction}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-[12px] font-mono ${active ? 'text-white' : 'text-dot-accent'}`}>
                        {factor.value}
                      </p>
                      <p className={`mt-1 text-[10px] font-mono ${active ? 'text-white/60' : 'text-dot-muted'}`}>
                        {active ? 'OPEN' : 'VIEW'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="min-w-0">
            {renderDetailCard()}
          </div>
        </div>
      </DesktopSurface>

      <div className="grid grid-cols-[minmax(0,1.05fr)_420px] gap-6">
        <div className="min-w-0">
          <MarketBriefing data={data} />
        </div>
        <div className="min-w-0">
          <SignalBadge signal={data.signal} upbitPrice={data.kimp.upbitPrice} />
        </div>
      </div>
    </div>
  );
}
