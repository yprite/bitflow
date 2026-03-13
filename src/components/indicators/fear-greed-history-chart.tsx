'use client';

import type { FearGreedHistoryPoint } from '@/lib/types';
import ChartBase, { mapToChart } from './chart-base';

interface Props {
  data: FearGreedHistoryPoint[];
}

function formatDate(ts: string): string {
  const d = new Date(ts);
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function getColor(value: number): string {
  if (value >= 75) return '#ef4444'; // Extreme Greed
  if (value >= 55) return '#f97316'; // Greed
  if (value >= 45) return '#a3a3a3'; // Neutral
  if (value >= 25) return '#3b82f6'; // Fear
  return '#1e40af'; // Extreme Fear
}

export default function FearGreedHistoryChart({ data }: Props) {
  if (data.length < 2) {
    return (
      <div className="dot-card p-6">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-4">공포탐욕지수 히스토리</h2>
        <p className="text-dot-muted text-sm">공포탐욕지수 데이터를 불러오는 중...</p>
      </div>
    );
  }

  const CW = 100;
  const CH = 120;
  const min = 0;
  const max = 100;
  const range = 100;

  const dots = data.map((d, i) => {
    const pos = mapToChart(i, data.length, d.value, min, range, CW, CH);
    return { ...pos, value: d.value };
  });

  const points = dots.map((d) => `${d.x},${d.y}`).join(' ');

  const yLabels = ['100', '50', '0'];
  const xLabels = [data[0], data[Math.floor(data.length / 2)], data[data.length - 1]].map((d) =>
    formatDate(d.timestamp)
  );

  // Zone lines at 25, 50, 75
  const zoneLines = [25, 50, 75].map((v) => ({
    y: 4 + (CH - 8) - ((v - min) / range) * (CH - 8),
    v,
  }));

  return (
    <ChartBase title="공포탐욕지수 히스토리" yAxisLabels={yLabels} xAxisLabels={xLabels} patternId="dotGridFG">
      {zoneLines.map((z) => (
        <line
          key={z.v}
          x1={4}
          y1={z.y}
          x2={96}
          y2={z.y}
          stroke={z.v === 50 ? '#a3a3a3' : z.v === 75 ? '#ef4444' : '#3b82f6'}
          strokeWidth="0.3"
          strokeDasharray="1 3"
          vectorEffect="non-scaling-stroke"
          opacity={0.4}
        />
      ))}
      <polyline
        points={points}
        fill="none"
        stroke="#1a1a1a"
        strokeWidth="1"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={1.5} fill={getColor(d.value)} />
      ))}
    </ChartBase>
  );
}
