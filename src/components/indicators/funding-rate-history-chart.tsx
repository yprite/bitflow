'use client';

import type { FundingRateHistoryPoint } from '@/lib/types';
import ChartBase, { mapToChart } from './chart-base';

interface Props {
  data: FundingRateHistoryPoint[];
}

function formatDate(ts: string): string {
  const d = new Date(ts);
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function FundingRateHistoryChart({ data }: Props) {
  if (data.length < 2) {
    return (
      <div className="dot-card p-6">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-4">펀딩비 히스토리</h2>
        <p className="text-dot-muted text-sm">펀딩비 데이터를 불러오는 중...</p>
      </div>
    );
  }

  const rates = data.map((d) => d.rate * 100);
  const min = Math.min(...rates);
  const max = Math.max(...rates);
  const range = max - min || 0.01;

  const CW = 100;
  const CH = 120;

  const dots = data.map((d, i) => {
    const pos = mapToChart(i, data.length, d.rate * 100, min, range, CW, CH);
    return { ...pos, rate: d.rate * 100 };
  });

  const points = dots.map((d) => `${d.x},${d.y}`).join(' ');

  // Zero line position
  const zeroY = min <= 0 && max >= 0
    ? 4 + (CH - 8) - ((0 - min) / range) * (CH - 8)
    : null;

  const yLabels = [max, (max + min) / 2, min].map((v) => `${v.toFixed(3)}%`);
  const xLabels = [data[0], data[Math.floor(data.length / 2)], data[data.length - 1]].map((d) =>
    formatDate(d.timestamp)
  );

  return (
    <ChartBase title="펀딩비 히스토리" yAxisLabels={yLabels} xAxisLabels={xLabels} patternId="dotGridFR">
      {zeroY !== null && (
        <line
          x1={4}
          y1={zeroY}
          x2={96}
          y2={zeroY}
          stroke="#ef4444"
          strokeWidth="0.5"
          strokeDasharray="2 2"
          vectorEffect="non-scaling-stroke"
          opacity={0.5}
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke="#1a1a1a"
        strokeWidth="1"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={1.2}
          fill={d.rate >= 0 ? '#ef4444' : '#3b82f6'}
        />
      ))}
    </ChartBase>
  );
}
