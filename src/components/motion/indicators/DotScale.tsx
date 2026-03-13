'use client';

import { useReducedMotion } from '../core/useReducedMotion';
import { DATA_TRANSITION_DURATION } from '../core/constants';

interface DotScaleProps {
  /** Normalized value 0–1 determining how many dots are active and their size. */
  value: number;
  /** Total number of dots. */
  max?: number;
  /** Color function or fixed color for dots. */
  color: string;
  /** Minimum dot size in px. */
  minSize?: number;
  /** Maximum dot size in px. */
  maxSize?: number;
}

/**
 * Variable-size dot scale indicator for the Fear & Greed card.
 * Dots grow in size as their index increases, creating a graduated scale.
 * Active dots are colored; inactive dots are gray and small.
 */
export default function DotScale({
  value,
  max = 10,
  color,
  minSize = 6,
  maxSize = 16,
}: DotScaleProps) {
  const reducedMotion = useReducedMotion();
  const activeDots = Math.round(value * max);

  return (
    <div className="flex gap-[4px] items-end" role="img" aria-label={`Scale: ${Math.round(value * 100)}%`}>
      {Array.from({ length: max }, (_, i) => {
        const isActive = i < activeDots;
        const sizeProgress = i / max;
        const dotSize = isActive
          ? minSize + Math.round(sizeProgress * (maxSize - minSize))
          : minSize;

        return (
          <div
            key={i}
            className={`rounded-full ${isActive && !reducedMotion ? 'dot-breathe' : ''}`}
            style={{
              width: `${dotSize}px`,
              height: `${dotSize}px`,
              backgroundColor: isActive ? color : '#e5e7eb',
              transition: reducedMotion ? 'none' : `all ${DATA_TRANSITION_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1)`,
              '--breathe-delay': `${i * 200}ms`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}
