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
      <div className="dot-card p-6">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-4">김프 히스토리</h2>
        <p className="text-dot-muted text-sm">데이터 수집 중... 저장된 히스토리가 쌓이면 표시됩니다.</p>
      </div>
    );
  }

  const values = filtered.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const padding = 4; // padding so dots at edges don't clip
  const chartHeight = 120;
  const chartWidth = 100;
  const guideLines = [padding, padding + (chartHeight - padding * 2) / 2, chartHeight - padding];

  // Generate dots for the chart (halftone scatter plot style)
  const dots = filtered.map((point, i) => {
    const x = padding + (i / (filtered.length - 1)) * (chartWidth - padding * 2);
    const y = padding + (chartHeight - padding * 2) - ((point.value - min) / range) * (chartHeight - padding * 2);
    return { x, y, value: point.value };
  });

  // Also keep polyline for connectivity
  const points = dots.map(d => `${d.x},${d.y}`).join(' ');

  const yAxisLabels = [max, min + range / 2, min].map((value) => formatPercentLabel(value));
  const axisLabels = [
    filtered[0],
    filtered[Math.floor((filtered.length - 1) / 2)],
    filtered[filtered.length - 1],
  ].map((point) => formatAxisLabel(point.collectedAt));

  return (
    <div className="dot-card p-4 sm:p-6">
      <div className="dot-card-inner">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider">김프 히스토리</h2>
          <div className="flex gap-1">
            {(['7d', '30d'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-xs font-mono transition border ${
                  period === p
                    ? 'bg-dot-accent text-white border-dot-accent'
                    : 'text-dot-muted border-dot-border hover:text-dot-accent hover:border-dot-accent'
                }`}
              >
                {p === '7d' ? '7일' : '30일'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <div className="shrink-0 h-32 flex flex-col justify-between text-[11px] text-dot-muted font-mono text-right">
            {yAxisLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className="flex-1 min-w-0">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-32"
              preserveAspectRatio="xMidYMid meet"
              overflow="hidden"
            >
              {/* Dot grid background */}
              <defs>
                <pattern id="dotGrid" width="5" height="5" patternUnits="userSpaceOnUse">
                  <circle cx="2.5" cy="2.5" r="0.3" fill="#d1d5db" />
                </pattern>
              </defs>
              <rect width={chartWidth} height={chartHeight} fill="url(#dotGrid)" rx="1" />

              {guideLines.map((y) => (
                <line
                  key={y}
                  x1={padding}
                  y1={y}
                  x2={chartWidth - padding}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="0.5"
                  strokeDasharray="1 2"
                  vectorEffect="non-scaling-stroke"
                />
              ))}

              {/* Line connecting dots */}
              <polyline
                points={points}
                fill="none"
                stroke="#1a1a1a"
                strokeWidth="1"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />

              {/* Data point dots at every point */}
              {dots.map((d, i) => (
                <circle
                  key={i}
                  cx={d.x}
                  cy={d.y}
                  r={1.5}
                  fill="#1a1a1a"
                />
              ))}
            </svg>
            <div className="flex justify-between text-[11px] text-dot-muted mt-2 font-mono">
              <span>{axisLabels[0]}</span>
              <span>{axisLabels[1]}</span>
              <span>{axisLabels[2]}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
