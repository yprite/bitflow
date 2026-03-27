'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
  rootMargin?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  threshold = 0.15,
  rootMargin = '0px 0px -60px 0px',
  as: Tag = 'div',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => setIsVisible(true), delay);
          } else {
            setIsVisible(true);
          }
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, threshold, rootMargin]);

  const Component = Tag as any;

  return (
    <Component
      ref={ref}
      className={`${isVisible ? 'scroll-reveal-visible' : 'scroll-reveal-hidden'} ${className}`}
    >
      {children}
    </Component>
  );
}
