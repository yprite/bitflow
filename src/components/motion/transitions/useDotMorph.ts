'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { parseText, type TextDot } from '../typography/dot-font';
import { useReducedMotion } from '../core/useReducedMotion';
import { easeOut, easeFade, lerp, clamp, valueNoise } from '../core/dot-math';

export type MorphMode =
  | 'crossfade'       // old fades, new fades in (simplest)
  | 'reconfigure'     // dots drift from old positions to new positions
  | 'threshold'       // new dots emerge through a sweeping threshold line
  | 'dissolve';       // old dissolves into noise, new crystallizes from noise

export interface MorphDot {
  /** Current x position (interpolated). */
  x: number;
  /** Current y position (interpolated). */
  y: number;
  /** Current radius (interpolated). */
  radius: number;
  /** Current opacity (interpolated). */
  opacity: number;
  /** Source x (from old text). */
  fromX: number;
  /** Source y. */
  fromY: number;
  /** Target x (in new text). */
  toX: number;
  /** Target y. */
  toY: number;
  /** Whether this dot is active in the old state. */
  wasActive: boolean;
  /** Whether this dot is active in the new state. */
  isActive: boolean;
}

export interface UseDotMorphConfig {
  /** Duration of the morph in ms. Default 500. */
  morphDuration?: number;
  /** Duration the old value's ghost persists after morph. Default 300. */
  residueDuration?: number;
  /** How strongly dots pulse on arrival. 0–1. Default 0.15. */
  pulseStrength?: number;
  /** 0–1 how much old residue is visible. Default 0.12. */
  residueAmount?: number;
  /** Morph mode. Default 'reconfigure'. */
  mode?: MorphMode;
  /** Font scale (px per grid cell). Default 4. */
  fontScale?: number;
  /** Glyph spacing. Default 1. */
  spacing?: number;
}

export interface UseDotMorphResult {
  /** The current array of interpolated dots to render. */
  dots: MorphDot[];
  /** Total width in px. */
  width: number;
  /** Total height in px. */
  height: number;
  /** Whether a morph is currently in progress. */
  morphing: boolean;
  /** Residue dots (ghost of previous state). Null if no residue active. */
  residueDots: MorphDot[] | null;
}

/**
 * Core hook for morphing between two dot-text states.
 *
 * Given a `value` string that changes over time, this hook:
 * 1. Parses both old and new text into dot grids
 * 2. Pairs dots from old → new positions
 * 3. Interpolates position, radius, opacity over `morphDuration`
 * 4. Optionally holds a residue ghost of the old state
 * 5. Applies a subtle pulse on completion
 *
 * The result is a frame-by-frame array of `MorphDot` objects
 * that the consuming canvas/SVG can render directly.
 */
