'use client';

import type { ExtendedKimpHistoryPoint } from '@/lib/types';
import ChartBase, { mapToChart } from './chart-base';

interface Props {
  data: ExtendedKimpHistoryPoint[];
}

function formatDate(ts: string): string {
  const d = new Date(ts);
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

const krwFormatter = new Intl.NumberFormat('ko-KR', {
  maximumFractionDigits: 0,
});

export default function ExchangeRateChart({ data }: Props) {
  if (data.length < 2) {
    return (
      <div className="dot-card p-6">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-4">환율 추이 (USD/KRW)</h2>
        <p className="text-dot-muted text-sm">환율 데이터를 불러오는 중...</p>
      </div>
    );
  }

  const rates = data.map((d) => d.usdKrw);
  const min = Math.min(...rates);
  const max = Math.max(...rates);
  const range = max - min || 1;

  const CW = 100;
  const CH = 120;

  const dots = data.map((d, i) => {
    const pos = mapToChart(i, data.length, d.usdKrw, min, range, CW, CH);
    return { ...pos, value: d.usdKrw };
  });

  const points = dots.map((d) => `${d.x},${d.y}`).join(' ');

  const yLabels = [max, (max + min) / 2, min].map((v) => `${krwFormatter.format(v)}원`);
  const xLabels = [data[0], data[Math.floor(data.length / 2)], data[data.length - 1]].map((d) =>
    formatDate(d.collectedAt)
  );

  return (
    <ChartBase title="환율 추이 (USD/KRW)" yAxisLabels={yLabels} xAxisLabels={xLabels} patternId="dotGridFX">
      <polyline
        points={points}
        fill="none"
        stroke="#1a1a1a"
        strokeWidth="1"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={1} fill="#1a1a1a" />
      ))}
    </ChartBase>
  );
}
