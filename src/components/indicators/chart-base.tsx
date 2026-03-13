'use client';

import LivePulse from '@/components/motion/indicators/LivePulse';

interface ChartBaseProps {
  title: string;
  yAxisLabels: string[];
  xAxisLabels: string[];
  children: React.ReactNode;
  /** SVG content rendered below data (threshold fields, etc.) */
  underlays?: React.ReactNode;
  /** SVG content rendered above data (afterglow, haze, etc.) */
  overlays?: React.ReactNode;
  chartHeight?: number;
  chartWidth?: number;
  patternId?: string;
}

const PADDING = 4;

export function getChartDimensions(chartWidth = 100, chartHeight = 120) {
  return { padding: PADDING, chartWidth, chartHeight };
}

export function mapToChart(
  index: number,
  total: number,
  value: number,
  min: number,
  range: number,
  chartWidth = 100,
  chartHeight = 120
) {
  const x = PADDING + (index / Math.max(total - 1, 1)) * (chartWidth - PADDING * 2);
  const y = PADDING + (chartHeight - PADDING * 2) - ((value - min) / (range || 1)) * (chartHeight - PADDING * 2);
  return { x, y };
}

/** Map a data-space value to chart y coordinate. */
export function valueToY(
  value: number,
  min: number,
  range: number,
  chartHeight = 120,
) {
  return PADDING + (chartHeight - PADDING * 2) - ((value - min) / (range || 1)) * (chartHeight - PADDING * 2);
}

export default function ChartBase({
  title,
  yAxisLabels,
  xAxisLabels,
  children,
  underlays,
  overlays,
  chartHeight = 120,
  chartWidth = 100,
  patternId = 'dotGrid',
}: ChartBaseProps) {
  const guideLines = [
    PADDING,
    PADDING + (chartHeight - PADDING * 2) / 2,
    chartHeight - PADDING,
  ];

  return (
    <div className="dot-card p-4 sm:p-6">
      <div className="dot-card-inner">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-1.5">
          <LivePulse size={4} />
          {title}
        </h2>
        <div className="flex gap-3">
          <div className="shrink-0 h-32 flex flex-col justify-between text-[11px] text-dot-muted font-mono text-right">
            {yAxisLabels.map((label, i) => (
              <span key={`${label}-${i}`}>{label}</span>
            ))}
          </div>
          <div className="flex-1 min-w-0">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-32"
              preserveAspectRatio="xMidYMid meet"
              overflow="hidden"
            >
              <defs>
                <pattern id={patternId} width="5" height="5" patternUnits="userSpaceOnUse">
                  <circle cx="2.5" cy="2.5" r="0.3" fill="#d1d5db" />
                </pattern>
              </defs>
              <rect width={chartWidth} height={chartHeight} fill={`url(#${patternId})`} rx="1" />
              {guideLines.map((y) => (
                <line
                  key={y}
                  x1={PADDING}
                  y1={y}
                  x2={chartWidth - PADDING}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="0.5"
                  strokeDasharray="1 2"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {underlays}
              {children}
              {overlays}
            </svg>
            <div className="flex justify-between text-[11px] text-dot-muted mt-2 font-mono">
              {xAxisLabels.map((label, i) => (
                <span key={`${label}-${i}`}>{label}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
