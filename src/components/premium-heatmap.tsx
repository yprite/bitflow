'use client';

import { useState } from 'react';
import type { CoinPremium, MultiCoinKimpData } from '@/lib/types';
import ConvictionLens, { convictionDotStyle } from './motion/heatmap/ConvictionLens';
import PressureBar from './motion/heatmap/PressureBar';
import DotTabBar from './motion/transitions/DotTabBar';
import { useFieldTransition } from './motion/transitions/useFieldTransition';
import { useReducedMotion } from './motion/core/useReducedMotion';

interface PremiumHeatmapProps {
  data: MultiCoinKimpData;
  onSelectCoin?: (coin: CoinPremium) => void;
}

type SortKey = 'premium' | 'marketCap' | 'symbol';

function getDotSize(premium: number): number {
  const abs = Math.abs(premium);
  if (abs > 5) return 12;
  if (abs > 3) return 10;
  if (abs > 1.5) return 8;
  return 5;
}

function getDotColor(premium: number): string {
  if (premium > 0) return '#e53935';
  if (premium < 0) return '#1e88e5';
  return '#9ca3af';
}

function getDotOpacity(premium: number): number {
  const abs = Math.abs(premium);
  if (abs > 5) return 1;
  if (abs > 3) return 0.8;
  if (abs > 1.5) return 0.6;
  return 0.35;
}

function getPremiumBarWidth(premium: number): number {
  return Math.min(Math.abs(premium) * 10, 100);
}

const SORT_TABS = [
  { key: 'premium', label: '김프순' },
  { key: 'marketCap', label: '시총순' },
  { key: 'symbol', label: '이름순' },
];

export default function PremiumHeatmap({ data, onSelectCoin }: PremiumHeatmapProps) {
  const [sortKey, setSortKey] = useState<SortKey>('premium');
  const reducedMotion = useReducedMotion();
  const fieldTransition = useFieldTransition(sortKey, {
    duration: 300,
    fadeStrength: 0.1,
    blurStrength: 0.8,
  });

  const sorted = [...data.coins].sort((a, b) => {
    if (sortKey === 'premium') return b.premium - a.premium;
    if (sortKey === 'marketCap') return a.marketCapRank - b.marketCapRank;
    if (sortKey === 'symbol') return a.symbol.localeCompare(b.symbol);
    return b.premium - a.premium;
  });

  const avgPremium = data.coins.length > 0
    ? data.coins.reduce((sum, c) => sum + c.premium, 0) / data.coins.length
    : 0;

  const maxPremium = data.coins.length > 0 ? Math.max(...data.coins.map(c => c.premium)) : 0;
  const minPremium = data.coins.length > 0 ? Math.min(...data.coins.map(c => c.premium)) : 0;

  return (
    <div className="dot-card p-4 sm:p-6">
      <div className="dot-card-inner">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
          <div>
            <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider">멀티코인 김프 히트맵</h2>
            <p className="text-[10px] sm:text-xs text-dot-muted mt-1 font-mono">
              평균 {avgPremium >= 0 ? '+' : ''}{avgPremium.toFixed(2)}% · 최고 {maxPremium >= 0 ? '+' : ''}{maxPremium.toFixed(2)}% · 최저 {minPremium >= 0 ? '+' : ''}{minPremium.toFixed(2)}%
            </p>
          </div>
          <DotTabBar
            tabs={SORT_TABS}
            activeKey={sortKey}
            onChange={(key) => setSortKey(key as SortKey)}
            indicatorDots={5}
            indicatorRadius={1.5}
            indicatorSpacing={3}
            transitionDuration={300}
          />
        </div>

        {/* Dot heatmap grid with Conviction Lens */}
        <div style={fieldTransition.style}>
        <ConvictionLens itemCount={sorted.length}>
          {({ hoveredIndex, getScale, onHover }) => (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-5">
              {sorted.map((coin, index) => {
                const dotSize = getDotSize(coin.premium);
                const dotColor = getDotColor(coin.premium);
                const dotOpacity = getDotOpacity(coin.premium);
                const scale = getScale(index);
                return (
                  <button
                    key={coin.symbol}
                    onClick={() => onSelectCoin?.(coin)}
                    onMouseEnter={() => onHover(index)}
                    onMouseLeave={() => onHover(null)}
                    className="bg-white border border-dot-border p-2 sm:p-3 text-center transition-all hover:shadow-md"
                  >
                    {/* Central dot indicator with conviction scaling */}
                    <div className="flex justify-center mb-2">
                      <div
                        className="rounded-full"
                        style={{
                          width: `${dotSize}px`,
                          height: `${dotSize}px`,
                          backgroundColor: dotColor,
                          opacity: dotOpacity,
                          ...convictionDotStyle(scale, reducedMotion),
                        }}
                      />
                    </div>
                    <p className="text-xs font-bold text-dot-text">{coin.symbol}</p>
                    <p className="text-sm font-bold font-mono" style={{ color: dotColor }}>
                      {coin.premium >= 0 ? '+' : ''}{coin.premium.toFixed(2)}%
                    </p>
                    <p className="text-[10px] text-dot-muted">{coin.name}</p>
                  </button>
                );
              })}
            </div>
          )}
        </ConvictionLens>

        {/* Pressure bar chart */}
        <div className="space-y-2">
          {sorted.map(coin => (
            <div key={coin.symbol} className="flex items-center gap-2 text-xs">
              <span className="w-10 sm:w-12 text-dot-muted font-mono text-right font-medium text-[10px] sm:text-xs">{coin.symbol}</span>
              <PressureBar
                premium={coin.premium}
                color={getDotColor(coin.premium)}
                opacity={getDotOpacity(coin.premium)}
                widthPercent={getPremiumBarWidth(coin.premium)}
              />
            </div>
          ))}
        </div>

        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-[10px] text-dot-muted">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundImage: 'radial-gradient(circle, #1e88e5 1.5px, transparent 1.5px)', backgroundSize: '4px 4px' }} />
            <span>역프리미엄</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gray-200" />
            <span>0%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundImage: 'radial-gradient(circle, #e53935 1.5px, transparent 1.5px)', backgroundSize: '4px 4px' }} />
            <span>양프리미엄</span>
          </div>
        </div>
      </div>
    </div>
  );
}
