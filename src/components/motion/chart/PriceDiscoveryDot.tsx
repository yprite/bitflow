'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from '../core/useReducedMotion';
import { DOT_COLOR } from '../core/constants';

interface PriceDiscoveryDotProps {
  /** Final x position in the SVG viewBox coordinate. */
  cx: number;
  /** Final y position in the SVG viewBox coordinate. */
  cy: number;
  /** Final radius. */
  r: number;
  /** Key that changes when new data arrives. */
  dataKey: string | number;
}

interface ScatterDot {
  offsetX: number;
  offsetY: number;
  size: number;
}

const SCATTER_RADIUS = 4;
const CLUSTER_COUNT = 7;
const CONVERGE_DURATION = 1200;

/**
 * SVG component showing the newest data point as a cluster
 * that coalesces into a single positioned dot.
 *
 * Represents "price discovery" — the market finding where the value should be.
 */
export default function PriceDiscoveryDot({ cx, cy, r, dataKey }: PriceDiscoveryDotProps) {
  const reducedMotion = useReducedMotion();
  const [converged, setConverged] = useState(true);
  const [scatter] = useState<ScatterDot[]>(() =>
    Array.from({ length: CLUSTER_COUNT }, () => ({
      offsetX: (Math.random() - 0.5) * SCATTER_RADIUS * 2,
      offsetY: (Math.random() - 0.5) * SCATTER_RADIUS * 2,
      size: 0.3 + Math.random() * 0.5,
    }))
  );

  useEffect(() => {
    if (reducedMotion) {
      setConverged(true);
      return;
    }

    setConverged(false);
    const timeout = setTimeout(() => setConverged(true), CONVERGE_DURATION);
    return () => clearTimeout(timeout);
  }, [dataKey, reducedMotion]);

  if (converged) {
    return <circle cx={cx} cy={cy} r={r} fill={DOT_COLOR} />;
  }

  return (
    <g>
      {scatter.map((s, i) => (
        <circle
          key={i}
          cx={cx + (converged ? 0 : s.offsetX)}
          cy={cy + (converged ? 0 : s.offsetY)}
          r={converged ? r : s.size}
          fill={DOT_COLOR}
          opacity={converged ? 1 : 0.5}
          style={{
            transition: `all ${CONVERGE_DURATION}ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
          }}
        />
      ))}
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.5}
        fill={DOT_COLOR}
        opacity={0.8}
        style={{
          transition: `r ${CONVERGE_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        }}
      />
    </g>
  );
}
