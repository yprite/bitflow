'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../core/useReducedMotion';

export interface AnimatedLogoProps {
  size?: number;
  className?: string;
  color?: string;
  intensity?: number;
}

interface Orbiter {
  radius: number;
  period: number;
  dotSize: number;
  phase: number;
}

export default function AnimatedLogo({
  size = 24,
  className = 'opacity-80',
  color = '#1a1a1a',
  intensity = 1,
}: AnimatedLogoProps) {
  const reducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const center = size / 2;
    const centerDotSize = Math.max(1.8, size * 0.12);
    const orbiters: Orbiter[] = [
      { radius: size * 0.22, period: 2200, dotSize: size * 0.08, phase: 0 },
      { radius: size * 0.34, period: 3000, dotSize: size * 0.065, phase: Math.PI * 0.66 },
      { radius: size * 0.44, period: 3800, dotSize: size * 0.055, phase: Math.PI * 1.33 },
    ];
    const ellipseYScale = 0.64;

    const drawFrame = (now: number, staticFrame = false) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      const t = staticFrame ? 0 : now;
      const breathe = staticFrame ? 1 : 1 + Math.sin(t / 1600) * 0.08 * intensity;

      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.82;
      ctx.arc(center, center, centerDotSize * breathe, 0, Math.PI * 2);
      ctx.fill();

      orbiters.forEach((orbiter, index) => {
        const angle = orbiter.phase + (t / orbiter.period) * Math.PI * 2;
        const x = center + Math.cos(angle) * orbiter.radius;
        const y = center + Math.sin(angle) * orbiter.radius * ellipseYScale;

        if (!staticFrame) {
          for (let trail = 3; trail >= 1; trail -= 1) {
            const trailAngle = angle - trail * 0.22;
            const tx = center + Math.cos(trailAngle) * orbiter.radius;
            const ty = center + Math.sin(trailAngle) * orbiter.radius * ellipseYScale;

            ctx.beginPath();
            ctx.globalAlpha = (0.05 - index * 0.008) * (4 - trail);
            ctx.arc(tx, ty, orbiter.dotSize * 0.72, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.beginPath();
        ctx.globalAlpha = 0.52 - index * 0.08;
        ctx.arc(x, y, orbiter.dotSize, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
    };

    if (reducedMotion) {
      drawFrame(0, true);
      return;
    }

    const tick = (now: number) => {
      drawFrame(now);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [color, intensity, reducedMotion, size]);

  return <canvas ref={canvasRef} className={className ? `block ${className}` : 'block'} aria-hidden="true" />;
}
