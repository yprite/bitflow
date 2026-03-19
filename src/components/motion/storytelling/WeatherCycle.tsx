'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../core/useReducedMotion';
import { clamp, lerp } from '../core/dot-math';
import { DOT_COLOR } from '../core/constants';

/**
 * Weather cycle halftone animation for the desktop hero card.
 *
 * Cycles through: sunny → windy → cloudy → rainy → snowy → clear
 * Each phase uses dot patterns (size, density, movement) to convey weather.
 * Dots are positioned in the left-center to bottom area of the container.
 */

const PHASE_DURATION = 5000; // ms per weather phase
const TRANSITION_DURATION = 1500; // ms crossfade between phases

type WeatherPhase = 'sunny' | 'windy' | 'cloudy' | 'rainy' | 'snowy' | 'clear';

const PHASES: WeatherPhase[] = ['sunny', 'windy', 'cloudy', 'rainy', 'snowy', 'clear'];

interface Particle {
  x: number;
  y: number;
  baseRadius: number;
  speed: number;
  angle: number;
  phase: number;
  drift: number;
}

function getPhaseConfig(phase: WeatherPhase) {
  switch (phase) {
    case 'sunny':
      return {
        count: 160,
        color: '#f5a623',
        secondaryColor: DOT_COLOR,
        baseRadius: [1.0, 3.2] as [number, number],
        opacity: 0.45,
        pattern: 'radiate' as const,
      };
    case 'windy':
      return {
        count: 120,
        color: DOT_COLOR,
        secondaryColor: '#9ca3af',
        baseRadius: [0.6, 2.2] as [number, number],
        opacity: 0.35,
        pattern: 'streak' as const,
      };
    case 'cloudy':
      return {
        count: 180,
        color: '#9ca3af',
        secondaryColor: '#6b7280',
        baseRadius: [1.2, 3.8] as [number, number],
        opacity: 0.38,
        pattern: 'cluster' as const,
      };
    case 'rainy':
      return {
        count: 160,
        color: '#1e88e5',
        secondaryColor: '#9ca3af',
        baseRadius: [0.5, 1.6] as [number, number],
        opacity: 0.4,
        pattern: 'fall' as const,
      };
    case 'snowy':
      return {
        count: 140,
        color: '#94a3b8',
        secondaryColor: '#cbd5e1',
        baseRadius: [0.8, 2.6] as [number, number],
        opacity: 0.38,
        pattern: 'drift' as const,
      };
    case 'clear':
      return {
        count: 80,
        color: DOT_COLOR,
        secondaryColor: '#f5a623',
        baseRadius: [0.6, 1.8] as [number, number],
        opacity: 0.3,
        pattern: 'radiate' as const,
      };
  }
}

function generateParticles(count: number, w: number, h: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * w,
      y: h * 0.25 + Math.random() * h * 0.75,
      baseRadius: 1,
      speed: 0.2 + Math.random() * 0.8,
      angle: Math.random() * Math.PI * 2,
      phase: Math.random() * Math.PI * 2,
      drift: (Math.random() - 0.5) * 2,
    });
  }
  return particles;
}

