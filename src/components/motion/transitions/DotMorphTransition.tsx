'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useDotMorph, type MorphMode, type MorphDot } from './useDotMorph';
import { DOT_COLOR } from '../core/constants';

export interface DotMorphTransitionProps {
  /** The text/value to display. Morph triggers on change. */
  text: string;
  /** Pixels per grid cell. Default 4. */
  fontScale?: number;
  /** Glyph spacing. Default 1. */
  spacing?: number;
  /** Morph duration ms. Default 500. */
  morphDuration?: number;
  /** Morph mode. Default 'reconfigure'. */
  mode?: MorphMode;
  /** Min dot radius fraction. Default 0.12. */
  minRadius?: number;
  /** Max dot radius fraction. Default 0.42. */
  maxRadius?: number;
  /** Residue opacity 0–1. Default 0.12. */
  residueAmount?: number;
  /** Residue duration ms. Default 300. */
  residueDuration?: number;
  /** Pulse strength 0–1. Default 0.15. */
  pulseStrength?: number;
  /** Dot color. Default DOT_COLOR. */
  color?: string;
  className?: string;
}

/**
 * Generic text morph transition component.
 *
 * Wraps useDotMorph with a canvas renderer. Use this for any
 * text or short label that needs to morph between states:
 * filter labels, tab titles, status text, chart annotations.
 *
 * For numeric values, prefer DotMorphNumber or DotKPIValue
 * which handle formatting.
 */
export default function DotMorphTransition({
  text,
  fontScale = 4,
  spacing = 1,
  morphDuration = 500,
  mode = 'reconfigure',
  minRadius = 0.12,
  maxRadius = 0.42,
  residueAmount = 0.12,
  residueDuration = 300,
  pulseStrength = 0.15,
  color = DOT_COLOR,
  className = '',
}: DotMorphTransitionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const rafRef = useRef(0);

  const { dots, width, height, morphing, residueDots } = useDotMorph(text, {
    morphDuration,
    residueDuration,
    pulseStrength,
    residueAmount,
    mode,
    fontScale,
    spacing,
  });

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    const drawDots = (dotsArr: MorphDot[], dotColor: string) => {
      for (const d of dotsArr) {
        const active = d.isActive || d.wasActive;
        const r = active
          ? maxRadius * fontScale * Math.max(d.radius, 0)
          : minRadius * fontScale;

        if (r <= 0 || d.opacity <= 0) continue;

        ctx.beginPath();
        ctx.globalAlpha = d.opacity;
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
      drawDots(residueDots, color);
    }

    // Main dots
    drawDots(dots, color);

    ctx.restore();
  }, [dots, residueDots, fontScale, minRadius, maxRadius, color, dpr]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    renderFrame();

    if (morphing) {
      const tick = () => {
        renderFrame();
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(rafRef.current);
    }
  }, [width, height, dpr, morphing, renderFrame]);

  return (
    <canvas
      ref={canvasRef}
      className={`block ${className}`}
      aria-label={text}
      role="img"
    />
  );
}
