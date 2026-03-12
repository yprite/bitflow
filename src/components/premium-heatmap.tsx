'use client';

import { useState } from 'react';
import type { CoinPremium, MultiCoinKimpData } from '@/lib/types';

interface PremiumHeatmapProps {
  data: MultiCoinKimpData;
  onSelectCoin?: (coin: CoinPremium) => void;
}

type SortKey = 'premium' | 'marketCap' | 'symbol';

function getPremiumColor(premium: number): string {
  const abs = Math.abs(premium);
  if (premium > 0) {
    if (abs > 5) return 'bg-red-500/80 text-white';
    if (abs > 3) return 'bg-red-500/50 text-red-100';
    if (abs > 1.5) return 'bg-red-500/30 text-red-200';
    return 'bg-red-500/15 text-red-300';
  } else {
    if (abs > 5) return 'bg-blue-500/80 text-white';
    if (abs > 3) return 'bg-blue-500/50 text-blue-100';
    if (abs > 1.5) return 'bg-blue-500/30 text-blue-200';
    return 'bg-blue-500/15 text-blue-300';
  }
}

function getPremiumBarWidth(premium: number): number {
  return Math.min(Math.abs(premium) * 10, 100);
}

export default function PremiumHeatmap({ data, onSelectCoin }: PremiumHeatmapProps) {
  const [sortKey, setSortKey] = useState<SortKey>('premium');

  const sorted = [...data.coins].sort((a, b) => {
    if (sortKey === 'premium') return b.premium - a.premium;
    if (sortKey === 'marketCap') return a.marketCapRank - b.marketCapRank;
    if (sortKey === 'symbol') return a.symbol.localeCompare(b.symbol);
    return b.premium - a.premium; // default
  });

  const avgPremium = data.coins.length > 0
    ? data.coins.reduce((sum, c) => sum + c.premium, 0) / data.coins.length
    : 0;

  const maxPremium = data.coins.length > 0 ? Math.max(...data.coins.map(c => c.premium)) : 0;
  const minPremium = data.coins.length > 0 ? Math.min(...data.coins.map(c => c.premium)) : 0;

  return (
    <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-medium text-gray-400">멀티코인 김프 히트맵</h2>
          <p className="text-xs text-gray-600 mt-1">
            평균 {avgPremium >= 0 ? '+' : ''}{avgPremium.toFixed(2)}% · 최고 {maxPremium >= 0 ? '+' : ''}{maxPremium.toFixed(2)}% · 최저 {minPremium >= 0 ? '+' : ''}{minPremium.toFixed(2)}%
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-1">
          {(['premium', 'marketCap', 'symbol'] as SortKey[]).map(key => (
            <button
              key={key}
              onClick={() => setSortKey(key)}
              className={`px-3 py-1 text-xs rounded-lg transition ${
                sortKey === key
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {key === 'premium' ? '김프순' : key === 'marketCap' ? '시총순' : '이름순'}
            </button>
          ))}
        </div>
      </div>

      {/* 히트맵 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
        {sorted.map(coin => (
          <button
            key={coin.symbol}
            onClick={() => onSelectCoin?.(coin)}
            className={`rounded-xl p-3 text-center transition-all hover:scale-105 hover:ring-1 hover:ring-gray-600 ${getPremiumColor(coin.premium)}`}
          >
            <p className="text-xs font-bold opacity-80">{coin.symbol}</p>
            <p className="text-lg font-bold">
              {coin.premium >= 0 ? '+' : ''}{coin.premium.toFixed(2)}%
            </p>
            <p className="text-[10px] opacity-60">{coin.name}</p>
            <p className="text-[10px] opacity-50">시총 #{coin.marketCapRank}</p>
          </button>
        ))}
      </div>

      {/* 바 차트 */}
      <div className="space-y-1.5">
        {sorted.map(coin => (
          <div key={coin.symbol} className="flex items-center gap-2 text-xs">
            <span className="w-12 text-gray-500 font-mono text-right">{coin.symbol}</span>
            <div className="flex-1 h-4 bg-gray-800 rounded overflow-hidden relative">
              {coin.premium >= 0 ? (
                <div
                  className="h-full bg-red-500/60 rounded-r transition-all duration-500"
                  style={{ width: `${getPremiumBarWidth(coin.premium)}%`, marginLeft: '50%' }}
                />
              ) : (
                <div
                  className="h-full bg-blue-500/60 rounded-l transition-all duration-500 ml-auto"
                  style={{ width: `${getPremiumBarWidth(coin.premium)}%`, marginRight: '50%' }}
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] text-gray-300 font-mono">
                  {coin.premium >= 0 ? '+' : ''}{coin.premium.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 범례 */}
      <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-500/60" />
          <span>역프리미엄</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-700" />
          <span>0%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500/60" />
          <span>양프리미엄</span>
        </div>
      </div>
    </div>
  );
}
