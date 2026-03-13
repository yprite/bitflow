'use client';

import type { FundingRateHistoryPoint } from '@/lib/types';
import { useReducedMotion } from '@/components/motion/core/useReducedMotion';
import ChartBase, { mapToChart, valueToY } from './chart-base';
import {
  SignalDensity,
  ThresholdField,
  PressureField,
  DataAfterglow,
  type ChartPoint,
  type ThresholdFieldConfig,
} from '@/components/motion/chart/chart-overlays';

interface Props {
  data: FundingRateHistoryPoint[];
}

function formatDate(ts: string): string {
  const d = new Date(ts);
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function FundingRateHistoryChart({ data }: Props) {
  const reducedMotion = useReducedMotion();

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

  const chartPoints: ChartPoint[] = data.map((d, i) => {
    const pos = mapToChart(i, data.length, d.rate * 100, min, range, CW, CH);
    return { ...pos, value: d.rate * 100 };
  });

  const polyline = chartPoints.map((d) => `${d.x},${d.y}`).join(' ');

  // Zero line position
  const zeroY = min <= 0 && max >= 0
    ? valueToY(0, min, range, CH)
    : null;

  // Threshold: zero line is the key threshold for funding rate
  const thresholds: ThresholdFieldConfig[] = [];
  if (zeroY !== null) {
    const nearZero = rates.filter((r) => Math.abs(r) < 0.01).length;
    thresholds.push({
      value: 0,
      y: zeroY,
      xRange: [4, 96],
      activation: Math.min(nearZero / rates.length * 6, 1),
      bandHeight: 3,
    });
  }

  const yLabels = [max, (max + min) / 2, min].map((v) => `${v.toFixed(3)}%`);
  const xLabels = [data[0], data[Math.floor(data.length / 2)], data[data.length - 1]].map((d) =>
    formatDate(d.timestamp)
  );

  const underlays = (
    <>
      {zeroY !== null && (
        <line
          x1={4}
          y1={zeroY}
          x2={96}
          y2={zeroY}
          stroke="#1a1a1a"
          strokeWidth="0.4"
          strokeDasharray="1.5 2.5"
          vectorEffect="non-scaling-stroke"
          opacity={0.2}
        />
      )}
      <ThresholdField thresholds={thresholds} />
      <PressureField points={chartPoints} threshold={0.005} />
    </>
  );

  const overlays = (
    <DataAfterglow
      points={chartPoints}
      config={{ trailLength: 3, haloRadius: 3 }}
      reducedMotion={reducedMotion}
    />
  );

  return (
    <ChartBase
      title="펀딩비 히스토리"
      yAxisLabels={yLabels}
      xAxisLabels={xLabels}
      patternId="dotGridFR"
      underlays={underlays}
      overlays={overlays}
    >
      <polyline
        points={polyline}
        fill="none"
        stroke="#1a1a1a"
        strokeWidth="1"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <SignalDensity
        points={chartPoints}
        config={{
          thresholds: [0],
          minRadius: 0.5,
          maxRadius: 2.0,
          minOpacity: 0.25,
          maxOpacity: 0.88,
        }}
      />
    </ChartBase>
  );
}
