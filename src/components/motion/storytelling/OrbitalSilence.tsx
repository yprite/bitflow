'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../core/useReducedMotion';
import { DOT_COLOR } from '../core/constants';

interface OrbitalSilenceProps {
  /** Optional text label beneath the orbital. */
  label?: string;
}

interface Orbiter {
  radius: number;
  period: number;
  dotSize: number;
  phase: number;
}

const ORBITERS: Orbiter[] = [
  { radius: 20, period: 4000, dotSize: 2.5, phase: 0 },
  { radius: 35, period: 5500, dotSize: 2, phase: Math.PI * 0.5 },
  { radius: 50, period: 7000, dotSize: 1.5, phase: Math.PI },
  { radius: 70, period: 9000, dotSize: 1.2, phase: Math.PI * 1.5 },
];

const CENTER_DOT_SIZE = 4;

/**
 * Loading state animation: a minimal solar system.
 * A central dot with orbiting dots at different speeds and distances.
 * Replaces the pulsing dots loader with something contemplative.
 */
export default function OrbitalSilence({ label = '데이터 로딩 중...' }: OrbitalSilenceProps) {
  const reducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 200;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const cx = size / 2;
    const cy = size / 2;

    if (reducedMotion) {
      // Static frame: draw center and orbiters at initial positions
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, size, size);

      // Center dot
      ctx.beginPath();
      ctx.fillStyle = DOT_COLOR;
      ctx.globalAlpha = 0.8;
      ctx.arc(cx, cy, CENTER_DOT_SIZE, 0, Math.PI * 2);
      ctx.fill();

      // Orbiters at rest
      ORBITERS.forEach((o) => {
        ctx.beginPath();
        ctx.globalAlpha = 0.4;
        ctx.arc(cx + o.radius, cy, o.dotSize, 0, Math.PI * 2);
        ctx.fill();
      });
      return;
    }

    const startTime = performance.now();

    const tick = (now: number) => {
      const t = now - startTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      // Center dot with subtle breathing
      const breathe = 1 + Math.sin(t / 2000) * 0.1;
      ctx.beginPath();
      ctx.fillStyle = DOT_COLOR;
      ctx.globalAlpha = 0.8;
      ctx.arc(cx, cy, CENTER_DOT_SIZE * breathe, 0, Math.PI * 2);
      ctx.fill();

      // Orbiters
      ORBITERS.forEach((o) => {
        const angle = o.phase + (t / o.period) * Math.PI * 2;
        const ox = cx + Math.cos(angle) * o.radius;
        const oy = cy + Math.sin(angle) * o.radius * 0.6; // Elliptical

        // Trail (fading previous positions)
        for (let trail = 3; trail >= 1; trail--) {
          const trailAngle = angle - trail * 0.15;
          const trailX = cx + Math.cos(trailAngle) * o.radius;
          const trailY = cy + Math.sin(trailAngle) * o.radius * 0.6;
          ctx.beginPath();
          ctx.globalAlpha = 0.08 * (4 - trail);
          ctx.arc(trailX, trailY, o.dotSize * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }

        // Main orbiter dot
        ctx.beginPath();
        ctx.globalAlpha = 0.5;
        ctx.arc(ox, oy, o.dotSize, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [reducedMotion]);

  return (
    <div className="flex flex-col items-center gap-4" aria-hidden="true">
      <canvas ref={canvasRef} className="block" />
      {label && <p className="text-dot-sub text-sm">{label}</p>}
    </div>
  );
}