function drawSunny(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  t: number,
  w: number,
  h: number,
  config: ReturnType<typeof getPhaseConfig>,
  alpha: number,
) {
  const cx = w * 0.15;
  const cy = h * 0.45;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const angle = p.angle + t * 0.3 * p.speed;
    const dist = 15 + (i / particles.length) * w * 0.45;
    const pulse = Math.sin(t * 1.5 + p.phase) * 0.4 + 0.6;
    const x = cx + Math.cos(angle) * dist;
    const y = cy + Math.sin(angle) * dist * 0.7;

    if (x < -5 || x > w + 5 || y < 0 || y > h + 5) continue;

    const r = lerp(config.baseRadius[0], config.baseRadius[1], pulse);
    const fadeDist = clamp(1 - dist / (w * 0.5), 0, 1);
    const op = config.opacity * fadeDist * pulse * alpha;

    ctx.beginPath();
    ctx.globalAlpha = op;
    ctx.fillStyle = i % 5 === 0 ? config.color : config.secondaryColor;
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWindy(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  t: number,
  w: number,
  h: number,
  config: ReturnType<typeof getPhaseConfig>,
  alpha: number,
) {
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const speed = p.speed * 60;
    let x = ((p.x + t * speed) % (w + 20)) - 10;
    const wobble = Math.sin(t * 2 + p.phase) * 3 * p.drift;
    const y = p.y + wobble;

    if (x < -5) x += w + 20;

    const stretchFactor = 1 + p.speed * 1.5;
    const r = lerp(config.baseRadius[0], config.baseRadius[1], p.speed);
    const op = config.opacity * (0.5 + p.speed * 0.5) * alpha;

    ctx.beginPath();
    ctx.globalAlpha = op;
    ctx.fillStyle = i % 3 === 0 ? config.secondaryColor : config.color;
    ctx.ellipse(x, y, r * stretchFactor, r * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCloudy(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  t: number,
  w: number,
  h: number,
  config: ReturnType<typeof getPhaseConfig>,
  alpha: number,
) {
  const cloudCenters = [
    { x: w * 0.15, y: h * 0.4 },
    { x: w * 0.4, y: h * 0.55 },
    { x: w * 0.25, y: h * 0.75 },
  ];

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const cloud = cloudCenters[i % cloudCenters.length];
    const drift = Math.sin(t * 0.4 + p.phase) * 8;
    const breathe = Math.sin(t * 0.6 + p.phase * 2) * 0.3 + 0.7;

    const spread = 40 + (i / particles.length) * 60;
    const x = cloud.x + Math.cos(p.angle) * spread * p.speed + drift;
    const y = cloud.y + Math.sin(p.angle) * spread * 0.4 * p.speed;

    if (x < -5 || x > w + 5 || y < 0 || y > h + 5) continue;

    const r = lerp(config.baseRadius[0], config.baseRadius[1], breathe);
    const op = config.opacity * breathe * alpha;

    ctx.beginPath();
    ctx.globalAlpha = op;
    ctx.fillStyle = i % 4 === 0 ? config.secondaryColor : config.color;
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRainy(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  t: number,
  w: number,
  h: number,
  config: ReturnType<typeof getPhaseConfig>,
  alpha: number,
) {
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const fallSpeed = p.speed * 80;
    const x = p.x + Math.sin(t * 0.5 + p.phase) * 2;
    let y = ((p.y + t * fallSpeed) % h);

    if (y < h * 0.2) y += h * 0.2;

    const r = lerp(config.baseRadius[0], config.baseRadius[1], p.speed);
    const streak = r * 2.5;
    const op = config.opacity * (0.4 + p.speed * 0.6) * alpha;

    ctx.beginPath();
    ctx.globalAlpha = op;
    ctx.fillStyle = i % 6 === 0 ? config.secondaryColor : config.color;
    ctx.ellipse(x, y, r * 0.5, streak, Math.PI * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSnowy(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  t: number,
  w: number,
  h: number,
  config: ReturnType<typeof getPhaseConfig>,
  alpha: number,
) {
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const fallSpeed = p.speed * 15;
    const sway = Math.sin(t * 0.8 + p.phase) * 15 * p.drift;
    const x = p.x + sway;
    let y = ((p.y + t * fallSpeed) % h);

    if (y < h * 0.15) y += h * 0.15;

    const breathe = Math.sin(t * 1.2 + p.phase) * 0.3 + 0.7;
    const r = lerp(config.baseRadius[0], config.baseRadius[1], breathe);
    const op = config.opacity * breathe * alpha;

    ctx.beginPath();
    ctx.globalAlpha = op;
    ctx.fillStyle = i % 3 === 0 ? config.secondaryColor : config.color;
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

const DRAW_FN = {
  sunny: drawSunny,
  windy: drawWindy,
  cloudy: drawCloudy,
  rainy: drawRainy,
  snowy: drawSnowy,
  clear: drawSunny,
} as const;

interface WeatherCycleProps {
  width?: number;
  height?: number;
  className?: string;
}

export default function WeatherCycle({
  width = 320,
  height = 200,
  className,
}: WeatherCycleProps) {
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

    // Pre-generate particles for each phase
    const phaseParticles = new Map<WeatherPhase, Particle[]>();
    for (const phase of PHASES) {
      const config = getPhaseConfig(phase);
      phaseParticles.set(phase, generateParticles(config.count, width, height));
    }

    if (reducedMotion) {
      // Static: draw first phase only
      const config = getPhaseConfig('sunny');
      const particles = phaseParticles.get('sunny')!;
      ctx.scale(dpr, dpr);
      drawSunny(ctx, particles, 0, width, height, config, 1);
      return;
    }

    const cycleDuration = PHASE_DURATION + TRANSITION_DURATION;
    const totalCycle = cycleDuration * PHASES.length;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = (now - startTime) % totalCycle;
      const phaseIndex = Math.floor(elapsed / cycleDuration);
      const phaseTime = elapsed - phaseIndex * cycleDuration;

      const currentPhase = PHASES[phaseIndex];
      const nextPhase = PHASES[(phaseIndex + 1) % PHASES.length];

      const currentConfig = getPhaseConfig(currentPhase);
      const nextConfig = getPhaseConfig(nextPhase);

      const currentParticles = phaseParticles.get(currentPhase)!;
      const nextParticles = phaseParticles.get(nextPhase)!;

      const t = (now - startTime) / 1000;

      // Calculate crossfade alpha
      let currentAlpha = 1;
      let nextAlpha = 0;

      if (phaseTime > PHASE_DURATION) {
        const transProgress = (phaseTime - PHASE_DURATION) / TRANSITION_DURATION;
        const eased = transProgress * transProgress * (3 - 2 * transProgress); // smoothstep
        currentAlpha = 1 - eased;
        nextAlpha = eased;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      // Draw current phase
      const drawCurrent = DRAW_FN[currentPhase];
      drawCurrent(ctx, currentParticles, t, width, height, currentConfig, currentAlpha);

      // Draw next phase (during transition)
      if (nextAlpha > 0.01) {
        const drawNext = DRAW_FN[nextPhase];
        drawNext(ctx, nextParticles, t, width, height, nextConfig, nextAlpha);
      }

      ctx.restore();
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [width, height, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className={className ?? 'absolute bottom-0 left-0 z-0 pointer-events-none'}
      aria-hidden="true"
    />
  );
}
