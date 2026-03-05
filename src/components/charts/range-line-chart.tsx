'use client';

import { ColorType, LineSeries, createChart, type IChartApi, type ISeriesApi, type LineData, type Time } from 'lightweight-charts';
import { useEffect, useMemo, useRef, useState } from 'react';

interface IndicatorPoint {
  collectedAt: string;
  value: number;
}

interface RangeLineChartProps {
  points: IndicatorPoint[];
  tone: string;
}

const RANGE_OPTIONS = [30, 90, 365] as const;

function toLineData(points: IndicatorPoint[]): LineData<Time>[] {
  return points.map((point) => ({
    time: Math.floor(new Date(point.collectedAt).getTime() / 1000) as Time,
    value: point.value,
  }));
}

export function RangeLineChart({ points, tone }: RangeLineChartProps) {
  const [rangeDays, setRangeDays] = useState<(typeof RANGE_OPTIONS)[number]>(90);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  const filteredPoints = useMemo(() => {
    if (points.length === 0) return [];
    const latest = new Date(points[points.length - 1].collectedAt).getTime();
    const cutoff = latest - rangeDays * 24 * 60 * 60 * 1000;
    return points.filter((point) => new Date(point.collectedAt).getTime() >= cutoff);
  }, [points, rangeDays]);

  const chartData = useMemo(() => toLineData(filteredPoints), [filteredPoints]);

  useEffect(() => {
    if (!containerRef.current || chartRef.current) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#64748B',
        fontFamily: 'var(--font-geist-mono)',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(100, 116, 139, 0.06)' },
        horzLines: { color: 'rgba(100, 116, 139, 0.06)' },
      },
      leftPriceScale: { visible: false },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.2, bottom: 0.2 } },
      timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false },
      crosshair: {
        vertLine: { color: 'rgba(100, 116, 139, 0.25)' },
        horzLine: { color: 'rgba(100, 116, 139, 0.25)' },
      },
    });

    const series = chart.addSeries(LineSeries, {
      color: tone,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerRadius: 3,
      crosshairMarkerBorderColor: tone,
      crosshairMarkerBackgroundColor: '#060B16',
    });

    chartRef.current = chart;
    seriesRef.current = series;

    return () => {
      seriesRef.current = null;
      chartRef.current = null;
      chart.remove();
    };
  }, [tone]);

  useEffect(() => {
    if (!seriesRef.current) return;
    seriesRef.current.setData(chartData);
    chartRef.current?.timeScale().fitContent();
  }, [chartData]);

  const min = chartData.length > 0 ? Math.min(...chartData.map((point) => point.value)) : null;
  const max = chartData.length > 0 ? Math.max(...chartData.map((point) => point.value)) : null;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-elevated)] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex overflow-hidden rounded-full border border-[var(--border)] bg-[var(--card)] p-1">
          {RANGE_OPTIONS.map((days) => (
            <button
              key={days}
              type="button"
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                days === rangeDays ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setRangeDays(days)}
            >
              {days === 365 ? '1Y' : `${days}D`}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          {min !== null && max !== null ? `min ${min.toLocaleString()} · max ${max.toLocaleString()}` : '데이터 없음'}
        </p>
      </div>
      {chartData.length < 2 ? (
        <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-[var(--border-light)] text-sm text-slate-500">
          차트 데이터가 충분하지 않습니다.
        </div>
      ) : (
        <div ref={containerRef} className="h-72 w-full" />
      )}
    </div>
  );
}
