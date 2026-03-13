'use client';

import { useRef, useEffect, useCallback } from 'react';
import type { Dot, DotFieldConfig, DotModifier } from './dot-types';
import { FRAME_SKIP_THRESHOLD_MS } from './constants';

interface UseDotFieldResult {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  updateModifier: (modifier: DotModifier | null) => void;
  pause: () => void;
  resume: () => void;
  getDots: () => Dot[];
}

/**
 * Core hook that manages a dot field on a canvas element.
 *
 * - Creates dots in a grid pattern on init
 * - Runs requestAnimationFrame loop
 * - Applies modifier function each frame
 * - Renders all dots in a single batched draw call
 * - Handles DPR, pause/resume, and frame skipping
 */
export function useDotField(config: DotFieldConfig): UseDotFieldResult {
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const dotsRef = useRef<Dot[]>([]);
  const modifierRef = useRef<DotModifier | null>(null);
  const pausedRef = useRef(false);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);

  // Initialize dots grid
  const initDots = useCallback((width: number, height: number) => {
    const dots: Dot[] = [];
    const cols = Math.ceil(width / config.gridSpacing) + 1;
    const rows = Math.ceil(height / config.gridSpacing) + 1;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        dots.push({
          x: col * config.gridSpacing,
          y: row * config.gridSpacing,
          baseRadius: config.baseRadius,
          currentRadius: config.baseRadius,
          opacity: config.maxOpacity,
          phase: Math.random() * Math.PI * 2,
          vx: 0,
          vy: 0,
        });
      }
    }

    dotsRef.current = dots;
  }, [config.gridSpacing, config.baseRadius, config.maxOpacity]);

  // Render all dots in one batched call
  const render = useCallback((ctx: CanvasRenderingContext2D, dpr: number) => {
    const dots = dotsRef.current;
    const canvas = ctx.canvas;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    // Group by opacity for fewer state changes
    let lastOpacity = -1;

    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i];
      if (dot.currentRadius <= 0 || dot.opacity <= 0) continue;

      if (dot.opacity !== lastOpacity) {
        if (lastOpacity !== -1) ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = config.color;
        ctx.globalAlpha = dot.opacity;
        lastOpacity = dot.opacity;
      }

      ctx.moveTo(dot.x + dot.currentRadius, dot.y);
      ctx.arc(dot.x, dot.y, dot.currentRadius, 0, Math.PI * 2);
    }

    if (lastOpacity !== -1) ctx.fill();
    ctx.restore();
  }, [config.color]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = config.dpr;
    canvas.width = config.width * dpr;
    canvas.height = config.height * dpr;
    canvas.style.width = `${config.width}px`;
    canvas.style.height = `${config.height}px`;

    initDots(config.width, config.height);
    startTimeRef.current = performance.now();
    lastFrameRef.current = startTimeRef.current;

    if (config.reducedMotion) {
      // Render single static frame
      render(ctx, dpr);
      return;
    }

    const tick = (now: number) => {
      if (pausedRef.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const dt = now - lastFrameRef.current;

      // Skip frame if we're falling behind
      if (dt > FRAME_SKIP_THRESHOLD_MS) {
        lastFrameRef.current = now;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const time = (now - startTimeRef.current) / 1000;
      lastFrameRef.current = now;

      // Apply modifier
      const modifier = modifierRef.current;
      if (modifier) {
        modifier(dotsRef.current, time, dt / 1000);
      }

      render(ctx, dpr);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [config.width, config.height, config.dpr, config.reducedMotion, initDots, render]);

  const updateModifier = useCallback((modifier: DotModifier | null) => {
    modifierRef.current = modifier;
  }, []);

  const pause = useCallback(() => { pausedRef.current = true; }, []);
  const resume = useCallback(() => { pausedRef.current = false; }, []);
  const getDots = useCallback(() => dotsRef.current, []);

  return { canvasRef, updateModifier, pause, resume, getDots };
}
