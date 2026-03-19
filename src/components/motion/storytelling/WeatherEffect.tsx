'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../core/useReducedMotion';
import { clamp, lerp } from '../core/dot-math';
import { DOT_COLOR } from '../core/constants';

/**
 * Single fixed weather effect as halftone dot animation.
 * Used in desktop hero cards to give each page a distinct weather personality.
 */

type Weather = 'sunny' | 'windy' | 'rainy' | 'snowy' | 'foggy' | 'cloudy' | 'starry';

interface Particle {
  x: number;
  y: number;
  speed: number;
  angle: number;
  phase: number;
  drift: number;
}

interface WeatherEffectProps {
  weather: Weather;
  width?: number;
  height?: number;
  className?: string;
}

function generateParticles(count: number, w: number, h: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      speed: 0.2 + Math.random() * 0.8,
      angle: Math.random() * Math.PI * 2,
      phase: Math.random() * Math.PI * 2,
      drift: (Math.random() - 0.5) * 2,
    });
  }
  return particles;
}

function drawSunny(ctx: CanvasRenderingContext2D, particles: Particle[], t: number, w: number, h: number) {
  const cx = w * 0.18;
  const cy = h * 0.4;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const angle = p.angle + t * 0.25 * p.speed;
    const dist = 12 + (i / particles.length) * w * 0.5;
    const pulse = Math.sin(t * 1.2 + p.phase) * 0.35 + 0.65;
    const x = cx + Math.cos(angle) * dist;
    const y = cy + Math.sin(angle) * dist * 0.65;

    if (x < -5 || x > w + 5 || y < -5 || y > h + 5) continue;

    const r = lerp(0.8, 2.8, pulse);
    const fadeDist = clamp(1 - dist / (w * 0.55), 0, 1);
    const op = 0.35 * fadeDist * pulse;

    ctx.beginPath();
    ctx.globalAlpha = op;
    ctx.fillStyle = i % 4 === 0 ? '#f5a623' : DOT_COLOR;
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWindy(ctx: CanvasRenderingContext2D, particles: Particle[], t: number, w: number, h: number) {
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const speed = p.speed * 55;
    let x = ((p.x + t * speed) % (w + 20)) - 10;
    const wobble = Math.sin(t * 1.8 + p.phase) * 3.5 * p.drift;
    const y = p.y + wobble;

    if (x < -5) x += w + 20;

    const stretchFactor = 1.2 + p.speed * 1.8;
    const r = lerp(0.5, 1.8, p.speed);
    const op = 0.28 * (0.5 + p.speed * 0.5);

    ctx.beginPath();
    ctx.globalAlpha = op;
    ctx.fillStyle = i % 3 === 0 ? '#9ca3af' : DOT_COLOR;
    ctx.ellipse(x, y, r * stretchFactor, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRainy(ctx: CanvasRenderingContext2D, particles: Particle[], t: number, w: number, h: number) {
  // rain drops
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const fallSpeed = p.speed * 70;
    const x = p.x + Math.sin(t * 0.4 + p.phase) * 1.5;
    let y = (p.y + t * fallSpeed) % h;
    if (y < h * 0.1) y += h * 0.1;

    const r = lerp(0.4, 1.3, p.speed);
    const streak = r * 2.2;
    const op = 0.32 * (0.4 + p.speed * 0.6);

    ctx.beginPath();
    ctx.globalAlpha = op;
    ctx.fillStyle = i % 5 === 0 ? '#9ca3af' : '#1e88e5';
    ctx.ellipse(x, y, r * 0.45, streak, Math.PI * 0.04, 0, Math.PI * 2);
    ctx.fill();
  }

  // snow flakes mixed in (lighter, slower)
  for (let i = 0; i < 40; i++) {
    const p = particles[i % particles.length];
    const fallSpeed = p.speed * 12;
    const sway = Math.sin(t * 0.6 + p.phase + i) * 10 * p.drift;
    const x = (p.x * 0.7 + i * 23) % w + sway;
    let y = ((p.y * 0.5 + i * 17) + t * fallSpeed) % h;
    if (y < h * 0.1) y += h * 0.1;

    const breathe = Math.sin(t * 0.9 + p.phase + i) * 0.25 + 0.75;
    const r = lerp(0.6, 2.0, breathe);
    const op = 0.22 * breathe;

    ctx.beginPath();
    ctx.globalAlpha = op;
    ctx.fillStyle = '#cbd5e1';
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFoggy(ctx: CanvasRenderingContext2D, particles: Particle[], t: number, w: number, h: number) {
  // Fog layers — large soft clusters drifting slowly
  const fogCenters = [
    { x: w * 0.1, y: h * 0.3 },
    { x: w * 0.35, y: h * 0.5 },
    { x: w * 0.6, y: h * 0.35 },
    { x: w * 0.2, y: h * 0.7 },
    { x: w * 0.5, y: h * 0.65 },
    { x: w * 0.8, y: h * 0.45 },
  ];

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const fog = fogCenters[i % fogCenters.length];
    const driftX = Math.sin(t * 0.15 + p.phase) * 20 + t * 3 * p.speed;
    const driftY = Math.cos(t * 0.1 + p.phase * 1.3) * 5;
    const breathe = Math.sin(t * 0.3 + p.phase * 2) * 0.2 + 0.8;

    const spread = 50 + (i / particles.length) * 80;
    let x = fog.x + Math.cos(p.angle) * spread * p.speed + driftX;
    const y = fog.y + Math.sin(p.angle) * spread * 0.35 * p.speed + driftY;

    x = ((x % (w + 40)) + w + 40) % (w + 40) - 20;

    if (y < -10 || y > h + 10) continue;

    const r = lerp(1.5, 4.5, breathe);
    const op = 0.15 * breathe;

    ctx.beginPath();
    ctx.globalAlpha = op;
    ctx.fillStyle = i % 5 === 0 ? '#d1d5db' : '#9ca3af';
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCloudy(ctx: CanvasRenderingContext2D, particles: Particle[], t: number, w: number, h: number) {
  const cloudCenters = [
    { x: w * 0.1, y: h * 0.3 },
    { x: w * 0.3, y: h * 0.5 },
    { x: w * 0.55, y: h * 0.35 },
    { x: w * 0.2, y: h * 0.7 },
    { x: w * 0.45, y: h * 0.65 },
    { x: w * 0.7, y: h * 0.45 },
    { x: w * 0.85, y: h * 0.6 },
  ];

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const cloud = cloudCenters[i % cloudCenters.length];
    const driftX = Math.sin(t * 0.2 + p.phase) * 10 + t * 2 * p.speed;
    const driftY = Math.cos(t * 0.15 + p.phase * 1.5) * 3;
    const breathe = Math.sin(t * 0.4 + p.phase * 2) * 0.25 + 0.75;

    const spread = 30 + (i / particles.length) * 55;
    let x = cloud.x + Math.cos(p.angle) * spread * p.speed + driftX;
    const y = cloud.y + Math.sin(p.angle) * spread * 0.3 * p.speed + driftY;

    x = ((x % (w + 30)) + w + 30) % (w + 30) - 15;

    if (y < -10 || y > h + 10) continue;

    const r = lerp(1.2, 3.5, breathe);
    const op = 0.2 * breathe;

    ctx.beginPath();
    ctx.globalAlpha = op;
    ctx.fillStyle = i % 4 === 0 ? '#e5e7eb' : i % 7 === 0 ? '#d1d5db' : '#9ca3af';
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawStarry(ctx: CanvasRenderingContext2D, particles: Particle[], t: number, w: number, h: number) {
  // Dark sky background dots (very subtle)
  for (let i = 0; i < 30; i++) {
    const x = (i * 37.7 + Math.sin(i * 2.3) * 20) % w;
    const y = (i * 23.1 + Math.cos(i * 3.1) * 15) % h;
    ctx.beginPath();
    ctx.globalAlpha = 0.03;
    ctx.fillStyle = '#374151';
    ctx.arc(x, y, 3 + Math.sin(t * 0.2 + i) * 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Stars
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];

    // Twinkle
    const twinkle = Math.sin(t * (1.5 + p.speed) + p.phase) * 0.5 + 0.5;
    const brightPulse = Math.sin(t * 0.8 + p.phase * 3) > 0.85 ? 1.5 : 1;

    const r = lerp(0.3, 1.8, p.speed) * (0.6 + twinkle * 0.4) * brightPulse;
    const op = (0.1 + twinkle * 0.35) * brightPulse;

    ctx.beginPath();
    ctx.globalAlpha = op;

    // Star colors: mostly white/silver, occasional warm/cool
    if (i % 11 === 0) {
      ctx.fillStyle = '#fbbf24'; // gold star
    } else if (i % 13 === 0) {
      ctx.fillStyle = '#93c5fd'; // blue star
    } else {
      ctx.fillStyle = i % 3 === 0 ? '#e5e7eb' : '#d1d5db'; // white/silver
    }

    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();

    // Cross sparkle on bright stars
    if (brightPulse > 1 && r > 1.2) {
      ctx.globalAlpha = op * 0.4;
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      ctx.moveTo(p.x - r * 2, p.y);
      ctx.lineTo(p.x + r * 2, p.y);
      ctx.moveTo(p.x, p.y - r * 2);
      ctx.lineTo(p.x, p.y + r * 2);
      ctx.stroke();
    }
  }

  // Occasional shooting star
  const shootCycle = t % 8;
  if (shootCycle < 0.5) {
    const progress = shootCycle / 0.5;
    const sx = w * 0.8 - progress * w * 0.5;
    const sy = h * 0.1 + progress * h * 0.3;
    const tailLen = 30;

    for (let j = 0; j < 6; j++) {
      const tp = Math.max(0, progress - j * 0.02);
      const tx = w * 0.8 - tp * w * 0.5;
      const ty = h * 0.1 + tp * h * 0.3;
      ctx.beginPath();
      ctx.globalAlpha = 0.3 - j * 0.05;
      ctx.fillStyle = '#fbbf24';
      ctx.arc(tx, ty, 1.0 - j * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

const CONFIGS: Record<Weather, { count: number; draw: typeof drawSunny }> = {
  sunny: { count: 140, draw: drawSunny },
  windy: { count: 110, draw: drawWindy },
  rainy: { count: 130, draw: drawRainy },
  snowy: { count: 130, draw: drawRainy },
  foggy: { count: 160, draw: drawFoggy },
  cloudy: { count: 150, draw: drawCloudy },
  starry: { count: 100, draw: drawStarry },
};

export default function WeatherEffect({
  weather,
  width = 700,
  height = 250,
  className,
}: WeatherEffectProps) {
  const reducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const cfg = CONFIGS[weather];
    const particles = generateParticles(cfg.count, width, height);

    if (reducedMotion) {
      ctx.scale(dpr, dpr);
      cfg.draw(ctx, particles, 0, width, height);
      return;
    }

    const startTime = performance.now();

    const tick = (now: number) => {
      const t = (now - startTime) / 1000;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      cfg.draw(ctx, particles, t, width, height);

      ctx.restore();
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [weather, width, height, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className={className ?? 'absolute bottom-0 left-0 z-0 pointer-events-none'}
      aria-hidden="true"
    />
  );
}
