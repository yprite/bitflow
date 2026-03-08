'use client';

import { ColorType, LineSeries, createChart, type IChartApi, type ISeriesApi, type LineData, type Time } from 'lightweight-charts';
import { useEffect, useMemo, useRef } from 'react';

interface SessionPoint {
  collectedAt: string;
  value: number;
}

interface SessionLineChartProps {
  points: SessionPoint[];
  tone: string;
}

function toLineData(points: SessionPoint[]): LineData<Time>[] {
  return points.map((point) => ({
    time: Math.floor(new Date(point.collectedAt).getTime() / 1000) as Time,
    value: point.value,
  }));
}

export function SessionLineChart({ points, tone }: SessionLineChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const chartData = useMemo(() => toLineData(points), [points]);

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
        vertLines: { color: 'rgba(100, 116, 139, 0.08)' },
        horzLines: { color: 'rgba(100, 116, 139, 0.08)' },
      },
      leftPriceScale: { visible: false },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.2, bottom: 0.18 } },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: { color: 'rgba(100, 116, 139, 0.22)' },
        horzLine: { color: 'rgba(100, 116, 139, 0.22)' },
      },
    });

    const series = chart.addSeries(LineSeries, {
      color: tone,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerRadius: 4,
      crosshairMarkerBorderColor: tone,
      crosshairMarkerBackgroundColor: '#08111F',
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
      <div className="flex h-72 items-center justify-center rounded-[28px] border border-white/10 bg-[#0D172A]/85 text-sm text-slate-500">
        차트 데이터가 충분하지 않습니다.
      </div>
    );
  }

  return <div ref={containerRef} className="h-72 w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0D172A]/85" />;
}
