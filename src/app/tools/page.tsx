'use client';

import { useState } from 'react';
import PremiumHeatmap from '@/components/premium-heatmap';
import ArbitrageCalculator from '@/components/arbitrage-calculator';
import OrbitalSilence from '@/components/motion/storytelling/OrbitalSilence';
import { useData } from '@/components/data-provider';
import type { CoinPremium } from '@/lib/types';

export default function ToolsPage() {
  const { multiCoinData, error, loading, fetchData } = useData();
  const [selectedCoin, setSelectedCoin] = useState<CoinPremium | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <OrbitalSilence />
      </div>
    );
  }

  if (error || !multiCoinData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-dot-red text-lg mb-2">{error ?? '멀티코인 데이터를 불러올 수 없습니다.'}</p>
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
      <div className="flex items-center gap-3">
        <a href="/" className="text-dot-muted hover:text-dot-accent transition text-sm font-mono">← 홈</a>
        <h1 className="text-sm font-semibold text-dot-sub uppercase tracking-wider">도구</h1>
      </div>

      <PremiumHeatmap data={multiCoinData} onSelectCoin={setSelectedCoin} />
      <ArbitrageCalculator data={multiCoinData} selectedCoin={selectedCoin} />
    </div>
  );
}
