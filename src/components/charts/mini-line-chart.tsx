'use client';

import { ColorType, LineSeries, createChart, type IChartApi, type ISeriesApi, type Time, type LineData } from 'lightweight-charts';
import { useEffect, useMemo, useRef } from 'react';

interface ChartPoint {
  collectedAt: string;
  value: number;
}

interface MiniLineChartProps {
  points: ChartPoint[];
  tone: string;
}

function toChartData(points: ChartPoint[]): LineData<Time>[] {
  return points.map((point) => ({
    time: Math.floor(new Date(point.collectedAt).getTime() / 1000) as Time,
    value: point.value,
  }));
}

export function MiniLineChart({ points, tone }: MiniLineChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const chartData = useMemo(() => toChartData(points), [points]);

  useEffect(() => {
    if (!containerRef.current || chartRef.current) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#64748B',
        fontFamily: 'var(--font-geist-mono)',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'rgba(100, 116, 139, 0.06)' },
        horzLines: { color: 'rgba(100, 116, 139, 0.06)' },
      },
      leftPriceScale: { visible: false },
      rightPriceScale: { visible: false },
      timeScale: {
        visible: false,
        borderVisible: false,
        timeVisible: false,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: { visible: false, labelVisible: false },
        horzLine: { visible: false, labelVisible: false },
      },
    });

    const series = chart.addSeries(LineSeries, {
      color: tone,
      lineWidth: 2,
      lastValueVisible: false,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
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
    if (!seriesRef.current || chartData.length < 2) return;
    seriesRef.current.setData(chartData);
    chartRef.current?.timeScale().fitContent();
  }, [chartData]);

  if (chartData.length < 2) {
    return (
      <div className="flex h-24 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] text-xs text-slate-500">
        차트 데이터 없음
      </div>
    );
  }

  return <div ref={containerRef} className="h-24 w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card-elevated)]" />;
}
