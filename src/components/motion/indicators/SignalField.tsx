'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useReducedMotion } from '../core/useReducedMotion';
import { DOT_RED, DOT_BLUE, DOT_COLOR } from '../core/constants';
import { clamp, lerp } from '../core/dot-math';

type SignalLevel = '과열' | '중립' | '침체';

interface SignalFieldProps {
  /** Current signal level. */
  level: SignalLevel | string;
  /** Width of the field in px. Default 80. */
  width?: number;
  /** Height of the field in px. Default 80. */
  height?: number;
}

interface FieldDot {
  x: number;
  y: number;
  baseRadius: number;
  dist: number;       // distance from origin corner
  phase: number;      // individual phase offset
}

function getFieldConfig(level: string) {
  switch (level) {
    case '과열':
      return {
        color: DOT_RED,
        dotCount: 60,
        pulseSpeed: 1.8,       // fast pulse = urgency
        radiusRange: [1.2, 3.2] as [number, number],
        spreadRadius: 200,
        opacityBase: 0.35,
      };
    case '침체':
      return {
        color: DOT_BLUE,
        dotCount: 45,
        pulseSpeed: 0.6,       // slow pulse = depression
        radiusRange: [1.0, 2.6] as [number, number],
        spreadRadius: 170,
        opacityBase: 0.3,
      };
    default:
      return {
        color: DOT_COLOR,
        dotCount: 20,
        pulseSpeed: 0.3,       // barely moving = calm
        radiusRange: [0.6, 1.4] as [number, number],
        spreadRadius: 120,
        opacityBase: 0.12,
      };
  }
}

/**
 * Animated dot field for signal intensity visualization.
 *
 * Dots radiate from the top-right corner.
 * - 과열: many red dots, fast pulsing outward — "pressure building"
 * - 침체: fewer blue dots, slow breathing — "energy draining"
 * - 중립: sparse gray dots, nearly still — "nothing notable"
 *
 * The visual difference is immediate and needs no label to understand:
 * lots of fast red dots = something is wrong,
 * still gray dots = everything is calm.
 */
export default function SignalField({
  level,
  width = 80,
  height = 80,
}: SignalFieldProps) {
  const reducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const rafRef = useRef(0);
  const dotsRef = useRef<FieldDot[]>([]);
  const configRef = useRef(getFieldConfig(level));
  const transitionRef = useRef({ progress: 1, fromConfig: configRef.current });

  // Generate dots in a radial pattern from top-right corner
  const generateDots = useCallback((config: ReturnType<typeof getFieldConfig>) => {
    const dots: FieldDot[] = [];
    const originX = width;
    const originY = 0;

    for (let i = 0; i < config.dotCount; i++) {
      // Distribute in a wide arc from the corner (down-left, covering more area)
      const angle = (Math.PI / 3) + (Math.random() * Math.PI * 2 / 3); // 60°–180°
      const dist = 8 + Math.random() * config.spreadRadius;
      const x = originX + Math.cos(angle) * dist;
      const y = originY + Math.sin(angle) * dist;

      // Only keep dots within bounds
      if (x >= -5 && x <= width + 5 && y >= -5 && y <= height + 5) {
        dots.push({
          x,
          y,
          baseRadius: lerp(config.radiusRange[0], config.radiusRange[1], Math.random()),
          dist,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    // Sort by distance so closer dots render on top
    dots.sort((a, b) => a.dist - b.dist);
    return dots;
  }, [width, height]);

  // Handle level changes
  useEffect(() => {
    const newConfig = getFieldConfig(level);
    transitionRef.current = {
      progress: 0,
      fromConfig: configRef.current,
    };
    configRef.current = newConfig;
    dotsRef.current = generateDots(newConfig);
  }, [level, generateDots]);

  // Init dots
  useEffect(() => {
    dotsRef.current = generateDots(configRef.current);
  }, [generateDots]);

  // Animation loop
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

    if (reducedMotion) {
      // Static render
      ctx.scale(dpr, dpr);
      const config = configRef.current;
      ctx.fillStyle = config.color;
      for (const dot of dotsRef.current) {
        ctx.beginPath();
        ctx.globalAlpha = config.opacityBase;
        ctx.arc(dot.x, dot.y, dot.baseRadius, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    const startTime = performance.now();

    const tick = (now: number) => {
      const t = (now - startTime) / 1000;
      const config = configRef.current;
      const transition = transitionRef.current;

      // Advance transition
      if (transition.progress < 1) {
        transition.progress = clamp(transition.progress + 0.02, 0, 1);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      const dots = dotsRef.current;

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        // Radial pulse wave from corner
        // Each dot pulses based on its distance from origin + time
        const wavePhase = dot.dist / 30 - t * config.pulseSpeed;
        const wave = (Math.sin(wavePhase * Math.PI * 2 + dot.phase) + 1) / 2;

        // Radius: base ± wave modulation
        const radiusMod = 0.6 + wave * 0.8;
        const radius = dot.baseRadius * radiusMod;

        // Opacity: closer dots are more opaque, wave adds shimmer
        const distFade = 1 - clamp(dot.dist / config.spreadRadius, 0, 1) * 0.6;
        const opacity = config.opacityBase * distFade * (0.5 + wave * 0.5);

        // During transition, fade in new dots
        const transAlpha = transition.progress < 1
          ? clamp((transition.progress - i / dots.length * 0.5) * 3, 0, 1)
          : 1;

        if (radius <= 0 || opacity <= 0) continue;

        ctx.beginPath();
        ctx.globalAlpha = opacity * transAlpha;
        ctx.fillStyle = config.color;
        ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
        ctx.fill();
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
      className="absolute top-0 right-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
