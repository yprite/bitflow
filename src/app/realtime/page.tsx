'use client';

import { useState, useEffect } from 'react';
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
import IndicatorTable from '@/components/indicator-table';
import OrbitalSilence from '@/components/motion/storytelling/OrbitalSilence';
import { useData } from '@/components/data-provider';

export default function RealtimePage() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const {
    data, error, loading, lastUpdated, fetchData,
    fundingRange, fearGreedRange,
    usdtPremiumRange, btcDominanceRange, longShortRange,
    oiRange, liqRange, stableRange, volumeRange, strategyRange,
  } = useData();

  const [phase, setPhase] = useState<'loading' | 'exiting' | 'ready'>('loading');

  useEffect(() => {
    if (!loading && phase === 'loading') {
      if (data) {
        setPhase('exiting');
        const timer = setTimeout(() => setPhase('ready'), 400);
        return () => clearTimeout(timer);
      } else {
        setPhase('ready');
      }
    }
  }, [loading, data, phase]);

  useEffect(() => {
    if (loading && phase === 'ready') setPhase('loading');
  }, [loading, phase]);

  if (phase !== 'ready') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className={phase === 'exiting' ? 'dot-exit' : ''}>
          <OrbitalSilence />
        </div>
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

  const handleSelect = (index: number) => {
    setSelectedIndex(prev => prev === index ? null : index);
  };

  const renderDetailCard = () => {
    switch (selectedIndex) {
      case 0: return <KimpCard kimp={data.kimp} avg30d={data.avg30d} />;
      case 1: return <FundingRateCard data={data.fundingRate} dayRange={fundingRange} />;
      case 2: return <FearGreedCard data={data.fearGreed} dayRange={fearGreedRange} />;
      case 3: return <UsdtPremiumCard data={data.usdtPremium} dayRange={usdtPremiumRange} />;
      case 4: return <BtcDominanceCard data={data.btcDominance} dayRange={btcDominanceRange} />;
      case 5: return <LongShortCard data={data.longShortRatio} dayRange={longShortRange} />;
      case 6: return <OpenInterestCard data={data.openInterest} dayRange={oiRange} />;
      case 7: return <LiquidationCard data={data.liquidation} dayRange={liqRange} />;
      case 8: return <StablecoinCard data={data.stablecoinMcap} dayRange={stableRange} />;
      case 9: return <VolumeChangeCard data={data.volumeChange} dayRange={volumeRange} />;
      case 10: return <StrategyBtcCard data={data.strategyBtc} dayRange={strategyRange} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="dot-entrance flex items-center justify-between" style={{ '--entrance-delay': '0ms' } as React.CSSProperties}>
        <h1 className="text-sm font-semibold text-dot-sub uppercase tracking-wider">
          실시간 지표
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-dot-muted font-mono hidden sm:inline">{lastUpdated}</span>
          <button
            onClick={fetchData}
            className="text-xs text-dot-muted hover:text-dot-accent transition font-mono"
          >
            [ 새로고침 ]
          </button>
          <a href="/" className="text-xs text-dot-muted hover:text-dot-accent transition font-mono">
            ← 홈
          </a>
        </div>
      </div>

      {/* Summary table */}
      <div className="dot-entrance" style={{ '--entrance-delay': '60ms' } as React.CSSProperties}>
        <IndicatorTable
          factors={data.signal.factors}
          selectedIndex={selectedIndex}
          onSelect={handleSelect}
        />
      </div>

      {/* Detail card */}
      {selectedIndex !== null && (
        <div key={selectedIndex} className="dot-entrance" style={{ '--entrance-delay': '0ms' } as React.CSSProperties}>
          <div className="flex justify-end mb-1">
            <button
              onClick={() => setSelectedIndex(null)}
              className="text-[10px] text-dot-muted hover:text-dot-accent transition font-mono"
            >
              [ 닫기 ]
            </button>
          </div>
          {renderDetailCard()}
        </div>
      )}
    </div>
  );
}
