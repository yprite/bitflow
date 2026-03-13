'use client';

import type { CoinPremium } from '@/lib/types';
import LivePulse from '@/components/motion/indicators/LivePulse';
import { clamp } from '@/components/motion/core/dot-math';

interface Props {
  coins: CoinPremium[];
}

/**
 * Dot-density pressure bar. Higher |premium| → larger, denser dots.
 * Implements the halftone "Volume as Pressure" pattern.
 */
function DotPressureBar({ premium, maxAbs }: { premium: number; maxAbs: number }) {
  const absPremium = Math.abs(premium);
  const intensity = clamp(absPremium / maxAbs, 0, 1);

  // Dynamic dot sizing: more premium = larger, denser dots
  const dotRadius = 0.8 + intensity * 1.2;
  const dotSpacing = Math.max(8 - intensity * 5, 3);
  const widthPercent = intensity * 50;
  const isPositive = premium >= 0;

  // Opacity increases with intensity
  const opacity = 0.15 + intensity * 0.55;

  return (
    <div className="flex-1 h-5 relative overflow-hidden bg-gray-50">
      {/* Dot pressure fill */}
      <div
        className="h-full absolute top-0 transition-all duration-500"
        style={{
          width: `${widthPercent}%`,
          ...(isPositive
            ? { left: '50%' }
            : { right: '50%' }),
          backgroundImage: `radial-gradient(circle, #1a1a1a ${dotRadius}px, transparent ${dotRadius}px)`,
          backgroundSize: `${dotSpacing}px ${dotSpacing}px`,
          opacity,
        }}
      />

      {/* Center line */}
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-200" />
    </div>
  );
}

export default function MultiCoinComparisonChart({ coins }: Props) {
  if (coins.length === 0) {
    return (
      <div className="dot-card p-6">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-4">멀티코인 김프 비교</h2>
        <p className="text-dot-muted text-sm">멀티코인 데이터를 불러오는 중...</p>
      </div>
    );
  }

  const sorted = [...coins].sort((a, b) => b.premium - a.premium);
  const maxAbs = Math.max(...sorted.map((c) => Math.abs(c.premium)), 1);

  return (
    <div className="dot-card p-4 sm:p-6">
      <div className="dot-card-inner">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-1.5">
          <LivePulse size={4} />
          멀티코인 김프 비교
        </h2>
        <div className="space-y-1.5">
          {sorted.map((coin) => (
            <div key={coin.symbol} className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-dot-sub w-10 text-right shrink-0">
                {coin.symbol}
              </span>
              <DotPressureBar premium={coin.premium} maxAbs={maxAbs} />
              <span className="text-[11px] font-mono w-14 text-right shrink-0 text-dot-text">
                {coin.premium >= 0 ? '+' : ''}{coin.premium.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[9px] text-dot-muted mt-2 font-mono px-12">
          <span>역프</span>
          <span>0%</span>
          <span>양프</span>
        </div>
      </div>
    </div>
  );
}
