'use client';

import type { KimpData } from '@/lib/types';

interface KimpCardProps {
  kimp: KimpData;
  avg30d: number | null;
}

function DotCluster({ value, max = 10 }: { value: number; max?: number }) {
  const count = Math.min(Math.round(Math.abs(value) * 2), max);
  const isPositive = value >= 0;
  return (
    <div className="flex gap-[3px] items-center">
      {[...Array(max)].map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-300"
          style={{
            width: i < count ? `${6 + (i < count ? 2 : 0)}px` : '4px',
            height: i < count ? `${6 + (i < count ? 2 : 0)}px` : '4px',
            backgroundColor: i < count
              ? isPositive ? '#00c853' : '#e53935'
              : '#d1d5db',
          }}
        />
      ))}
    </div>
  );
}

export default function KimpCard({ kimp, avg30d }: KimpCardProps) {
  const isPositive = kimp.kimchiPremium >= 0;
  const color = isPositive ? 'text-dot-green' : 'text-dot-red';
  const sign = isPositive ? '+' : '';
  const badge = avg30d !== null
    ? kimp.kimchiPremium > avg30d ? '평균 이상 ↑' : '평균 이하 ↓'
    : null;
  const badgeColor = avg30d !== null
    ? kimp.kimchiPremium > avg30d ? 'bg-emerald-50 text-dot-green border border-emerald-200' : 'bg-red-50 text-dot-red border border-red-200'
    : '';

  return (
    <div className="dot-card p-6 dot-vignette">
      <div className="dot-card-inner">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-dot-sub uppercase tracking-wider">김치프리미엄</h2>
          {badge && (
            <span className={`text-xs px-2 py-0.5 font-mono ${badgeColor}`}>
              30일 {badge}
            </span>
          )}
        </div>
        <p className={`text-5xl font-bold ${color} font-mono tracking-tight`}>
          {sign}{kimp.kimchiPremium.toFixed(2)}%
        </p>
        <div className="mt-2 mb-4">
          <DotCluster value={kimp.kimchiPremium} />
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
