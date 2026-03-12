'use client';

import type { KimpData } from '@/lib/types';

interface KimpCardProps {
  kimp: KimpData;
  avg30d: number | null;
}

export default function KimpCard({ kimp, avg30d }: KimpCardProps) {
  const isPositive = kimp.kimchiPremium >= 0;
  const color = isPositive ? 'text-green-400' : 'text-red-400';
  const sign = isPositive ? '+' : '';
  const badge = avg30d !== null
    ? kimp.kimchiPremium > avg30d ? '평균 이상 ↑' : '평균 이하 ↓'
    : null;
  const badgeColor = avg30d !== null
    ? kimp.kimchiPremium > avg30d ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
    : '';

  return (
    <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-medium text-gray-400">김치프리미엄</h2>
        {badge && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${badgeColor}`}>
            30일 {badge}
          </span>
        )}
      </div>
      <p className={`text-4xl font-bold ${color}`}>
        {sign}{kimp.kimchiPremium.toFixed(2)}%
      </p>
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-500">업비트 BTC</p>
          <p className="text-gray-200 font-mono">{kimp.upbitPrice.toLocaleString()}원</p>
        </div>
        <div>
          <p className="text-gray-500">해외 BTC</p>
          <p className="text-gray-200 font-mono">${kimp.globalPrice.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-500">환율</p>
          <p className="text-gray-200 font-mono">{kimp.usdKrw.toFixed(0)}원</p>
        </div>
      </div>
    </div>
  );
}
