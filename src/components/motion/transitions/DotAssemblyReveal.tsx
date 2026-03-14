'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useReducedMotion } from '../core/useReducedMotion';
import { useResizeObserver } from '../core/useResizeObserver';
import { DOT_COLOR } from '../core/constants';
import { clamp, easeFade, easeOut, lerp } from '../core/dot-math';

interface DotAssemblyRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  density?: 'low' | 'medium' | 'high';
}

interface AssemblyDot {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  radius: number;
  lag: number;
  alpha: number;
}

const DENSITY_MAP = {
  low: 0.7,
  medium: 1,
  high: 1.35,
} as const;

function hashNoise(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function buildDots(width: number, height: number, density: number): AssemblyDot[] {
  const safeWidth = Math.max(width, 160);
  const safeHeight = Math.max(height, 72);
  const area = safeWidth * safeHeight;
  const targetCount = clamp(Math.round((area / 9500) * density), 16, 84);
  const cols = Math.max(4, Math.round(Math.sqrt(targetCount * (safeWidth / safeHeight))));
  const rows = Math.max(3, Math.round(targetCount / cols));
  const dots: AssemblyDot[] = [];
  const padX = Math.min(28, safeWidth * 0.08);
  const padY = Math.min(22, safeHeight * 0.16);
  const cx = safeWidth * 0.5;
  const cy = safeHeight * 0.42;
  const clusterRadius = Math.min(26, Math.max(14, Math.min(safeWidth, safeHeight) * 0.16));
  const maxDist = Math.hypot(Math.max(cx, safeWidth - cx), Math.max(cy, safeHeight - cy)) || 1;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const seed = row * cols + col + 1;
      const nx = cols === 1 ? 0.5 : col / (cols - 1);
      const ny = rows === 1 ? 0.5 : row / (rows - 1);
      const jitterX = (hashNoise(seed * 1.31) - 0.5) * Math.min(24, safeWidth * 0.06);
      const jitterY = (hashNoise(seed * 2.17) - 0.5) * Math.min(20, safeHeight * 0.08);
      const tx = padX + nx * (safeWidth - padX * 2) + jitterX;
      const ty = padY + ny * (safeHeight - padY * 2) + jitterY;
      const angle = hashNoise(seed * 3.77) * Math.PI * 2;
      const startRadius = clusterRadius * (0.28 + hashNoise(seed * 4.91) * 0.9);
      const sx = cx + Math.cos(angle) * startRadius;
      const sy = cy + Math.sin(angle) * startRadius * 0.7;
      const distFromCenter = Math.hypot(tx - cx, ty - cy);

      dots.push({
        sx,
        sy,
        tx,
        ty,
        radius: 0.75 + hashNoise(seed * 5.43) * 0.95,
        lag: 0.06 + (distFromCenter / maxDist) * 0.28 + hashNoise(seed * 6.11) * 0.08,
        alpha: 0.16 + hashNoise(seed * 7.03) * 0.18,
      });
    }
  }

  return dots.slice(0, targetCount);
}

function getContentStyle(progress: number, reducedMotion: boolean): CSSProperties {
  if (reducedMotion || progress >= 1) return {};

  const emerge = clamp((progress - 0.18) / 0.82, 0, 1);
  const eased = easeOut(emerge);
  const blur = lerp(8, 0, eased);
  const translateY = lerp(18, 0, eased);
  const scale = lerp(0.985, 1, eased);

  return {
    opacity: eased,
    filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
    transform: `translateY(${translateY}px) scale(${scale})`,
    willChange: 'opacity, transform, filter',
  };
}

export default function DotAssemblyReveal({
  children,
  className,
  delay = 0,
  duration = 620,
  density = 'medium',
}: DotAssemblyRevealProps) {
  const reducedMotion = useReducedMotion();
  const { ref, size } = useResizeObserver<HTMLDivElement>();
  const [progress, setProgress] = useState(reducedMotion ? 1 : 0);
  const rafRef = useRef<number>(0);
  const timerRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const dots = useMemo(
    () => buildDots(size.width, size.height, DENSITY_MAP[density]),
    [size.width, size.height, density],
  );

  useEffect(() => {
    if (reducedMotion) {
      setProgress(1);
      return;
    }

    setProgress(0);
    const startAnimation = () => {
      const startedAt = performance.now();

      const tick = (now: number) => {
        const next = clamp((now - startedAt) / duration, 0, 1);
        setProgress(next);

        if (next < 1) {
          rafRef.current = requestAnimationFrame(tick);
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    };

    timerRef.current = window.setTimeout(startAnimation, delay);

    return () => {
      window.clearTimeout(timerRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  }, [delay, duration, reducedMotion]);

  useEffect(() => {
    if (reducedMotion || progress >= 1 || size.width === 0 || size.height === 0 || dots.length === 0) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(size.width * dpr));
    canvas.height = Math.max(1, Math.floor(size.height * dpr));
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.width, size.height);
    ctx.fillStyle = DOT_COLOR;

    for (const dot of dots) {
      const local = clamp((progress - dot.lag) / (1 - dot.lag), 0, 1);
      if (local <= 0) continue;

      const eased = easeOut(local);
      const fade = 1 - easeFade(local);
      const x = lerp(dot.sx, dot.tx, eased);
      const y = lerp(dot.sy, dot.ty, eased);
      const radius = dot.radius * lerp(1.8, 0.7, eased);
      const alpha = dot.alpha * fade;

      if (alpha <= 0.01) continue;

      ctx.beginPath();
      ctx.globalAlpha = alpha;
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }, [delay, dots, duration, progress, reducedMotion, size.height, size.width]);

  const overlayVisible = !reducedMotion && progress < 1 && size.width > 0 && size.height > 0;

  return (
    <div ref={ref} className={className ? `relative ${className}` : 'relative'}>
      {overlayVisible ? (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 z-20 pointer-events-none"
        />
      ) : null}
      <div style={getContentStyle(progress, reducedMotion)}>
        {children}
      </div>
    </div>
  );
}
