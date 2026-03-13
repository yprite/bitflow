'use client';

import { useState, useMemo } from 'react';
import type { KimpHistoryPoint } from '@/lib/types';
import DotTabBar from './motion/transitions/DotTabBar';
import { useFieldTransition } from './motion/transitions/useFieldTransition';
import { useReducedMotion } from './motion/core/useReducedMotion';
import LivePulse from './motion/indicators/LivePulse';
import {
  SignalDensity,
  ThresholdField,
  PressureField,
  DataAfterglow,
  UncertaintyHaze,
  type ChartPoint,
  type ThresholdFieldConfig,
} from './motion/chart/chart-overlays';
import { PREMIUM_THRESHOLDS } from './motion/core/constants';

interface KimpChartProps {
  data: KimpHistoryPoint[];
}

type Period = '7d' | '30d';

const PERIOD_TABS = [
  { key: '7d', label: '7일' },
  { key: '30d', label: '30일' },
];

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
  const reducedMotion = useReducedMotion();
  const fieldTransition = useFieldTransition(period, {
    duration: 350,
    fadeStrength: 0.12,
    blurStrength: 1,
  });

  const now = Date.now();
  const cutoff = period === '7d' ? now - 7 * 86400_000 : now - 30 * 86400_000;
  const filtered = data.filter((point) => new Date(point.collectedAt).getTime() >= cutoff);

  const chartMetrics = useMemo(() => {
    if (filtered.length < 2) return null;

    const values = filtered.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const padding = 4;
    const chartHeight = 120;
    const chartWidth = 100;

    const chartPoints: ChartPoint[] = filtered.map((point, i) => {
      const x = padding + (i / (filtered.length - 1)) * (chartWidth - padding * 2);
      const y = padding + (chartHeight - padding * 2) - ((point.value - min) / range) * (chartHeight - padding * 2);
      return { x, y, value: point.value };
    });

    // Threshold activation: how many points are near each threshold
    const thresholdConfigs: ThresholdFieldConfig[] = PREMIUM_THRESHOLDS
      .filter((t) => t >= min && t <= max) // only thresholds in visible range
      .map((t) => {
        const nearCount = values.filter((v) => Math.abs(v - t) < 1).length;
        const activation = Math.min(nearCount / values.length * 4, 1);
        const y = padding + (chartHeight - padding * 2) - ((t - min) / range) * (chartHeight - padding * 2);

        return {
          value: t,
          y,
          xRange: [padding, chartWidth - padding] as [number, number],
          activation,
        };
      });

    return { values, min, max, range, chartPoints, thresholdConfigs };
  }, [filtered]);

  if (!chartMetrics) {
    return (
      <div className="dot-card p-6">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <LivePulse size={4} />
          김프 히스토리
        </h2>
        <p className="text-dot-muted text-sm">데이터 수집 중... 저장된 히스토리가 쌓이면 표시됩니다.</p>
      </div>
    );
  }

  const { min, max, range, chartPoints, thresholdConfigs } = chartMetrics;
  const padding = 4;
  const chartHeight = 120;
  const chartWidth = 100;
  const guideLines = [padding, padding + (chartHeight - padding * 2) / 2, chartHeight - padding];

  const polylinePoints = chartPoints.map(d => `${d.x},${d.y}`).join(' ');

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
          <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider flex items-center gap-1.5">
              <LivePulse size={4} />
              김프 히스토리
            </h2>
          <DotTabBar
            tabs={PERIOD_TABS}
            activeKey={period}
            onChange={(key) => setPeriod(key as Period)}
            indicatorDots={5}
            indicatorRadius={1.5}
            indicatorSpacing={3}
            transitionDuration={350}
          />
        </div>
        <div className="flex gap-3" style={fieldTransition.style}>
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

              {/* Threshold density bands — below data */}
              <ThresholdField thresholds={thresholdConfigs} />

              {/* Pressure field — momentum compression */}
              <PressureField points={chartPoints} threshold={0.4} />

              {/* Line connecting dots */}
              <polyline
                points={polylinePoints}
                fill="none"
                stroke="#1a1a1a"
                strokeWidth="1"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />

              {/* Signal-density data dots (replaces uniform circles) */}
              <SignalDensity
                points={chartPoints}
                config={{
                  thresholds: PREMIUM_THRESHOLDS,
                  minRadius: 0.6,
                  maxRadius: 2.2,
                  minOpacity: 0.3,
                  maxOpacity: 0.92,
                }}
              />

              {/* Uncertainty haze on trailing edge */}
              <UncertaintyHaze points={chartPoints} extent={0.15} maxScatter={2} />

              {/* Afterglow on newest points */}
              <DataAfterglow
                points={chartPoints}
                config={{ trailLength: 4, haloRadius: 3.5 }}
                reducedMotion={reducedMotion}
              />
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
