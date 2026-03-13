'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../core/useReducedMotion';
import { DOT_STAGGER_MS, DATA_TRANSITION_DURATION } from '../core/constants';

interface DotGaugeProps {
  /** Number of active dots (0 to max). */
  activeDots: number;
  /** Total number of dots. */
  max?: number;
  /** Color for active dots. */
  activeColor?: string;
  /** Dot size in px. */
  dotSize?: number;
}

/**
 * Animated dot gauge for funding rate and similar indicators.
 * Features staggered Signal Emergence on value changes.
 */
export default function DotGauge({
  activeDots,
  max = 8,
  activeColor = '#00c853',
  dotSize = 8,
}: DotGaugeProps) {
  const reducedMotion = useReducedMotion();
  const [visibleDots, setVisibleDots] = useState<boolean[]>(
    Array.from({ length: max }, (_, i) => i < activeDots)
  );
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    if (reducedMotion) {
      setVisibleDots(Array.from({ length: max }, (_, i) => i < activeDots));
      return;
    }

    // Reset all to inactive, then stagger emergence
    setVisibleDots(Array.from({ length: max }, () => false));

    for (let i = 0; i < max; i++) {
      const timeout = setTimeout(() => {
        setVisibleDots(prev => prev.map((v, j) => j === i ? i < activeDots : v));
      }, i * DOT_STAGGER_MS);
      timeoutsRef.current.push(timeout);
    }

    return () => timeoutsRef.current.forEach(clearTimeout);
  }, [activeDots, max, reducedMotion]);

  return (
    <div className="flex gap-1" role="img" aria-label={`Gauge: ${activeDots} of ${max}`}>
      {visibleDots.map((active, i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            width: `${dotSize}px`,
            height: `${dotSize}px`,
            backgroundColor: active ? activeColor : '#e5e7eb',
            transition: reducedMotion ? 'none' : `all ${DATA_TRANSITION_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1)`,
            transform: active ? 'scale(1)' : 'scale(0.7)',
          }}
        />
      ))}
    </div>
  );
}
