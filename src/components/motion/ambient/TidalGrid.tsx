'use client';

import { useEffect, useCallback } from 'react';
import { useDotField } from '../core/useDotField';
import { useReducedMotion } from '../core/useReducedMotion';
import { useResizeObserver } from '../core/useResizeObserver';
import type { Dot } from '../core/dot-types';
import { radialWave } from '../core/dot-math';
import {
  AMBIENT_GRID_SPACING,
  AMBIENT_BASE_RADIUS,
  AMBIENT_MAX_OPACITY,
  AMBIENT_WAVE_SPEED,
  AMBIENT_WAVE_AMPLITUDE,
  DOT_COLOR,
} from '../core/constants';

interface TidalGridProps {
  /** Attraction point for Data Breathing effect. Null = center. */
  attractionTarget?: { x: number; y: number } | null;
  /** 0–1 strength of attraction toward target */
  attractionStrength?: number;
}

/**
 * Fullscreen ambient dot grid background with slow breathing wave.
 * This is the "weather" of the product — always present, barely noticed.
 *
 * The dots grow and shrink in radial waves from viewport center.
 * When attractionTarget is set (Data Breathing), the wave center
 * drifts toward the target position.
 */
export default function TidalGrid({
  attractionTarget = null,
  attractionStrength = 0,
}: TidalGridProps) {
  const reducedMotion = useReducedMotion();
  const { ref: containerRef, size } = useResizeObserver<HTMLDivElement>();

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  const { canvasRef, updateModifier } = useDotField({
    width: size.width || 1,
    height: size.height || 1,
    dpr,
    baseRadius: AMBIENT_BASE_RADIUS,
    gridSpacing: AMBIENT_GRID_SPACING,
    color: DOT_COLOR,
    maxOpacity: AMBIENT_MAX_OPACITY,
    reducedMotion,
  });

  // Wave modifier — the core tidal animation
  const createModifier = useCallback(() => {
    let waveCenterX = (size.width || 1) / 2;
    let waveCenterY = (size.height || 1) / 2;

    return (dots: Dot[], time: number) => {
      // Data Breathing: drift wave center toward attraction target
      if (attractionTarget && attractionStrength > 0) {
        const targetX = attractionTarget.x;
        const targetY = attractionTarget.y;
        const drift = attractionStrength * 0.02;
        waveCenterX += (targetX - waveCenterX) * drift;
        waveCenterY += (targetY - waveCenterY) * drift;
      } else {
        // Slowly return to center
        const cx = (size.width || 1) / 2;
        const cy = (size.height || 1) / 2;
        waveCenterX += (cx - waveCenterX) * 0.005;
        waveCenterY += (cy - waveCenterY) * 0.005;
      }

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        const wave = radialWave(
          dot.x, dot.y,
          waveCenterX, waveCenterY,
          time,
          AMBIENT_WAVE_SPEED * 1000, // convert to match time in seconds
          300,
        );

        const radiusMultiplier = 1 + (wave - 0.5) * AMBIENT_WAVE_AMPLITUDE * 2;
        dot.currentRadius = dot.baseRadius * Math.max(0.1, radiusMultiplier);
        dot.opacity = AMBIENT_MAX_OPACITY * (0.6 + wave * 0.4);
      }
    };
  }, [size.width, size.height, attractionTarget, attractionStrength]);

  useEffect(() => {
    if (!reducedMotion && size.width > 0) {
      updateModifier(createModifier());
    }
  }, [reducedMotion, size.width, size.height, createModifier, updateModifier]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
      />
    </div>
  );
}
