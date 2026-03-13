'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { useReducedMotion } from '../core/useReducedMotion';
import { DOT_COLOR } from '../core/constants';
import { easeOut, easeInOut, lerp, clamp } from '../core/dot-math';

export interface DotTab {
  /** Unique key for this tab. */
  key: string;
  /** Display label for the tab. */
  label: string;
}

export interface DotTabBarProps {
  /** Array of tab definitions. */
  tabs: DotTab[];
  /** Currently active tab key. */
  activeKey: string;
  /** Called when user clicks a tab. */
  onChange: (key: string) => void;
  /** Number of dots in the active indicator. Default 7. */
  indicatorDots?: number;
  /** Indicator dot radius in px. Default 2. */
  indicatorRadius?: number;
  /** Transition duration ms for indicator movement. Default 400. */
  transitionDuration?: number;
  /** Spacing between indicator dots in px. Default 4. */
  indicatorSpacing?: number;
  /** How much indicator dots scatter during transition. 0–1. Default 0.6. */
  scatterStrength?: number;
  /** Tab label class overrides. */
  tabClassName?: string;
  /** Active tab label class overrides. */
  activeTabClassName?: string;
  className?: string;
}

interface IndicatorState {
  fromX: number;
  toX: number;
  fromWidth: number;
  toWidth: number;
  progress: number;
  animating: boolean;
}

/**
 * Tab bar with dot-based active indicator.
 *
 * Instead of a sliding underline, the active tab is marked by a row
 * of dots beneath it. When switching tabs, the dots briefly scatter
 * into ambiguity (losing their structure), then reconverge beneath
 * the new active tab — creating the feeling that the system is
 * reorganizing its focus rather than sliding a decoration.
 *
 * The scatter creates a moment of "field uncertainty" that resolves
 * into the new state, consistent with the dissolve/reconfigure
 * behavior in DotMorphHeadline and DotKPIValue.
 */
export default function DotTabBar({
  tabs,
  activeKey,
  onChange,
  indicatorDots = 7,
  indicatorRadius = 2,
  transitionDuration = 400,
  indicatorSpacing = 4,
  scatterStrength = 0.6,
  tabClassName = '',
  activeTabClassName = '',
  className = '',
}: DotTabBarProps) {
  const reducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const containerRef = useRef<HTMLDivElement>(null!);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const rafRef = useRef(0);
  const stateRef = useRef<IndicatorState>({
    fromX: 0, toX: 0, fromWidth: 0, toWidth: 0,
    progress: 1, animating: false,
  });
  const startTimeRef = useRef(0);
  const scatterSeedsRef = useRef<number[]>([]);

  // Generate scatter seeds for each dot (deterministic per transition)
  const regenerateSeeds = useCallback(() => {
    scatterSeedsRef.current = Array.from({ length: indicatorDots }, (_, i) => {
      return (Math.sin(i * 127.1 + Date.now() * 0.001) * 43758.5453) % 1;
    });
  }, [indicatorDots]);

  // Measure tab positions and update indicator
  const measureAndAnimate = useCallback((animate: boolean) => {
    const container = containerRef.current;
    if (!container) return;

    const activeEl = tabRefs.current.get(activeKey);
    if (!activeEl) return;

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();

    const newX = activeRect.left - containerRect.left;
    const newWidth = activeRect.width;

    const state = stateRef.current;

    if (animate && !reducedMotion && state.progress >= 1) {
      state.fromX = state.toX;
      state.fromWidth = state.toWidth;
      state.toX = newX;
      state.toWidth = newWidth;
      state.progress = 0;
      state.animating = true;
      startTimeRef.current = performance.now();
      regenerateSeeds();
    } else {
      state.fromX = newX;
      state.toX = newX;
      state.fromWidth = newWidth;
      state.toWidth = newWidth;
      state.progress = 1;
      state.animating = false;
    }
  }, [activeKey, reducedMotion, regenerateSeeds]);

  // Track active tab changes
  const prevKeyRef = useRef(activeKey);
  useEffect(() => {
    const shouldAnimate = prevKeyRef.current !== activeKey;
    prevKeyRef.current = activeKey;
    measureAndAnimate(shouldAnimate);
  }, [activeKey, measureAndAnimate]);

  // Initial measurement
  useEffect(() => {
    measureAndAnimate(false);
  }, [measureAndAnimate]);

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  // Render the dot indicator
  const renderIndicator = useCallback((now: number) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const containerRect = container.getBoundingClientRect();
    const canvasW = containerRect.width;
    const canvasH = indicatorRadius * 2 + 8; // dot area + padding

    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    canvas.style.width = `${canvasW}px`;
    canvas.style.height = `${canvasH}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    const state = stateRef.current;

    // Advance animation
    if (state.animating) {
      const elapsed = now - startTimeRef.current;
      state.progress = clamp(elapsed / transitionDuration, 0, 1);
      if (state.progress >= 1) {
        state.animating = false;
        state.fromX = state.toX;
        state.fromWidth = state.toWidth;
      }
    }

    const t = easeInOut(state.progress);

    // Current indicator position (center)
    const currentX = lerp(state.fromX, state.toX, t);
    const currentWidth = lerp(state.fromWidth, state.toWidth, t);
    const centerX = currentX + currentWidth / 2;
    const centerY = canvasH / 2;

    // Total indicator width
    const totalDotsWidth = (indicatorDots - 1) * indicatorSpacing;

    for (let i = 0; i < indicatorDots; i++) {
      const normalX = (i / (indicatorDots - 1)) * totalDotsWidth - totalDotsWidth / 2;
      let dotX = centerX + normalX;
      let dotY = centerY;
      let radius = indicatorRadius;
      let opacity = 1;

      // During transition: scatter dots into ambiguity
      if (state.animating && state.progress < 1) {
        const scatter = Math.sin(state.progress * Math.PI); // 0→1→0 arc
        const seed = scatterSeedsRef.current[i] ?? 0.5;

        // Scatter perpendicular to travel direction
        const scatterY = (seed - 0.5) * 2 * scatter * scatterStrength * 12;
        // Scatter along travel with noise
        const scatterX = (seed * 2 - 1) * scatter * scatterStrength * 6;

        dotY += scatterY;
        dotX += scatterX;

        // Dots shrink during peak scatter, then regrow
        const sizeMod = 1 - scatter * 0.4;
        radius *= sizeMod;

        // Opacity dips during scatter
        opacity = 1 - scatter * 0.3;
      }

      ctx.beginPath();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = DOT_COLOR;
      ctx.arc(dotX, dotY, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }, [dpr, indicatorDots, indicatorRadius, indicatorSpacing, transitionDuration, scatterStrength]);

  // Animation loop
  useEffect(() => {
    const tick = (now: number) => {
      renderIndicator(now);
      if (stateRef.current.animating) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    // Initial render
    renderIndicator(performance.now());

    if (stateRef.current.animating) {
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => cancelAnimationFrame(rafRef.current);
  }, [renderIndicator, activeKey]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="flex gap-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            ref={el => {
              if (el) tabRefs.current.set(tab.key, el);
            }}
            onClick={() => onChange(tab.key)}
            className={`px-3 py-1.5 text-xs font-mono transition-colors ${
              activeKey === tab.key
                ? `text-dot-accent font-medium ${activeTabClassName}`
                : `text-dot-muted hover:text-dot-accent ${tabClassName}`
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        className="block pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}
