'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../core/useReducedMotion';
import { DOT_STAGGER_MS, DATA_TRANSITION_DURATION, PULSE_DURATION, PULSE_STAGGER_MS } from '../core/constants';

interface DotClusterProps {
  /** The data value that determines how many dots are active. */
  value: number;
  /** Maximum number of dots in the cluster. */
  max?: number;
  /** Color for active dots. */
  activeColor?: string;
  /** Color for inactive dots. */
  inactiveColor?: string;
  /** Whether to play a pulse on data change. */
  pulse?: boolean;
}

interface DotState {
  targetRadius: number;
  currentRadius: number;
  opacity: number;
}

/**
 * Animated dot cluster indicator.
 *
 * Replaces the static DotCluster in kimp-card.tsx.
 * Features:
 * - Signal Emergence: dots grow with staggered timing on data change
 * - Market Pulse: brief coordinated pulse confirming fresh data
 */
export default function DotCluster({
  value,
  max = 10,
  activeColor = '#00c853',
  inactiveColor = '#d1d5db',
  pulse: shouldPulse = false,
}: DotClusterProps) {
  const reducedMotion = useReducedMotion();
  const count = Math.min(Math.round(Math.abs(value) * 2), max);
  const isPositive = value >= 0;
  const color = isPositive ? activeColor : '#e53935';

  const [dots, setDots] = useState<DotState[]>(() =>
    Array.from({ length: max }, (_, i) => ({
      targetRadius: i < count ? 8 : 4,
      currentRadius: i < count ? 8 : 4,
      opacity: 1,
    }))
  );

  const prevCountRef = useRef(count);
  const pulseTimeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Signal Emergence: staggered grow-in on value change
  useEffect(() => {
    // Clean up previous timeouts
    pulseTimeoutRefs.current.forEach(clearTimeout);
    pulseTimeoutRefs.current = [];

    const newDots = Array.from({ length: max }, (_, i) => ({
      targetRadius: i < count ? 8 : 4,
      currentRadius: reducedMotion ? (i < count ? 8 : 4) : 0,
      opacity: 1,
    }));

    if (reducedMotion) {
      setDots(newDots);
      prevCountRef.current = count;
      return;
    }

    // Start all dots at 0, then stagger their emergence
    setDots(newDots);

    for (let i = 0; i < max; i++) {
      const delay = i * DOT_STAGGER_MS;
      const timeout = setTimeout(() => {
        setDots(prev => prev.map((d, j) =>
          j === i ? { ...d, currentRadius: d.targetRadius } : d
        ));
      }, delay);
      pulseTimeoutRefs.current.push(timeout);
    }

    prevCountRef.current = count;

    return () => {
      pulseTimeoutRefs.current.forEach(clearTimeout);
    };
  }, [count, max, reducedMotion]);

  // Market Pulse: brief scale-up on shouldPulse change
  useEffect(() => {
    if (!shouldPulse || reducedMotion) return;

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    for (let i = 0; i < max; i++) {
      // Pulse up
      const upTimeout = setTimeout(() => {
        setDots(prev => prev.map((d, j) =>
          j === i ? { ...d, currentRadius: d.targetRadius * 1.15 } : d
        ));
      }, i * PULSE_STAGGER_MS);
      timeouts.push(upTimeout);

      // Pulse down
      const downTimeout = setTimeout(() => {
        setDots(prev => prev.map((d, j) =>
          j === i ? { ...d, currentRadius: d.targetRadius } : d
        ));
      }, i * PULSE_STAGGER_MS + PULSE_DURATION / 2);
      timeouts.push(downTimeout);
    }

    return () => timeouts.forEach(clearTimeout);
  }, [shouldPulse, max, reducedMotion]);

  return (
    <div className="flex gap-[3px] items-center" role="img" aria-label={`Premium indicator: ${value.toFixed(2)}%`}>
      {dots.map((dot, i) => (
        <div
          key={i}
          className={`rounded-full ${i < count && !reducedMotion ? 'dot-breathe' : ''}`}
          style={{
            width: `${dot.currentRadius}px`,
            height: `${dot.currentRadius}px`,
            backgroundColor: i < count ? color : inactiveColor,
            transition: reducedMotion ? 'none' : `all ${DATA_TRANSITION_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1)`,
            opacity: dot.opacity,
            '--breathe-delay': `${i * 300}ms`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
