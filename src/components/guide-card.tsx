'use client';

import { useEffect, useState, type ReactNode } from 'react';

interface GuideCardProps {
  title: string;
  maxHeight?: number;
  intro?: ReactNode;
  children?: ReactNode;
}

export default function GuideCard({
  title,
  maxHeight = 320,
  intro,
  children,
}: GuideCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <section className="dot-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold text-dot-accent uppercase tracking-wider">{title}</h2>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="inline-flex items-center gap-1 text-[10px] text-dot-muted hover:text-dot-accent transition font-mono"
        >
          <span>{expanded ? '접기' : '펼치기'}</span>
          <span
            aria-hidden="true"
            className="inline-block transition-transform duration-200"
            style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            ▾
          </span>
        </button>
      </div>
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{
          maxHeight: ready && expanded ? `${maxHeight}px` : '0px',
          opacity: ready && expanded ? 1 : 0,
        }}
      >
        <div className="pt-3 space-y-3">
          {intro ? <div className="text-xs text-dot-sub leading-relaxed">{intro}</div> : null}
          {children}
        </div>
      </div>
    </section>
  );
}
