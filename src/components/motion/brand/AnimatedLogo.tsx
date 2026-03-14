'use client';

import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useReducedMotion } from '../core/useReducedMotion';

// ── Logo dot definitions (matching the original SVG) ──
interface LogoDot {
  cx: number;
  cy: number;
  r: number;
}

const LOGO_DOTS: LogoDot[] = [
  { cx: 6, cy: 6, r: 2.5 },
  { cx: 14, cy: 6, r: 3.5 },
  { cx: 22, cy: 6, r: 2 },
  { cx: 6, cy: 14, r: 3 },
  { cx: 14, cy: 14, r: 4 },
  { cx: 6, cy: 22, r: 1.5 },
];

// ── Animation phases ──
enum Phase {
  Dispersed,
  Converging,
  Holding,
  Releasing,
}

export interface AnimatedLogoProps {
  /** Width & height of the SVG in px. Default: 24 */
  size?: number;
  /** CSS class for the SVG element */
  className?: string;
  /** How far dots scatter from their home position (px in viewBox). Default: 4 */
  spread?: number;
  /** Duration of converge/release phase in ms. Default: 1400 */
  transitionDuration?: number;
  /** Duration of the stable hold in ms. Default: 1200 */
  holdDuration?: number;
  /** Duration of the dispersed/latent pause in ms. Default: 600 */
  dispersedDuration?: number;
  /** Overall intensity 0–1 (scales spread + opacity variation). Default: 1 */
  intensity?: number;
  /** Dot fill color. Default: #1a1a1a */
  color?: string;
}

/** Seeded pseudo-random offsets per dot so the drift pattern is deterministic. */
function seededOffsets(count: number): { dx: number; dy: number; dr: number; dOp: number }[] {
  // Simple deterministic hash for each dot index
  const offsets: { dx: number; dy: number; dr: number; dOp: number }[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i * 137.508) * (Math.PI / 180); // golden angle
    const mag = 0.6 + (i % 3) * 0.2; // 0.6–1.0
    offsets.push({
      dx: Math.cos(angle) * mag,
      dy: Math.sin(angle) * mag,
      dr: 0.85 + (i % 2) * 0.15, // radius scale 0.85–1.0
      dOp: 0.55 + (i % 3) * 0.15, // opacity 0.55–0.85
    });
  }
  return offsets;
}

/** Smooth ease-in-out (sinusoidal). */
function easeInOut(t: number): number {
  return 0.5 - 0.5 * Math.cos(Math.PI * t);
}

export default function AnimatedLogo({
  size = 24,
  className = 'opacity-80',
  spread = 4,
  transitionDuration = 1400,
  holdDuration = 1200,
  dispersedDuration = 600,
  intensity = 1,
  color = '#1a1a1a',
}: AnimatedLogoProps) {
  const reducedMotion = useReducedMotion();
  const circleRefs = useRef<(SVGCircleElement | null)[]>([]);
  const groupRef = useRef<SVGGElement | null>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  const effectiveSpread = spread * intensity;

  const offsets = useMemo(() => seededOffsets(LOGO_DOTS.length), []);

  // Total cycle duration
  const cycleDuration = useMemo(
    () => dispersedDuration + transitionDuration + holdDuration + transitionDuration,
    [dispersedDuration, transitionDuration, holdDuration],
  );

  const animate = useCallback(
    (time: number) => {
      if (startRef.current === 0) startRef.current = time;
      const elapsed = (time - startRef.current) % cycleDuration;

      let phase: Phase;
      let phaseProgress: number;

      if (elapsed < dispersedDuration) {
        phase = Phase.Dispersed;
        phaseProgress = elapsed / dispersedDuration;
      } else if (elapsed < dispersedDuration + transitionDuration) {
        phase = Phase.Converging;
        phaseProgress = (elapsed - dispersedDuration) / transitionDuration;
      } else if (elapsed < dispersedDuration + transitionDuration + holdDuration) {
        phase = Phase.Holding;
        phaseProgress = (elapsed - dispersedDuration - transitionDuration) / holdDuration;
      } else {
        phase = Phase.Releasing;
        phaseProgress =
          (elapsed - dispersedDuration - transitionDuration - holdDuration) / transitionDuration;
      }

      for (let i = 0; i < LOGO_DOTS.length; i++) {
        const el = circleRefs.current[i];
        if (!el) continue;

        const dot = LOGO_DOTS[i];
        const off = offsets[i];

        // dispersion factor: 1 = fully dispersed, 0 = home
        let d: number;
        switch (phase) {
          case Phase.Dispersed:
            // Gentle breathing while dispersed
            d = 0.85 + 0.15 * Math.sin(phaseProgress * Math.PI * 0.5);
            break;
          case Phase.Converging:
            d = 1 - easeInOut(phaseProgress);
            break;
          case Phase.Holding:
            // Very subtle micro-movement while holding
            d = 0.03 * Math.sin(phaseProgress * Math.PI * 2);
            break;
          case Phase.Releasing:
            d = easeInOut(phaseProgress);
            break;
        }

        const cx = dot.cx + off.dx * effectiveSpread * d;
        const cy = dot.cy + off.dy * effectiveSpread * d;
        const r = dot.r * (1 - (1 - off.dr) * d * intensity);
        const opacity = 1 - (1 - off.dOp) * d * intensity;

        el.setAttribute('cx', cx.toFixed(2));
        el.setAttribute('cy', cy.toFixed(2));
        el.setAttribute('r', r.toFixed(3));
        el.setAttribute('opacity', opacity.toFixed(3));
      }

      // Rotate the whole logo group: full 360° over one cycle
      if (groupRef.current) {
        const rotationProgress = elapsed / cycleDuration;
        const angle = rotationProgress * 360;
        groupRef.current.setAttribute('transform', `rotate(${angle.toFixed(1)} 12 12)`);
      }

      rafRef.current = requestAnimationFrame(animate);
    },
    [cycleDuration, dispersedDuration, transitionDuration, holdDuration, effectiveSpread, intensity, offsets],
  );

  useEffect(() => {
    if (reducedMotion) return;
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate, reducedMotion]);

  // Static fallback when reduced motion is preferred
  if (reducedMotion) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        aria-hidden="true"
      >
        {LOGO_DOTS.map((dot, i) => (
          <circle key={i} cx={dot.cx} cy={dot.cy} r={dot.r} fill={color} />
        ))}
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <g ref={groupRef}>
        {LOGO_DOTS.map((dot, i) => (
          <circle
            key={i}
            ref={(el) => {
              circleRefs.current[i] = el;
            }}
            cx={dot.cx}
            cy={dot.cy}
            r={dot.r}
            fill={color}
          />
        ))}
      </g>
    </svg>
  );
}
