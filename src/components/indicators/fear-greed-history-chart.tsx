'use client';

import type { FearGreedHistoryPoint } from '@/lib/types';
import { useReducedMotion } from '@/components/motion/core/useReducedMotion';
import ChartBase, { mapToChart, valueToY } from './chart-base';
import {
  SignalDensity,
  ThresholdField,
  DataAfterglow,
  UncertaintyHaze,
  LiveEdgePulse,
  type ChartPoint,
  type ThresholdFieldConfig,
} from '@/components/motion/chart/chart-overlays';

interface Props {
  data: FearGreedHistoryPoint[];
}

function formatDate(ts: string): string {
  const d = new Date(ts);
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function FearGreedHistoryChart({ data }: Props) {
  const reducedMotion = useReducedMotion();

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

  const chartPoints: ChartPoint[] = data.map((d, i) => {
    const pos = mapToChart(i, data.length, d.value, min, range, CW, CH);
    return { ...pos, value: d.value };
  });

  const polyline = chartPoints.map((d) => `${d.x},${d.y}`).join(' ');

  // Threshold zones at 25 (fear), 50 (neutral), 75 (greed)
  const fgThresholds = [25, 50, 75];
  const thresholdConfigs: ThresholdFieldConfig[] = fgThresholds.map((t) => {
    const nearCount = data.filter((d) => Math.abs(d.value - t) < 10).length;
    return {
      value: t,
      y: valueToY(t, min, range, CH),
      xRange: [4, 96] as [number, number],
      activation: Math.min(nearCount / data.length * 3, 1),
      bandHeight: 5,
    };
  });

  const yLabels = ['100', '50', '0'];
  const xLabels = [data[0], data[Math.floor(data.length / 2)], data[data.length - 1]].map((d) =>
    formatDate(d.timestamp)
  );

  const underlays = (
    <>
      {/* Subtle zone lines */}
      {fgThresholds.map((v) => (
        <line
          key={v}
          x1={4}
          y1={valueToY(v, min, range, CH)}
          x2={96}
          y2={valueToY(v, min, range, CH)}
          stroke="#1a1a1a"
          strokeWidth="0.3"
          strokeDasharray="1 3"
          vectorEffect="non-scaling-stroke"
          opacity={v === 50 ? 0.15 : 0.08}
        />
      ))}
      <ThresholdField thresholds={thresholdConfigs} />
    </>
  );

  const overlays = (
    <>
      <UncertaintyHaze points={chartPoints} extent={0.12} maxScatter={1.8} />
      <DataAfterglow
        points={chartPoints}
        config={{ trailLength: 2, haloRadius: 3 }}
        reducedMotion={reducedMotion}
      />
      <LiveEdgePulse
        points={chartPoints}
        config={{ trailLength: 3, rippleRadius: 6 }}
        reducedMotion={reducedMotion}
      />
    </>
  );

  return (
    <ChartBase
      title="공포탐욕지수 히스토리"
      yAxisLabels={yLabels}
      xAxisLabels={xLabels}
      patternId="dotGridFG"
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
          thresholds: [25, 75],
          minRadius: 0.6,
          maxRadius: 2.0,
          minOpacity: 0.2,
          maxOpacity: 0.85,
        }}
      />
    </ChartBase>
  );
}
