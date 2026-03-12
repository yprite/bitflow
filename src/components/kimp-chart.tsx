'use client';

import { useState } from 'react';
import type { KimpHistoryPoint } from '@/lib/types';

interface KimpChartProps {
  data: KimpHistoryPoint[];
}

type Period = '7d' | '30d';

const axisLabelFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: '2-digit',
  day: '2-digit',
});

function formatAxisLabel(timestamp: string): string {
  const parts = axisLabelFormatter.formatToParts(new Date(timestamp));
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (month && day) {
    return `${month}.${day}`;
  }

  return axisLabelFormatter.format(new Date(timestamp)).replace(/\s/g, '');
}

function formatPercentLabel(value: number): string {
  return `${value.toFixed(2)}%`;
}

export default function KimpChart({ data }: KimpChartProps) {
  const [period, setPeriod] = useState<Period>('7d');

  const now = Date.now();
  const cutoff = period === '7d' ? now - 7 * 86400_000 : now - 30 * 86400_000;
  const filtered = data.filter((point) => new Date(point.collectedAt).getTime() >= cutoff);

  if (filtered.length < 2) {
    return (
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
        <h2 className="text-sm font-medium text-gray-400 mb-4">김프 히스토리</h2>
        <p className="text-gray-500 text-sm">데이터 수집 중... 저장된 히스토리가 쌓이면 표시됩니다.</p>
      </div>
    );
  }

  const values = filtered.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const chartHeight = 120;
  const chartWidth = 100; // percent
  const guideLines = [0, chartHeight / 2, chartHeight];
  const points = filtered.map((point, i) => {
    const x = (i / (filtered.length - 1)) * chartWidth;
    const y = chartHeight - ((point.value - min) / range) * chartHeight;
    return `${x},${y}`;
  }).join(' ');
  const yAxisLabels = [max, min + range / 2, min].map((value) => formatPercentLabel(value));
  const axisLabels = [
    filtered[0],
    filtered[Math.floor((filtered.length - 1) / 2)],
    filtered[filtered.length - 1],
  ].map((point) => formatAxisLabel(point.collectedAt));

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
      <div className="flex gap-3">
        <div className="shrink-0 h-32 flex flex-col justify-between text-[11px] text-gray-500 font-mono text-right">
          {yAxisLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="flex-1 min-w-0">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-32"
            preserveAspectRatio="none"
          >
            {guideLines.map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="#374151"
                strokeWidth="0.6"
                strokeDasharray="2 2"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            <polyline
              points={points}
              fill="none"
              stroke="#4ade80"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className="flex justify-between text-[11px] text-gray-500 mt-2 font-mono">
            <span>{axisLabels[0]}</span>
            <span>{axisLabels[1]}</span>
            <span>{axisLabels[2]}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
