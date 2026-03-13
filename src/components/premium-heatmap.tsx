'use client';

import { useState } from 'react';
import type { CoinPremium, MultiCoinKimpData } from '@/lib/types';
import DotTabBar from './motion/transitions/DotTabBar';
import { useFieldTransition } from './motion/transitions/useFieldTransition';
import LivePulse from './motion/indicators/LivePulse';

interface PremiumHeatmapProps {
  data: MultiCoinKimpData;
  onSelectCoin?: (coin: CoinPremium) => void;
}

type SortKey = 'premium' | 'marketCap' | 'symbol';
type SortDir = 'asc' | 'desc';

function getDotColor(premium: number): string {
  if (premium > 0) return '#e53935';
  if (premium < 0) return '#1e88e5';
  return '#9ca3af';
}

/** Halftone dot spacing: higher premium = denser dots */
function getHalftoneSpacing(premium: number): number {
  const abs = Math.abs(premium);
  if (abs > 5) return 4;
  if (abs > 3) return 6;
  if (abs > 1.5) return 8;
  return 12;
}

/** Halftone dot radius: higher premium = bigger dots */
function getHalftoneRadius(premium: number): number {
  const abs = Math.abs(premium);
  if (abs > 5) return 1.8;
  if (abs > 3) return 1.4;
  if (abs > 1.5) return 1.0;
  return 0.6;
}

/** Background opacity intensity based on rank position (0=top) */
function getRankOpacity(rank: number, total: number): number {
  return 0.25 + (1 - rank / Math.max(total - 1, 1)) * 0.75;
}

const SORT_TABS = [
  { key: 'premium', label: '김프순' },
  { key: 'marketCap', label: '시총순' },
  { key: 'symbol', label: '이름순' },
];

function HalftoneCard({
  coin,
  rank,
  total,
  onClick,
}: {
  coin: CoinPremium;
  rank: number;
  total: number;
  onClick?: () => void;
}) {
  const color = getDotColor(coin.premium);
  const spacing = getHalftoneSpacing(coin.premium);
  const radius = getHalftoneRadius(coin.premium);
  const rankOpacity = getRankOpacity(rank, total);

  return (
    <button
      onClick={onClick}
      className="relative bg-white border border-dot-border p-3 sm:p-4 text-center transition-all hover:shadow-md overflow-hidden group"
    >
      {/* Halftone dot background */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          backgroundImage: `radial-gradient(circle, ${color} ${radius}px, transparent ${radius}px)`,
          backgroundSize: `${spacing}px ${spacing}px`,
          opacity: rankOpacity * 0.15,
        }}
      />

      {/* Content */}
      <div className="relative">
        {/* Rank badge */}
        <div
          className="absolute -top-1 -left-1 w-4 h-4 flex items-center justify-center text-[8px] font-bold font-mono"
          style={{ color, opacity: rankOpacity }}
        >
          {rank + 1}
        </div>

        <p className="text-xs font-bold text-dot-text mt-1">{coin.symbol}</p>
        <p
          className="text-base sm:text-lg font-bold font-mono mt-0.5"
          style={{ color, opacity: rankOpacity }}
        >
          {coin.premium >= 0 ? '+' : ''}{coin.premium.toFixed(2)}%
        </p>
        <p className="text-[10px] text-dot-muted mt-0.5">{coin.name}</p>
      </div>

      {/* Bottom intensity strip */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-500"
        style={{
          backgroundColor: color,
          opacity: rankOpacity * 0.6,
        }}
      />
    </button>
  );
}

function PressureRow({
  coin,
  rank,
  total,
}: {
  coin: CoinPremium;
  rank: number;
  total: number;
}) {
  const color = getDotColor(coin.premium);
  const spacing = getHalftoneSpacing(coin.premium);
  const radius = getHalftoneRadius(coin.premium);
  const rankOpacity = getRankOpacity(rank, total);
  const barWidth = Math.min(Math.abs(coin.premium) * 10, 100);
  const isPositive = coin.premium >= 0;

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-10 sm:w-12 text-dot-muted font-mono text-right font-medium text-[10px] sm:text-xs">
        {coin.symbol}
      </span>
      <div className="flex-1 h-5 bg-gray-100 relative overflow-hidden">
        <div
          className="h-full transition-all duration-500 absolute top-0"
          style={{
            width: `${barWidth}%`,
            ...(isPositive ? { left: '50%' } : { right: '50%' }),
            backgroundImage: `radial-gradient(circle, ${color} ${radius}px, transparent ${radius}px)`,
            backgroundSize: `${spacing}px ${spacing}px`,
            opacity: rankOpacity,
          }}
        />
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-dot-border" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] text-dot-text font-mono font-medium">
            {coin.premium >= 0 ? '+' : ''}{coin.premium.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default function PremiumHeatmap({ data, onSelectCoin }: PremiumHeatmapProps) {
  const [sortKey, setSortKey] = useState<SortKey>('premium');
  const [premiumDir, setPremiumDir] = useState<SortDir>('desc');
  const fieldTransition = useFieldTransition(`${sortKey}-${premiumDir}`, {
    duration: 300,
    fadeStrength: 0.1,
    blurStrength: 0.8,
  });

  const handleSortChange = (key: string) => {
    if (key === 'premium' && sortKey === 'premium') {
      setPremiumDir(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key as SortKey);
      if (key === 'premium') setPremiumDir('desc');
    }
  };

  const sortTabs = SORT_TABS.map(tab =>
    tab.key === 'premium' && sortKey === 'premium'
      ? { ...tab, label: premiumDir === 'desc' ? '김프순 ↓' : '김프순 ↑' }
      : tab
  );

  const sorted = [...data.coins].sort((a, b) => {
    if (sortKey === 'premium') {
      return premiumDir === 'desc' ? b.premium - a.premium : a.premium - b.premium;
    }
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
            <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider flex items-center gap-1.5">
              <LivePulse size={4} />
              멀티코인 김프 히트맵
            </h2>
            <p className="text-[10px] sm:text-xs text-dot-muted mt-1 font-mono">
              평균 {avgPremium >= 0 ? '+' : ''}{avgPremium.toFixed(2)}% · 최고 {maxPremium >= 0 ? '+' : ''}{maxPremium.toFixed(2)}% · 최저 {minPremium >= 0 ? '+' : ''}{minPremium.toFixed(2)}%
            </p>
          </div>
          <DotTabBar
            tabs={sortTabs}
            activeKey={sortKey}
            onChange={handleSortChange}
            indicatorDots={5}
            indicatorRadius={1.5}
            indicatorSpacing={3}
            transitionDuration={300}
          />
        </div>

        <div style={fieldTransition.style}>
          {/* 3x3 halftone grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5">
            {sorted.map((coin, index) => (
              <HalftoneCard
                key={coin.symbol}
                coin={coin}
                rank={index}
                total={sorted.length}
                onClick={() => onSelectCoin?.(coin)}
              />
            ))}
          </div>

          {/* Pressure bar chart */}
          <div className="space-y-2">
            {sorted.map((coin, index) => (
              <PressureRow
                key={coin.symbol}
                coin={coin}
                rank={index}
                total={sorted.length}
              />
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
