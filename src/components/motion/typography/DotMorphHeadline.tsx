'use client';

import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useDotMorph, type MorphMode, type MorphDot } from '../transitions/useDotMorph';
import { useReducedMotion } from '../core/useReducedMotion';
import { DOT_COLOR } from '../core/constants';
import { radialWave } from '../core/dot-math';

export interface DotMorphHeadlineProps {
  /** The headline text. Morphs on change, breathes when idle. */
  text: string;
  /** Pixels per grid cell. Default 6 (large). */
  fontScale?: number;
  /** Grid cells between glyphs. Default 2. */
  spacing?: number;
  /** Morph duration ms. Default 600. */
  morphDuration?: number;
  /** Morph mode. Default 'dissolve'. */
  morphMode?: MorphMode;
  /** Min dot radius as fraction of cell. Default 0.12. */
  minRadius?: number;
  /** Max dot radius as fraction of cell. Default 0.42. */
  maxRadius?: number;
  /** Residue opacity 0–1. Default 0.15. */
  residueAmount?: number;
  /** Residue duration ms. Default 400. */
  residueDuration?: number;
  /** Pulse strength 0–1. Default 0.12. */
  pulseStrength?: number;
  /** Breathing amplitude 0–1. How much dots pulse during idle. Default 0.25. */
  breathingAmplitude?: number;
  /** Breathing speed. Radians per second. Default 0.4. */
  breathingSpeed?: number;
  /** Dot color. Default DOT_COLOR. */
  color?: string;
  className?: string;
}

/**
 * Morphing headline with idle breathing.
 *
 * When text changes: dots dissolve/reconfigure from old to new state,
 * creating the feeling that a new interpretation is emerging from
 * the same dot field.
 *
 * When idle: a slow radial wave modulates dot sizes, making the
 * headline feel alive — as if the field is gently processing.
 *
 * Use for hero headlines, section titles, signal labels, and
 * any prominent text that changes meaning over time.
 */
export default function DotMorphHeadline({
  text,
  fontScale = 6,
  spacing = 2,
  morphDuration = 600,
  morphMode = 'dissolve',
  minRadius = 0.12,
  maxRadius = 0.42,
  residueAmount = 0.15,
  residueDuration = 400,
  pulseStrength = 0.12,
  breathingAmplitude = 0.25,
  breathingSpeed = 0.4,
  color = DOT_COLOR,
  className = '',
}: DotMorphHeadlineProps) {
  const reducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const rafRef = useRef(0);
  const startTimeRef = useRef(performance.now());

  const displayText = useMemo(() => text.toUpperCase(), [text]);

  const { dots, width, height, morphing, residueDots } = useDotMorph(displayText, {
    morphDuration,
    residueDuration,
    pulseStrength,
    residueAmount,
    mode: morphMode,
    fontScale,
    spacing,
  });

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  const renderFrame = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    const elapsed = (time - startTimeRef.current) / 1000;

    const drawDots = (dotsArr: MorphDot[], dotColor: string, applyBreathing: boolean) => {
      for (const d of dotsArr) {
        const isActive = d.isActive || d.wasActive;
        let r = isActive
          ? maxRadius * fontScale * Math.max(d.radius, 0)
          : minRadius * fontScale;

        let opacity = d.opacity;

        // Apply breathing to idle (non-morphing) active dots
        if (applyBreathing && !morphing && isActive && !reducedMotion) {
          const cx = d.x * fontScale + fontScale / 2;
          const cy = d.y * fontScale + fontScale / 2;
          const wave = radialWave(cx, cy, width / 2, height / 2, elapsed, breathingSpeed, 80);
          const breathe = 1 - breathingAmplitude + wave * breathingAmplitude;
          r *= breathe;
          opacity *= (0.7 + wave * 0.3);
        }

        if (r <= 0 || opacity <= 0) continue;

        ctx.beginPath();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = dotColor;
        ctx.arc(
          d.x * fontScale + fontScale / 2,
          d.y * fontScale + fontScale / 2,
          r, 0, Math.PI * 2,
        );
        ctx.fill();
      }
    };

    // Residue ghost (behind)
    if (residueDots) {
      drawDots(residueDots, color, false);
    }

    // Main dots with breathing
    drawDots(dots, color, true);

    ctx.restore();
  }, [dots, residueDots, fontScale, minRadius, maxRadius, color, dpr, width, height, morphing, breathingAmplitude, breathingSpeed, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    if (reducedMotion) {
      renderFrame(performance.now());
      return;
    }

    // Always run animation loop for breathing
    const tick = (now: number) => {
      renderFrame(now);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [width, height, dpr, reducedMotion, renderFrame]);

  return (
    <canvas
      ref={canvasRef}
      className={`block ${className}`}
      aria-label={text}
      role="img"
    />
  );
}
