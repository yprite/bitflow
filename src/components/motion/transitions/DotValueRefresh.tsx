'use client';

import { type ReactNode } from 'react';
import { useUpdateResidue, type UseUpdateResidueConfig } from './useUpdateResidue';
import { useReducedMotion } from '../core/useReducedMotion';
import { DATA_TRANSITION_DURATION } from '../core/constants';

interface DotValueRefreshProps {
  /** The value to track for changes. */
  value: string | number;
  /** Configuration for residue timing. */
  config?: UseUpdateResidueConfig;
  /** Render function receiving transition state. */
  children: (state: {
    current: string | number;
    previous: string | number | null;
    showResidue: boolean;
    residueOpacity: number;
    justChanged: boolean;
    pulseScale: number;
  }) => ReactNode;
}

/**
 * Render-prop wrapper around useUpdateResidue for DOM-based
 * value refreshes.
 *
 * Use this when you want to add residue/pulse behavior to
 * existing DOM elements (text, spans, divs) without switching
 * to canvas-based dot typography.
 *
 * The consumer controls rendering; this component provides
 * the timing state: residue opacity, pulse scale, change flag.
 */
export default function DotValueRefresh({
  value,
  config,
  children,
}: DotValueRefreshProps) {
  const reducedMotion = useReducedMotion();
  const state = useUpdateResidue(value, config);

  // Compute derived values for easy consumption
  const residueOpacity = state.showResidue
    ? 0.15 * (1 - state.residueProgress)
    : 0;

  const pulseScale = state.justChanged && !reducedMotion
    ? 1.04 // subtle 4% scale up
    : 1;

  return (
    <>
      {children({
        current: state.current,
        previous: state.previous,
        showResidue: state.showResidue,
        residueOpacity,
        justChanged: state.justChanged,
        pulseScale,
      })}
    </>
  );
}

/**
 * Helper: inline style for pulsing/residue on a DOM element.
 */
export function refreshStyle(
  pulseScale: number,
  reducedMotion: boolean,
): React.CSSProperties {
  return {
    transform: `scale(${pulseScale})`,
    transition: reducedMotion
      ? 'none'
      : `transform ${DATA_TRANSITION_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1)`,
    transformOrigin: 'left baseline',
  };
}

/**
 * Helper: inline style for the residue ghost element.
 */
export function residueStyle(
  residueOpacity: number,
  reducedMotion: boolean,
): React.CSSProperties {
  return {
    opacity: residueOpacity,
    position: 'absolute' as const,
    top: 0,
    left: 0,
    pointerEvents: 'none' as const,
    transition: reducedMotion
      ? 'none'
      : `opacity ${DATA_TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
  };
}
