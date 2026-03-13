'use client';

import { useEffect, useState, useRef } from 'react';
import { useReducedMotion } from '../core/useReducedMotion';
import { PARTICLE_FADE_DURATION, DOT_COLOR } from '../core/constants';

interface InsightBloomProps {
  /** Trigger key — bloom fires when this value changes. */
  trigger: string | number | boolean;
  /** Number of particles in the bloom. */
  dotCount?: number;
  /** Travel distance of particles in px. */
  travelDistance?: number;
  /** Dot size in px. */
  dotSize?: number;
  /** Color of bloom particles. */
  color?: string;
}

interface Particle {
  id: number;
  angle: number;
  visible: boolean;
}

/**
 * Burst particle animation that fires on state transitions.
 * A cluster of dots blooms outward from the component center, fading out.
 *
 * Used on:
 * - KimpCard 30-day badge state change
 * - SignalBadge level change
 */
export default function InsightBloom({
  trigger,
  dotCount = 6,
  travelDistance = 25,
  dotSize = 3,
  color = DOT_COLOR,
}: InsightBloomProps) {
  const reducedMotion = useReducedMotion();
  const [particles, setParticles] = useState<Particle[]>([]);
  const [animating, setAnimating] = useState(false);
  const prevTriggerRef = useRef(trigger);
  const idCounterRef = useRef(0);

  useEffect(() => {
    if (prevTriggerRef.current === trigger) return;
    prevTriggerRef.current = trigger;

    if (reducedMotion) return;

    // Generate particles spread evenly around 360°
    const newParticles: Particle[] = Array.from({ length: dotCount }, (_, i) => ({
      id: idCounterRef.current++,
      angle: (i / dotCount) * 360,
      visible: true,
    }));

    setParticles(newParticles);
    setAnimating(true);

    const timeout = setTimeout(() => {
      setAnimating(false);
      setParticles([]);
    }, PARTICLE_FADE_DURATION);

    return () => clearTimeout(timeout);
  }, [trigger, dotCount, reducedMotion]);

  if (!animating || particles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" aria-hidden="true">
      <div className="relative w-full h-full">
        {particles.map((p) => {
          const rad = (p.angle * Math.PI) / 180;
          const tx = Math.cos(rad) * travelDistance;
          const ty = Math.sin(rad) * travelDistance;

          return (
            <div
              key={p.id}
              className="absolute rounded-full"
              style={{
                width: `${dotSize}px`,
                height: `${dotSize}px`,
                backgroundColor: color,
                left: '50%',
                top: '50%',
                marginLeft: `${-dotSize / 2}px`,
                marginTop: `${-dotSize / 2}px`,
                transform: `translate(${tx}px, ${ty}px)`,
                opacity: 0,
                transition: `transform ${PARTICLE_FADE_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1), opacity ${PARTICLE_FADE_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
              }}
              ref={(el) => {
                // Trigger animation on next frame
                if (el) {
                  requestAnimationFrame(() => {
                    el.style.opacity = '0';
                    el.style.transform = `translate(${tx}px, ${ty}px)`;
                  });
                  // Start visible from center
                  el.style.opacity = '1';
                  el.style.transform = 'translate(0, 0)';
                }
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
