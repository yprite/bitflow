'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { parseText, type TextDot } from '../typography/dot-font';
import { useReducedMotion } from '../core/useReducedMotion';
import { easeOut, lerp, clamp, valueNoise } from '../core/dot-math';

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
  /** Character index within the rendered string. */
  charIndex: number;
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
  /** 0–1 progress of residue fade. 0 = full residue, 1 = fully faded. */
  residueProgress: number;
}

/**
 * Core hook for morphing between two dot-text states.
 *
 * Given a `value` string that changes over time, this hook:
 * 1. Parses both old and new text into dot grids
 * 2. Pairs dots from old → new positions
 * 3. Interpolates position, radius, opacity over `morphDuration`
 * 4. Holds a residue ghost of the old state that animates out
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
  const morphDoneRef = useRef(false);
  const rafRef = useRef(0);

  const [morphing, setMorphing] = useState(false);
  const [residueDots, setResidueDots] = useState<MorphDot[] | null>(null);
  const [residueProgress, setResidueProgress] = useState(0);

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
      charIndex: d.charIndex,
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
          charIndex: newDot.charIndex,
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
          charIndex: newDot.charIndex,
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
          charIndex: oldDot.charIndex,
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
    return morphDots.map((d, i) => {
      let x: number, y: number, radius: number, opacity: number;

      const targetRadius = d.isActive ? 1 : 0;
      const targetOpacity = d.isActive ? 1 : 0.06;
      const fromRadius = d.wasActive ? 1 : 0;
      const fromOpacity = d.wasActive ? 1 : 0.06;

      switch (mode) {
        case 'crossfade': {
          const t = easeOut(progress);
          x = lerp(d.fromX, d.toX, t);
          y = lerp(d.fromY, d.toY, t);
          radius = lerp(fromRadius, targetRadius, t);
          opacity = lerp(fromOpacity, targetOpacity, t);
          break;
        }

        case 'reconfigure': {
          // Per-character stagger: characters further right start slightly later
          const staggerDelay = d.charIndex * 0.04;
          const staggeredP = clamp(
            (progress - staggerDelay) / Math.max(1 - staggerDelay, 0.01),
            0, 1,
          );

          const stateChanged = d.wasActive !== d.isActive;

          if (staggeredP <= 0) {
            // Before this character's morph begins
            x = d.fromX;
            y = d.fromY;
            radius = fromRadius;
            opacity = fromOpacity;
          } else if (stateChanged && d.wasActive && !d.isActive) {
            // ── Deactivating dot: loosen → scatter → dissolve ──
            const nx = valueNoise(d.fromX * 3.1, d.fromY * 2.7, 13);
            const ny = valueNoise(d.fromY * 2.3, d.fromX * 3.9, 17);

            if (staggeredP < 0.3) {
              // Loosen: radius shrinks, slight outward scatter
              const lt = easeOut(staggeredP / 0.3);
              x = d.fromX + (nx - 0.5) * 1.4 * lt;
              y = d.fromY + (ny - 0.5) * 1.0 * lt;
              radius = lerp(1, 0.35, lt);
              opacity = lerp(1, 0.45, lt);
            } else {
              // Dissolve: scatter further, fade to nothing
              const dt = easeOut((staggeredP - 0.3) / 0.7);
              const baseScatter = 1.4;
              x = d.fromX + (nx - 0.5) * (baseScatter + dt * 1.2);
              y = d.fromY + (ny - 0.5) * (baseScatter * 0.7 + dt * 0.8);
              radius = lerp(0.35, 0, dt);
              opacity = lerp(0.45, 0, dt);
            }
          } else if (stateChanged && !d.wasActive && d.isActive) {
            // ── Activating dot: pre-scatter → gather → crystallize ──
            const nx = valueNoise(d.toX * 2.9, d.toY * 3.3, 7);
            const ny = valueNoise(d.toY * 3.7, d.toX * 2.1, 11);
            const scatterX = (nx - 0.5) * 1.8;
            const scatterY = (ny - 0.5) * 1.2;

            if (staggeredP < 0.35) {
              // Pre-phase: faint dot appears at scattered position
              const pt = staggeredP / 0.35;
              x = d.toX + scatterX;
              y = d.toY + scatterY;
              radius = 0.15 * pt;
              opacity = 0.1 * pt;
            } else {
              // Crystallize: gather inward to final position
              const ct = easeOut((staggeredP - 0.35) / 0.65);
              x = lerp(d.toX + scatterX, d.toX, ct);
              y = lerp(d.toY + scatterY, d.toY, ct);
              radius = lerp(0.15, targetRadius, ct);
              opacity = lerp(0.1, targetOpacity, ct);

              // Arrival pulse at end of crystallization
              if (ct > 0.7) {
                const pulseT = (ct - 0.7) / 0.3;
                const pulse = Math.sin(pulseT * Math.PI) * pulseStrength;
                radius *= (1 + pulse);
              }
            }
          } else {
            // ── No state change: smooth drift ──
            const t = easeOut(staggeredP);
            x = lerp(d.fromX, d.toX, t);
            y = lerp(d.fromY, d.toY, t);
            radius = lerp(fromRadius, targetRadius, t);
            opacity = lerp(fromOpacity, targetOpacity, t);

            // Subtle radius breathing for active dots during transit
            if (d.isActive && staggeredP > 0.05 && staggeredP < 0.95) {
              const breathe = Math.sin(staggeredP * Math.PI) * 0.06;
              radius *= (1 + breathe);
            }
          }
          break;
        }

        case 'threshold': {
          // Sweep from left to right
          const t = easeOut(progress);
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
          const t = easeOut(progress);
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
        charIndex: d.charIndex,
      })));
      return;
    }

    // Build morph pairs
    const morphDots = buildMorphDots(oldParsed.dots, newParsed.dots);

    // Start residue (ghost of old value)
    if (residueAmount > 0) {
      setResidueDots(oldParsed.dots.map(d => ({
        x: d.x, y: d.y,
        radius: d.active ? 1 : 0,
        opacity: d.active ? residueAmount : 0,
        fromX: d.x, fromY: d.y,
        toX: d.x, toY: d.y,
        wasActive: d.active, isActive: false,
        charIndex: d.charIndex,
      })));
      setResidueProgress(0);
    }

    // Animate over morphDuration + residueDuration
    const totalDuration = morphDuration + (residueAmount > 0 ? residueDuration : 0);
    setMorphing(true);
    morphDoneRef.current = false;
    morphStartRef.current = performance.now();
    cancelAnimationFrame(rafRef.current);

    const tick = (now: number) => {
      const elapsed = now - morphStartRef.current;
      const morphProgress = clamp(elapsed / morphDuration, 0, 1);
      const totalProgress = clamp(elapsed / totalDuration, 0, 1);

      // Update main dots during morph phase
      if (morphProgress < 1) {
        setDots(interpolate(morphDots, morphProgress, newWidth));
      } else if (!morphDoneRef.current) {
        // Set final clean state once morph completes
        morphDoneRef.current = true;
        setDots(newParsed.dots.map(d => ({
          x: d.x, y: d.y,
          radius: d.active ? 1 : 0,
          opacity: d.active ? 1 : 0.06,
          fromX: d.x, fromY: d.y,
          toX: d.x, toY: d.y,
          wasActive: d.active, isActive: d.active,
          charIndex: d.charIndex,
        })));
      }

      // Update residue progress (fades during morph and continues after)
      if (residueAmount > 0) {
        const rp = elapsed < morphDuration
          ? clamp(elapsed / morphDuration, 0, 1) * 0.3     // 0→0.3 during morph
          : 0.3 + clamp((elapsed - morphDuration) / residueDuration, 0, 1) * 0.7; // 0.3→1.0 after
        setResidueProgress(clamp(rp, 0, 1));
      }

      if (totalProgress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setMorphing(false);
        setResidueDots(null);
        setResidueProgress(0);
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
    residueProgress,
  };
}
