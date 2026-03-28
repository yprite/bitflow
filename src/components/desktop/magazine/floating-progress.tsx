'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface Section {
  id: string;
  label: string;
}

interface FloatingProgressProps {
  sections: Section[];
}

export function FloatingProgress({ sections }: FloatingProgressProps) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isVisible, setIsVisible] = useState(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setIsVisible(window.scrollY > window.innerHeight * 0.8);

        let currentIndex = -1;
        for (let i = sections.length - 1; i >= 0; i--) {
          const el = document.getElementById(sections[i].id);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= window.innerHeight * 0.4) {
              currentIndex = i;
              break;
            }
          }
        }
        setActiveIndex(currentIndex);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [sections]);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <nav
      className={`fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-3 transition-opacity duration-300 xl:flex ${
        isVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-label="Page sections"
    >
      {sections.map((section, i) => (
        <button
          key={section.id}
          type="button"
          className="group flex items-center justify-end gap-3 text-right"
          onClick={() => scrollTo(section.id)}
          aria-label={section.label}
          title={section.label}
        >
          <span
            className={`h-px transition-all duration-200 ${
              i === activeIndex ? 'w-8 bg-dot-accent' : 'w-4 bg-dot-border group-hover:w-6 group-hover:bg-dot-muted'
            }`}
          />
          <span
            className={`text-[10px] uppercase tracking-[0.14em] ${
              i === activeIndex ? 'text-dot-accent' : 'text-dot-muted'
            }`}
          >
            {section.label}
          </span>
        </button>
      ))}
    </nav>
  );
}
