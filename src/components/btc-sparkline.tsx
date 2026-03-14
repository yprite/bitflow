'use client';

import { useEffect, useState, useRef } from 'react';
import type { SignalLevel } from '@/lib/types';
import { getSignalColor } from './signal-badge';

interface BtcSparklineProps {
  level: SignalLevel;
}

interface PricePoint {
  t: number;
  p: number;
}

export default function BtcSparkline({ level }: BtcSparklineProps) {
  const [points, setPoints] = useState<PricePoint[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/btc-chart')
      .then((r) => r.ok ? r.json() : [])
      .then((data: PricePoint[]) => {
        if (Array.isArray(data) && data.length >= 2) setPoints(data);
      })
      .catch(() => {});
  }, []);

  if (points.length < 2) return null;

  const prices = points.map((p) => p.p);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  // SVG viewBox dimensions
  const W = 400;
  const H = 100;
  const padY = 8;

  // Build path
  const toX = (i: number) => (i / (points.length - 1)) * W;
  const toY = (p: number) => H - padY - ((p - min) / range) * (H - padY * 2);

  const lineParts = points.map((pt, i) => {
    const x = toX(i).toFixed(1);
    const y = toY(pt.p).toFixed(1);
    return i === 0 ? `M${x},${y}` : `L${x},${y}`;
  });
  const linePath = lineParts.join(' ');

  // Area (filled region below line)
  const areaPath = `${linePath} L${W},${H} L0,${H} Z`;

  const color = getSignalColor(level);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="btc-spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.06" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* 연한 영역 채우기 */}
        <path d={areaPath} fill="url(#btc-spark-fill)" />
        {/* 연한 라인 */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.10"
        />
      </svg>
    </div>
  );
}
