'use client';

import { useEffect, useRef } from 'react';

interface DotLayer {
  size: number;
  radius: number;
  opacity: number;
  speed: number;
  color?: string;
}

interface ParallaxDotsProps {
  layers: DotLayer[];
  className?: string;
}

const DEFAULT_LAYERS: DotLayer[] = [
  { size: 14, radius: 0.8, opacity: 0.07, speed: 0.3, color: '#1a1a1a' },
  { size: 24, radius: 1.2, opacity: 0.03, speed: 0.15, color: '#1a1a1a' },
];

export function ParallaxDots({
  layers = DEFAULT_LAYERS,
  className = '',
}: ParallaxDotsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<HTMLDivElement[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (prefersReducedMotion) return;

    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      rafRef.current = requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect();
        const scrollProgress = -rect.top;

        layerRefs.current.forEach((layerEl, i) => {
          if (!layerEl || !layers[i]) return;
          const offset = scrollProgress * layers[i].speed;
          layerEl.style.transform = `translateY(${offset}px)`;
        });
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [layers]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {layers.map((layer, i) => (
        <div
          key={i}
          ref={(el) => {
            if (el) layerRefs.current[i] = el;
          }}
          className="absolute will-change-transform"
          style={{
            inset: '-20%',
            backgroundImage: `radial-gradient(circle, ${layer.color ?? '#1a1a1a'} ${layer.radius}px, transparent ${layer.radius}px)`,
            backgroundSize: `${layer.size}px ${layer.size}px`,
            opacity: layer.opacity,
          }}
        />
      ))}
    </div>
  );
}

export const DARK_PARALLAX_LAYERS: DotLayer[] = [
  { size: 16, radius: 0.6, opacity: 0.04, speed: 0.3, color: '#f5f5f0' },
  { size: 28, radius: 1.0, opacity: 0.02, speed: 0.15, color: '#f5f5f0' },
];
