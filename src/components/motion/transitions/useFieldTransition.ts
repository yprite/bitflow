'use client';

import { useRef, useState, useEffect, useCallback, type CSSProperties } from 'react';
import { useReducedMotion } from '../core/useReducedMotion';
import { clamp, easeOut, easeFade } from '../core/dot-math';

export interface UseFieldTransitionConfig {
  /** Total transition duration ms. Default 400. */
  duration?: number;
  /** 0–1 proportion of duration spent dissolving. Default 0.45. */
  dissolveProportion?: number;
  /** Max opacity reduction during dissolution. 0–1. Default 0.15. */
  fadeStrength?: number;
  /** Max scale reduction during dissolution (multiplicative). Default 0.02. */
  scaleStrength?: number;
  /** Max blur in px during peak dissolution. Default 1.5. */
  blurStrength?: number;
}

export interface FieldTransitionState {
  /** Current transition phase. */
  phase: 'idle' | 'dissolving' | 'emerging';
  /** 0–1 overall progress. */
  progress: number;
  /** CSS properties to apply to the content wrapper. */
  style: CSSProperties;
  /** Whether a transition is currently active. */
  isTransitioning: boolean;
  /** The key that triggered the current transition. */
  activeKey: string;
}

/**
 * Hook for content area dissolution/emergence transitions.
 *
 * When the key changes, the content area goes through two phases:
 *
 * 1. **Dissolution** — the current content slightly loses resolution:
 *    opacity dips, a subtle blur appears, scale microscopically shrinks.
 *    This represents the field losing its current configuration.
 *
 * 2. **Emergence** — the new content crystallizes: opacity returns,
 *    blur clears, scale settles. The new state becomes legible.
 *
 * The effect is intentionally restrained — the user should feel a
 * shift in information density, not a dramatic animation. It should
 * feel like the same field reorganizing to present different data.
 *
 * Apply the returned `style` to the content wrapper div.
 */
export function useFieldTransition(
  key: string,
  config: UseFieldTransitionConfig = {},
): FieldTransitionState {
  const {
    duration = 400,
    dissolveProportion = 0.45,
    fadeStrength = 0.15,
    scaleStrength = 0.02,
    blurStrength = 1.5,
  } = config;

  const reducedMotion = useReducedMotion();
  const prevKeyRef = useRef(key);
  const startRef = useRef(0);
  const rafRef = useRef(0);

  const [state, setState] = useState<FieldTransitionState>({
    phase: 'idle',
    progress: 1,
    style: {},
    isTransitioning: false,
    activeKey: key,
  });

  const computeStyle = useCallback((progress: number): CSSProperties => {
    if (progress >= 1) return {};

    const dissolveEnd = dissolveProportion;

    if (progress <= dissolveEnd) {
      // Dissolution phase: old content fading
      const t = easeOut(progress / dissolveEnd);
      const opacity = 1 - fadeStrength * t;
      const scale = 1 - scaleStrength * t;
      const blur = blurStrength * t;

      return {
        opacity,
        transform: `scale(${scale})`,
        filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
        transition: 'none',
        willChange: 'opacity, transform, filter',
      };
    } else {
      // Emergence phase: new content crystallizing
      const emergeT = easeFade((progress - dissolveEnd) / (1 - dissolveEnd));
      const opacity = (1 - fadeStrength) + fadeStrength * emergeT;
      const scale = (1 - scaleStrength) + scaleStrength * emergeT;
      const blur = blurStrength * (1 - emergeT);

      return {
        opacity,
        transform: `scale(${scale})`,
        filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
        transition: 'none',
        willChange: 'opacity, transform, filter',
      };
    }
  }, [dissolveProportion, fadeStrength, scaleStrength, blurStrength]);

  useEffect(() => {
    if (prevKeyRef.current === key) return;
    prevKeyRef.current = key;

    if (reducedMotion) {
      setState({
        phase: 'idle',
        progress: 1,
        style: {},
        isTransitioning: false,
        activeKey: key,
      });
      return;
    }

    startRef.current = performance.now();
    cancelAnimationFrame(rafRef.current);

    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const progress = clamp(elapsed / duration, 0, 1);
      const phase = progress <= dissolveProportion ? 'dissolving' : 'emerging';

      setState({
        phase: progress >= 1 ? 'idle' : phase,
        progress,
        style: computeStyle(progress),
        isTransitioning: progress < 1,
        activeKey: key,
      });

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [key, duration, dissolveProportion, reducedMotion, computeStyle]);

  return state;
}
