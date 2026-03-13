'use client';

import type { CoinPremium } from '@/lib/types';
import LivePulse from '@/components/motion/indicators/LivePulse';

interface Props {
  coins: CoinPremium[];
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
        <div className="space-y-2">
          {sorted.map((coin) => {
            const barWidth = (Math.abs(coin.premium) / maxAbs) * 50;
            const isPositive = coin.premium >= 0;

            return (
              <div key={coin.symbol} className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-dot-sub w-10 text-right shrink-0">
                  {coin.symbol}
                </span>
                <div className="flex-1 flex items-center h-5">
                  {/* Center line at 50% */}
                  <div className="relative w-full h-full">
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300" />
                    {isPositive ? (
                      <div
                        className="absolute top-0.5 bottom-0.5 bg-red-400 rounded-r-sm"
                        style={{ left: '50%', width: `${barWidth}%` }}
                      />
                    ) : (
                      <div
                        className="absolute top-0.5 bottom-0.5 bg-blue-400 rounded-l-sm"
                        style={{ right: '50%', width: `${barWidth}%` }}
                      />
                    )}
                  </div>
                </div>
                <span
                  className={`text-[11px] font-mono w-14 text-right shrink-0 ${
                    isPositive ? 'text-red-500' : 'text-blue-500'
                  }`}
                >
                  {coin.premium >= 0 ? '+' : ''}{coin.premium.toFixed(2)}%
                </span>
              </div>
            );
          })}
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
