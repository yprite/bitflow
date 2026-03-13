'use client';

import { useState, type ReactNode } from 'react';
import { INTERACTION_RESPONSE_DURATION } from '../core/constants';

interface ConvictionLensProps {
  children: (state: {
    hoveredIndex: number | null;
    getScale: (index: number) => number;
    onHover: (index: number | null) => void;
  }) => ReactNode;
  /** Total number of items in the grid. */
  itemCount: number;
}

/**
 * Hover state manager for the heatmap grid.
 * When one tile is hovered, it magnifies while neighbors shrink slightly.
 * Creates a "conviction lens" — focusing attention at the expense of periphery.
 *
 * Uses render-prop pattern to avoid dictating grid layout.
 */
export default function ConvictionLens({ children, itemCount }: ConvictionLensProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const getScale = (index: number): number => {
    if (hoveredIndex === null) return 1;
    if (index === hoveredIndex) return 1.3;
    return 0.85;
  };

  return (
    <>
      {children({
        hoveredIndex,
        getScale,
        onHover: setHoveredIndex,
      })}
    </>
  );
}

/**
 * Style helper for conviction lens dot scaling.
 */
export function convictionDotStyle(
  scale: number,
  reducedMotion: boolean,
): React.CSSProperties {
  return {
    transform: `scale(${scale})`,
    transition: reducedMotion ? 'none' : `transform ${INTERACTION_RESPONSE_DURATION}ms ease-out`,
  };
}
