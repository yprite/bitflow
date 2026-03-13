'use client';

import { useRef } from 'react';
import type { KimpData } from '@/lib/types';
import DotCluster from './motion/indicators/DotCluster';
import InsightBloom from './motion/indicators/InsightBloom';

interface KimpCardProps {
  kimp: KimpData;
  avg30d: number | null;
}

export default function KimpCard({ kimp, avg30d }: KimpCardProps) {
  const isPositive = kimp.kimchiPremium >= 0;
  const color = isPositive ? 'text-dot-green' : 'text-dot-red';
  const sign = isPositive ? '+' : '';

  const badgeState = avg30d !== null
    ? kimp.kimchiPremium > avg30d ? 'above' : 'below'
    : null;
  const badge = badgeState === 'above' ? '평균 이상 ↑' : badgeState === 'below' ? '평균 이하 ↓' : null;
  const badgeColor = badgeState === 'above'
    ? 'bg-emerald-50 text-dot-green border border-emerald-200'
    : badgeState === 'below'
    ? 'bg-red-50 text-dot-red border border-red-200'
    : '';

  return (
    <div className="dot-card p-6 dot-vignette">
      <div className="dot-card-inner">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-dot-sub uppercase tracking-wider">김치프리미엄</h2>
          {badge && (
            <span className={`text-xs px-2 py-0.5 font-mono relative ${badgeColor}`}>
              30일 {badge}
              <InsightBloom trigger={badgeState ?? ''} dotCount={6} travelDistance={20} dotSize={2} />
            </span>
          )}
        </div>
        <p className={`text-5xl font-bold ${color} font-mono tracking-tight`}>
          {sign}{kimp.kimchiPremium.toFixed(2)}%
        </p>
        <div className="mt-2 mb-4">
          <DotCluster value={kimp.kimchiPremium} pulse />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm dot-border-t pt-4">
          <div>
            <p className="text-dot-muted text-xs mb-1">업비트 BTC</p>
            <p className="text-dot-text font-mono font-medium">{kimp.upbitPrice.toLocaleString()}원</p>
          </div>
          <div>
            <p className="text-dot-muted text-xs mb-1">해외 BTC</p>
            <p className="text-dot-text font-mono font-medium">${kimp.globalPrice.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-dot-muted text-xs mb-1">환율</p>
            <p className="text-dot-text font-mono font-medium">{kimp.usdKrw.toFixed(0)}원</p>
          </div>
        </div>
      </div>
    </div>
  );
}