export function useDotMorph(
  value: string,
  config: UseDotMorphConfig = {},
): UseDotMorphResult {
  const {
    morphDuration = 500,
    residueDuration = 300,
    pulseStrength = 0.15,
    residueAmount = 0.12,
    mode = 'reconfigure',
    fontScale = 4,
    spacing = 1,
  } = config;

  const reducedMotion = useReducedMotion();
  const prevValueRef = useRef(value);
  const morphStartRef = useRef(0);
  const rafRef = useRef(0);

  const [morphing, setMorphing] = useState(false);
  const [residueDots, setResidueDots] = useState<MorphDot[] | null>(null);

  // Parse current value
  const currentParsed = parseText(value, spacing);

  // Stable reference for the morph dot array
  const [dots, setDots] = useState<MorphDot[]>(() =>
    currentParsed.dots.map(d => ({
      x: d.x,
      y: d.y,
      radius: d.active ? 1 : 0,
      opacity: d.active ? 1 : 0.06,
      fromX: d.x,
      fromY: d.y,
      toX: d.x,
      toY: d.y,
      wasActive: d.active,
      isActive: d.active,
    }))
  );

  const [dimensions, setDimensions] = useState({
    width: currentParsed.width * fontScale,
    height: currentParsed.height * fontScale,
  });

  // Build paired morph dots between old and new text
  const buildMorphDots = useCallback((
    oldDots: TextDot[],
    newDots: TextDot[],
    oldWidth: number,
    newWidth: number,
  ): MorphDot[] => {
    const maxLen = Math.max(oldDots.length, newDots.length);
    const result: MorphDot[] = [];

    for (let i = 0; i < maxLen; i++) {
      const oldDot = oldDots[i];
      const newDot = newDots[i];

      if (oldDot && newDot) {
        // Both exist: morph from old position to new
        result.push({
          x: oldDot.x,
          y: oldDot.y,
          radius: oldDot.active ? 1 : 0,
          opacity: oldDot.active ? 1 : 0.06,
          fromX: oldDot.x,
          fromY: oldDot.y,
          toX: newDot.x,
          toY: newDot.y,
          wasActive: oldDot.active,
          isActive: newDot.active,
        });
      } else if (newDot) {
        // New dot with no old counterpart: fade in from scattered position
        const scatterX = newDot.x + (Math.random() - 0.5) * 4;
        const scatterY = newDot.y + (Math.random() - 0.5) * 4;
        result.push({
          x: scatterX,
          y: scatterY,
          radius: 0,
          opacity: 0,
          fromX: scatterX,
          fromY: scatterY,
          toX: newDot.x,
          toY: newDot.y,
          wasActive: false,
          isActive: newDot.active,
        });
      } else if (oldDot) {
        // Old dot with no new counterpart: fade out and scatter
        const scatterX = oldDot.x + (Math.random() - 0.5) * 4;
        const scatterY = oldDot.y + (Math.random() - 0.5) * 4;
        result.push({
          x: oldDot.x,
          y: oldDot.y,
          radius: oldDot.active ? 1 : 0,
          opacity: oldDot.active ? 1 : 0,
          fromX: oldDot.x,
          fromY: oldDot.y,
          toX: scatterX,
          toY: scatterY,
          wasActive: oldDot.active,
          isActive: false,
        });
      }
    }

    return result;
  }, []);

  // Interpolation per morph mode
  const interpolate = useCallback((
    morphDots: MorphDot[],
    progress: number, // 0–1
    totalWidth: number,
  ): MorphDot[] => {
    const t = easeOut(progress);

    return morphDots.map((d, i) => {
      let x: number, y: number, radius: number, opacity: number;

      const targetRadius = d.isActive ? 1 : 0;
      const targetOpacity = d.isActive ? 1 : 0.06;
      const fromRadius = d.wasActive ? 1 : 0;
      const fromOpacity = d.wasActive ? 1 : 0.06;

      switch (mode) {
        case 'crossfade': {
          x = lerp(d.fromX, d.toX, t);
          y = lerp(d.fromY, d.toY, t);
          radius = lerp(fromRadius, targetRadius, t);
          opacity = lerp(fromOpacity, targetOpacity, t);
          break;
        }

        case 'reconfigure': {
          // Dots drift from old to new with slight overshoot
          x = lerp(d.fromX, d.toX, t);
          y = lerp(d.fromY, d.toY, t);
          radius = lerp(fromRadius, targetRadius, t);
          opacity = lerp(fromOpacity, targetOpacity, t);

          // Subtle Y wobble during transit
          if (progress > 0.1 && progress < 0.9) {
            const wobble = Math.sin(progress * Math.PI * 3 + i * 0.5) * 0.15;
            y += wobble;
          }

          // Arrival pulse
          if (progress > 0.85 && d.isActive) {
            const pulseT = (progress - 0.85) / 0.15;
            const pulse = Math.sin(pulseT * Math.PI) * pulseStrength;
            radius *= (1 + pulse);
          }
          break;
        }

        case 'threshold': {
          // Sweep from left to right
          const sweepX = t * (totalWidth + 2);
          const dotWorldX = d.toX;
          const crossed = dotWorldX <= sweepX;

          if (crossed) {
            const localT = clamp((sweepX - dotWorldX) / 3, 0, 1);
            x = d.toX;
            y = d.toY;
            radius = lerp(0, targetRadius, easeOut(localT));
            opacity = lerp(0, targetOpacity, easeOut(localT));
          } else {
            x = d.fromX;
            y = d.fromY;
            radius = lerp(fromRadius, 0, t);
            opacity = lerp(fromOpacity, 0, t);
          }
          break;
        }

        case 'dissolve': {
          const noise = valueNoise(d.fromX * 2.3, d.fromY * 3.7, 17);
          const dissolvePoint = noise * 0.5; // when this dot dissolves (0–0.5)
          const reformPoint = 0.5 + noise * 0.5; // when new dot forms (0.5–1)

          if (progress < dissolvePoint) {
            // Still showing old
            x = d.fromX;
            y = d.fromY;
            radius = fromRadius;
            opacity = fromOpacity;
          } else if (progress < reformPoint) {
            // In noise phase — dot is scattered/invisible
            x = lerp(d.fromX, d.toX, 0.5) + (Math.random() - 0.5) * 2;
            y = lerp(d.fromY, d.toY, 0.5) + (Math.random() - 0.5) * 2;
            radius = 0.3;
            opacity = 0.1;
          } else {
            // Reforming into new position
            const localT = clamp((progress - reformPoint) / (1 - reformPoint), 0, 1);
            x = lerp(d.fromX, d.toX, easeOut(localT));
            y = d.toY;
            radius = lerp(0, targetRadius, easeOut(localT));
            opacity = lerp(0, targetOpacity, easeOut(localT));
          }
          break;
        }

        default: {
          x = lerp(d.fromX, d.toX, t);
          y = lerp(d.fromY, d.toY, t);
          radius = lerp(fromRadius, targetRadius, t);
          opacity = lerp(fromOpacity, targetOpacity, t);
        }
      }

      return { ...d, x, y, radius, opacity };
    });
  }, [mode, pulseStrength]);

  // Trigger morph when value changes
  useEffect(() => {
    if (prevValueRef.current === value) return;

    const oldValue = prevValueRef.current;
    prevValueRef.current = value;

    const oldParsed = parseText(oldValue, spacing);
    const newParsed = parseText(value, spacing);

    const newWidth = newParsed.width;
    const newHeight = newParsed.height;

    setDimensions({
      width: newWidth * fontScale,
      height: newHeight * fontScale,
    });

    if (reducedMotion) {
      // Instant transition
      setDots(newParsed.dots.map(d => ({
        x: d.x, y: d.y,
        radius: d.active ? 1 : 0,
        opacity: d.active ? 1 : 0.06,
        fromX: d.x, fromY: d.y,
        toX: d.x, toY: d.y,
        wasActive: d.active, isActive: d.active,
      })));
      return;
    }

    // Build morph pairs
    const morphDots = buildMorphDots(
      oldParsed.dots, newParsed.dots,
      oldParsed.width, newParsed.width,
    );

    // Start residue (ghost of old value)
    if (residueAmount > 0) {
      setResidueDots(oldParsed.dots.map(d => ({
        x: d.x, y: d.y,
        radius: d.active ? 1 : 0,
        opacity: d.active ? residueAmount : 0,
        fromX: d.x, fromY: d.y,
        toX: d.x, toY: d.y,
        wasActive: d.active, isActive: false,
      })));

      // Clear residue after duration
      setTimeout(() => setResidueDots(null), morphDuration + residueDuration);
    }

    // Animate
    setMorphing(true);
    morphStartRef.current = performance.now();
    cancelAnimationFrame(rafRef.current);

    const tick = (now: number) => {
      const elapsed = now - morphStartRef.current;
      const progress = clamp(elapsed / morphDuration, 0, 1);

      setDots(interpolate(morphDots, progress, newWidth));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setMorphing(false);
        // Set final clean state
        setDots(newParsed.dots.map(d => ({
          x: d.x, y: d.y,
          radius: d.active ? 1 : 0,
          opacity: d.active ? 1 : 0.06,
          fromX: d.x, fromY: d.y,
          toX: d.x, toY: d.y,
          wasActive: d.active, isActive: d.active,
        })));
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [value, spacing, fontScale, morphDuration, residueDuration, residueAmount, reducedMotion, buildMorphDots, interpolate]);

  return {
    dots,
    width: dimensions.width,
    height: dimensions.height,
    morphing,
    residueDots,
  };
}
