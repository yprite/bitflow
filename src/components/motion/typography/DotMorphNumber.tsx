'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useDotMorph, type MorphMode, type MorphDot } from '../transitions/useDotMorph';
import { DOT_COLOR } from '../core/constants';
import { useReducedMotion } from '../core/useReducedMotion';
import { valueNoise } from '../core/dot-math';

export interface DotMorphNumberProps {
  /** The numeric value to display. Formatted to string internally. */
  value: number;
  /** Number of decimal places. Default 2. */
  decimals?: number;
  /** Prefix string (e.g. '+', '$'). Default ''. */
  prefix?: string;
  /** Suffix string (e.g. '%', '원'). Default ''. */
  suffix?: string;
  /** Pixels per grid cell. Default 5. */
  fontScale?: number;
  /** Glyph spacing in grid cells. Default 1. */
  spacing?: number;
  /** Min dot radius as fraction of cell. Default 0.15. */
  minRadius?: number;
  /** Max dot radius as fraction of cell. Default 0.42. */
  maxRadius?: number;
  /** Morph duration in ms. Default 500. */
  morphDuration?: number;
  /** Morph mode. Default 'reconfigure'. */
  morphMode?: MorphMode;
  /** Pulse intensity on value arrival. 0–1. Default 0.15. */
  pulseStrength?: number;
  /** Ghost opacity of previous value. 0–1. Default 0.12. */
  residueAmount?: number;
  /** How long residue persists after morph (ms). Default 300. */
  residueDuration?: number;
  /** Dot color. Default DOT_COLOR. */
  color?: string;
  /** Residue color. Default DOT_COLOR at reduced opacity. */
  residueColor?: string;
  /** CSS class for the container. */
  className?: string;
}

function formatValue(value: number, decimals: number, prefix: string, suffix: string): string {
  const sign = value >= 0 && prefix === '+' ? '+' : value < 0 ? '-' : prefix;
  const abs = Math.abs(value).toFixed(decimals);
  return `${sign}${abs}${suffix}`;
}

/**
 * Morphing numeric display rendered as dots.
 *
 * When the value changes, the old dot configuration smoothly
 * reconfigures into the new number. Previous value leaves a
 * brief ghost residue that dissolves in place.
 *
 * This is the primary component for animated KPI values,
 * percentage changes, and live market data.
 */
export default function DotMorphNumber({
  value,
  decimals = 2,
  prefix = '',
  suffix = '',
  fontScale = 5,
  spacing = 1,
  minRadius = 0.15,
  maxRadius = 0.42,
  morphDuration = 500,
  morphMode = 'reconfigure',
  pulseStrength = 0.15,
  residueAmount = 0.12,
  residueDuration = 300,
  color = DOT_COLOR,
  residueColor = DOT_COLOR,
  className = '',
}: DotMorphNumberProps) {
  const reducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const rafBreathRef = useRef(0);

  const text = formatValue(value, decimals, prefix, suffix);

  const { dots, width, height, morphing, residueDots, residueProgress } = useDotMorph(text, {
    morphDuration,
    residueDuration,
    pulseStrength,
    residueAmount,
    mode: morphMode,
    fontScale,
    spacing,
  });

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  const renderDots = useCallback((
    ctx: CanvasRenderingContext2D,
    dotsToRender: MorphDot[],
    dotColor: string,
    scale: number,
    minR: number,
    maxR: number,
    opacityMultiplier: number = 1,
    drift: number = 0,
  ) => {
    for (const dot of dotsToRender) {
      const isActive = dot.isActive || dot.wasActive;
      const baseR = isActive
        ? maxR * scale * Math.max(dot.radius, 0)
        : minR * scale;
      let r = Math.max(baseR, 0);
      const alpha = dot.opacity * opacityMultiplier;

      if (r <= 0 || alpha <= 0.005) continue;

      let cx = dot.x * scale + scale / 2;
      let cy = dot.y * scale + scale / 2;

      // Apply drift for residue dissolution effect
      if (drift > 0) {
        const nx = valueNoise(dot.x * 3.1, dot.y * 2.7, 31);
        const ny = valueNoise(dot.y * 2.3, dot.x * 3.9, 37);
        cx += (nx - 0.5) * drift * scale;
        cy += (ny - 0.5) * drift * scale * 0.7;
        // Residue dots shrink as they drift
        r *= (1 - drift * 0.3);
      }

      ctx.beginPath();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = dotColor;
      ctx.arc(cx, cy, Math.max(r, 0), 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Canvas size matches current value dimensions — no extra height for residue
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      // Render residue (ghost of old value) — overlaid at SAME position, fading + drifting
      if (residueDots) {
        const fadeOpacity = 1 - residueProgress;
        const drift = residueProgress * 0.8;
        renderDots(ctx, residueDots, residueColor, fontScale, minRadius, maxRadius, fadeOpacity, drift);
      }

      // Render main dots on top
      renderDots(ctx, dots, color, fontScale, minRadius, maxRadius);

      ctx.restore();
    };

    draw();

    // Keep redrawing while morphing (covers both morph and residue fade phases)
    if (morphing) {
      const tick = () => {
        draw();
        rafBreathRef.current = requestAnimationFrame(tick);
      };
      rafBreathRef.current = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(rafBreathRef.current);
    }
  }, [dots, residueDots, residueProgress, width, height, dpr, fontScale, minRadius, maxRadius, color, residueColor, morphing, renderDots]);

  return (
    <canvas
      ref={canvasRef}
      className={`block ${className}`}
      aria-label={text}
      role="img"
    />
  );
}
