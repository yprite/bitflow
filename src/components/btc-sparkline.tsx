'use client';

import { useEffect, useId, useState } from 'react';
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
  const [isMobile, setIsMobile] = useState(false);
  const uid = useId().replace(/:/g, '');

  useEffect(() => {
    fetch('/api/btc-chart')
      .then((r) => r.ok ? r.json() : [])
      .then((data: PricePoint[]) => {
        if (Array.isArray(data) && data.length >= 2) setPoints(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)');
    const update = () => setIsMobile(media.matches);

    update();

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }

    media.addListener(update);
    return () => media.removeListener(update);
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
  const blurEdgeX = W * (isMobile ? 0.16 : 0.26);
  const blendWidth = isMobile ? 16 : 22;
  const fillTopOpacity = isMobile ? 0.12 : 0.06;
  const blurStdDeviation = isMobile ? 1.0 : 1.5;
  const blurGroupOpacity = isMobile ? 0.88 : 0.72;
  const lineOpacity = isMobile ? 0.2 : 0.1;
  const strokeWidth = isMobile ? 1.8 : 1.5;
  const fillId = `btc-spark-fill-${uid}`;
  const blurId = `btc-spark-blur-${uid}`;
  const sharpMaskId = `btc-spark-sharp-mask-${uid}`;
  const sharpFadeId = `btc-spark-sharp-fade-${uid}`;

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
      className="absolute top-0 right-0 z-[1] pointer-events-none overflow-hidden"
      style={{
        width: isMobile ? '78%' : '58%',
        height: isMobile ? '70%' : '58%',
      }}
      aria-hidden="true"
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMaxYMin meet"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={fillTopOpacity} />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <filter id={blurId} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={blurStdDeviation} />
          </filter>
          <linearGradient id={sharpFadeId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset={`${(blurEdgeX / W) * 100}%`} stopColor="white" stopOpacity="0" />
            <stop offset={`${((blurEdgeX + blendWidth) / W) * 100}%`} stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="1" />
          </linearGradient>
          <mask id={sharpMaskId}>
            <rect x="0" y="0" width={W} height={H} fill={`url(#${sharpFadeId})`} />
          </mask>
        </defs>
        <g filter={`url(#${blurId})`} opacity={blurGroupOpacity}>
          <path d={areaPath} fill={`url(#${fillId})`} />
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={lineOpacity}
          />
        </g>
        <g mask={`url(#${sharpMaskId})`}>
          <path d={areaPath} fill={`url(#${fillId})`} />
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={lineOpacity}
          />
        </g>
      </svg>
    </div>
  );
}
