'use client';

import { useState } from 'react';

interface DataPoint {
  time: string;
  value: number;
}

interface KimpChartProps {
  data: DataPoint[];
}

type Period = '7d' | '30d';

export default function KimpChart({ data }: KimpChartProps) {
  const [period, setPeriod] = useState<Period>('7d');

  const now = Date.now();
  const cutoff = period === '7d' ? now - 7 * 86400_000 : now - 30 * 86400_000;
  const filtered = data.filter(d => new Date(d.time).getTime() >= cutoff);

  if (filtered.length < 2) {
    return (
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
        <h2 className="text-sm font-medium text-gray-400 mb-4">김프 히스토리</h2>
        <p className="text-gray-500 text-sm">데이터 수집 중... 차트가 곧 표시됩니다.</p>
      </div>
    );
  }

  const values = filtered.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const chartHeight = 120;
  const chartWidth = 100; // percent
  const points = filtered.map((d, i) => {
    const x = (i / (filtered.length - 1)) * chartWidth;
    const y = chartHeight - ((d.value - min) / range) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-400">김프 히스토리</h2>
        <div className="flex gap-1">
          {(['7d', '30d'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs rounded-lg transition ${
                period === p
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {p === '7d' ? '7일' : '30일'}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-32"
        preserveAspectRatio="none"
      >
        <polyline
          points={points}
          fill="none"
          stroke="#4ade80"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="flex justify-between text-xs text-gray-600 mt-1">
        <span>{min.toFixed(2)}%</span>
        <span>{max.toFixed(2)}%</span>
      </div>
    </div>
  );
}
