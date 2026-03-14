'use client';

import { useState, useCallback, useRef, type ReactNode, type TouchEvent } from 'react';

interface IndicatorCarouselProps {
  children: ReactNode[];
  labels: string[];
}

export default function IndicatorCarousel({ children, labels }: IndicatorCarouselProps) {
  const [active, setActive] = useState(0);
  const touchStart = useRef<number | null>(null);
  const touchDelta = useRef(0);
  const total = children.length;

  const go = useCallback((idx: number) => {
    setActive(((idx % total) + total) % total);
  }, [total]);

  const onTouchStart = (e: TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
    touchDelta.current = 0;
  };

  const onTouchMove = (e: TouchEvent) => {
    if (touchStart.current === null) return;
    touchDelta.current = e.touches[0].clientX - touchStart.current;
  };

  const onTouchEnd = () => {
    if (Math.abs(touchDelta.current) > 50) {
      go(active + (touchDelta.current < 0 ? 1 : -1));
    }
    touchStart.current = null;
    touchDelta.current = 0;
  };

  return (
    <div>
      {/* Dot indicators + label */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {labels.map((label, i) => (
            <button
              key={label}
              onClick={() => go(i)}
              className={`text-[9px] font-mono px-1.5 py-0.5 transition-all ${
                i === active
                  ? 'text-dot-accent border-b border-dot-accent'
                  : 'text-dot-muted/50 hover:text-dot-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => go(active - 1)}
            className="text-[10px] text-dot-muted hover:text-dot-accent transition font-mono px-1"
          >
            ◄
          </button>
          <button
            onClick={() => go(active + 1)}
            className="text-[10px] text-dot-muted hover:text-dot-accent transition font-mono px-1"
          >
            ►
          </button>
        </div>
      </div>

      {/* Carousel viewport */}
      <div
        className="overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex transition-transform duration-400 ease-out"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {children.map((child, i) => (
            <div key={i} className="w-full flex-shrink-0">
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Dot pager */}
      <div className="flex justify-center gap-1.5 mt-2">
        {labels.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              i === active ? 'bg-dot-accent scale-125' : 'bg-dot-border hover:bg-dot-muted'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
