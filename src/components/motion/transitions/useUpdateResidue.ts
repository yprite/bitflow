'use client';

import { useRef, useState, useEffect } from 'react';
import { useReducedMotion } from '../core/useReducedMotion';

export interface ResidueState<T> {
  /** The current (newest) value. */
  current: T;
  /** The previous value, or null if no change has occurred. */
  previous: T | null;
  /** Whether a residue is currently visible. */
  showResidue: boolean;
  /** 0–1 progress of residue fade. 1 = fully faded. */
  residueProgress: number;
  /** Whether the current value just changed (within pulse window). */
  justChanged: boolean;
}

export interface UseUpdateResidueConfig {
  /** How long the residue ghost persists (ms). Default 400. */
  residueDuration?: number;
  /** How long the "justChanged" flag stays true (ms). Default 300. */
  pulseDuration?: number;
}

/**
 * Generic hook for tracking value changes with residue behavior.
 *
 * Provides the previous value alongside the current one, plus
 * timing signals for rendering ghosts, pulses, and transitions.
 *
 * Use this when you need residue/pulse behavior on ANY value change,
 * not just dot-text morphs. Works for:
 * - Card value updates
 * - Filter/tab changes
 * - Badge state transitions
 * - Any data refresh
 */
export function useUpdateResidue<T>(
  value: T,
  config: UseUpdateResidueConfig = {},
): ResidueState<T> {
  const { residueDuration = 400, pulseDuration = 300 } = config;
  const reducedMotion = useReducedMotion();

  const prevRef = useRef(value);
  const [previous, setPrevious] = useState<T | null>(null);
  const [showResidue, setShowResidue] = useState(false);
  const [residueProgress, setResidueProgress] = useState(1);
  const [justChanged, setJustChanged] = useState(false);

  const residueRafRef = useRef(0);
  const residueStartRef = useRef(0);
  const pulseTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    // Use JSON stringification for deep comparison of primitives/simple objects
    const prev = prevRef.current;
    if (JSON.stringify(prev) === JSON.stringify(value)) return;

    setPrevious(prev);
    prevRef.current = value;

    if (reducedMotion) {
      // Skip animation, just note the change
      setJustChanged(true);
      clearTimeout(pulseTimeoutRef.current);
      pulseTimeoutRef.current = setTimeout(() => setJustChanged(false), 100);
      return;
    }

    // Start residue fade
    setShowResidue(true);
    setResidueProgress(0);
    residueStartRef.current = performance.now();
    cancelAnimationFrame(residueRafRef.current);

    const fadeResidue = (now: number) => {
      const elapsed = now - residueStartRef.current;
      const progress = Math.min(elapsed / residueDuration, 1);
      setResidueProgress(progress);

      if (progress < 1) {
        residueRafRef.current = requestAnimationFrame(fadeResidue);
      } else {
        setShowResidue(false);
        setPrevious(null);
      }
    };

    residueRafRef.current = requestAnimationFrame(fadeResidue);

    // Pulse flag
    setJustChanged(true);
    clearTimeout(pulseTimeoutRef.current);
    pulseTimeoutRef.current = setTimeout(() => setJustChanged(false), pulseDuration);

    return () => {
      cancelAnimationFrame(residueRafRef.current);
      clearTimeout(pulseTimeoutRef.current);
    };
  }, [value, residueDuration, pulseDuration, reducedMotion]);

  return {
    current: value,
    previous,
    showResidue,
    residueProgress,
    justChanged,
  };
}
