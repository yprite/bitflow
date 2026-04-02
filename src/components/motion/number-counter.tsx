'use client';

import { useEffect, useRef, useState } from 'react';

interface NumberCounterProps {
  value: number;
  from?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  format?: (value: number) => string;
  className?: string;
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function autoDecimals(value: number): number {
  const str = String(value);
  const dot = str.indexOf('.');
  return dot === -1 ? 0 : str.length - dot - 1;
}

export function NumberCounter({
  value,
  from = 0,
  duration = 1200,
  decimals,
  prefix = '',
  suffix = '',
  format,
  className = '',
}: NumberCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayValue, setDisplayValue] = useState(from);
  const [hasAnimated, setHasAnimated] = useState(false);

  const resolvedDecimals = decimals ?? autoDecimals(value);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (prefersReducedMotion) {
      setDisplayValue(value);
      setHasAnimated(true);
      return;
    }

    const el = ref.current;
    if (!el || hasAnimated) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.unobserve(el);
          setHasAnimated(true);

          const startTime = performance.now();
          const delta = value - from;

          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutExpo(progress);
            setDisplayValue(from + delta * eased);

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setDisplayValue(value);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, from, duration, hasAnimated]);

  const formatted = format
    ? format(displayValue)
    : displayValue.toFixed(resolvedDecimals);

  return (
    <span
      ref={ref}
      className={`number-counter ${className}`}
      aria-label={`${prefix}${format ? format(value) : value.toFixed(resolvedDecimals)}${suffix}`}
    >
      <span aria-hidden="true">
        {prefix}
        {formatted}
        {suffix}
      </span>
    </span>
  );
}
