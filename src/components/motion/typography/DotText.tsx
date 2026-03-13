'use client';

import { useRef, useEffect, useMemo, useCallback } from 'react';
import { parseText, GLYPH_ROWS, type TextDot } from './dot-font';
import { useReducedMotion } from '../core/useReducedMotion';
import { DOT_COLOR } from '../core/constants';
import { radialWave, valueNoise, easeOut, lerp, clamp } from '../core/dot-math';

export type DotTextAnimation =
  | 'none'
  | 'breathing'
  | 'noise-reveal'
  | 'pulse-once';

export interface DotTextProps {
  /** The string to render as dots. */
  text: string;
  /** Pixels per grid cell. Controls overall scale. Default 4. */
  fontScale?: number;
  /** Grid cells between glyphs. Default 1. */
  spacing?: number;
  /** Minimum dot radius as fraction of cell. Default 0.15. */
  minRadius?: number;
  /** Maximum dot radius as fraction of cell. Default 0.45. */
  maxRadius?: number;
  /** [min, max] opacity for active dots. Default [0.6, 1.0]. */
  opacityRange?: [number, number];
  /** Animation mode. Default 'none'. */
  animationMode?: DotTextAnimation;
  /** Dot color. Default DOT_COLOR. */
  color?: string;
  /** CSS class for the container. */
  className?: string;
}

/**
 * Core dot typography renderer.
 *
 * Renders text using the 5×7 dot font on a canvas element.
 * Active glyph dots are drawn at full radius/opacity;
 * inactive grid positions get a faint ghost dot for texture.
 *
 * Animation modes:
 * - none: static render
 * - breathing: slow radial wave pulses dot sizes
 * - noise-reveal: dots appear from noise over ~800ms
 * - pulse-once: all dots briefly scale up then settle
 */
export default function DotText({
  text,
  fontScale = 4,
  spacing = 1,
  minRadius = 0.15,
  maxRadius = 0.45,
  opacityRange = [0.6, 1.0],
  animationMode = 'none',
  color = DOT_COLOR,
  className = '',
}: DotTextProps) {
  const reducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const rafRef = useRef(0);
  const startRef = useRef(0);

  const parsed = useMemo(() => parseText(text, spacing), [text, spacing]);

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const canvasW = parsed.width * fontScale;
  const canvasH = parsed.height * fontScale;

  const effectiveMode = reducedMotion ? 'none' : animationMode;

  const render = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    const cellR = fontScale / 2;
    const elapsed = time - startRef.current;
    const t = elapsed / 1000;

    for (const dot of parsed.dots) {
      const cx = dot.x * fontScale + cellR;
      const cy = dot.y * fontScale + cellR;

      let radius: number;
      let opacity: number;

      if (dot.active) {
        radius = maxRadius * fontScale;
        opacity = opacityRange[1];

        // Apply animation modifiers
        if (effectiveMode === 'breathing') {
          const wave = radialWave(cx, cy, canvasW / 2, canvasH / 2, t, 0.5, 80);
          const breathe = 0.85 + wave * 0.3;
          radius *= breathe;
          opacity = lerp(opacityRange[0], opacityRange[1], 0.7 + wave * 0.3);
        } else if (effectiveMode === 'noise-reveal') {
          const revealProgress = clamp(elapsed / 800, 0, 1);
          const noise = valueNoise(dot.x * 3.7, dot.y * 5.1, 42);
          const dotThreshold = noise;
          if (revealProgress < dotThreshold) {
            radius = 0;
            opacity = 0;
          } else {
            const localT = clamp((revealProgress - dotThreshold) / (1 - dotThreshold), 0, 1);
            radius *= easeOut(localT);
            opacity *= easeOut(localT);
          }
        } else if (effectiveMode === 'pulse-once') {
          const pulseT = clamp(elapsed / 600, 0, 1);
          const pulseValue = pulseT < 0.4
            ? lerp(1, 1.25, pulseT / 0.4)
            : lerp(1.25, 1, (pulseT - 0.4) / 0.6);
          radius *= pulseValue;
        }
      } else {
        // Ghost dots for texture
        radius = minRadius * fontScale;
        opacity = 0.06;
      }

      if (radius <= 0 || opacity <= 0) continue;

      ctx.beginPath();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = color;
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }, [parsed, fontScale, minRadius, maxRadius, opacityRange, effectiveMode, color, dpr, canvasW, canvasH]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    canvas.style.width = `${canvasW}px`;
    canvas.style.height = `${canvasH}px`;

    startRef.current = performance.now();

    if (effectiveMode === 'none') {
      render(startRef.current);
      return;
    }

    // For noise-reveal, stop after animation completes
    const isFinite = effectiveMode === 'noise-reveal' || effectiveMode === 'pulse-once';
    const maxDuration = effectiveMode === 'noise-reveal' ? 1200 : 800;

    const tick = (now: number) => {
      render(now);
      const elapsed = now - startRef.current;
      if (isFinite && elapsed > maxDuration) {
        // Render final static frame
        render(startRef.current + maxDuration + 1);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [canvasW, canvasH, dpr, effectiveMode, render]);

  return (
    <canvas
      ref={canvasRef}
      className={`block ${className}`}
      aria-label={text}
      role="img"
    />
  );
}
