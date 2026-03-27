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
      className={`floating-progress ${isVisible ? 'visible' : ''}`}
      aria-label="Page sections"
    >
      {sections.map((section, i) => (
        <div key={section.id} className="flex flex-col items-center">
          <button
            className={`floating-progress-dot ${i === activeIndex ? 'active' : ''}`}
            onClick={() => scrollTo(section.id)}
            aria-label={section.label}
            title={section.label}
          />
          {i < sections.length - 1 && <div className="floating-progress-line" />}
        </div>
      ))}
    </nav>
  );
}
