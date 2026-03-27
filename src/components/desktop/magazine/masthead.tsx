import { type ReactNode } from 'react';
import { ParallaxDots } from '@/components/motion/parallax-dots';

interface MastheadProps {
  edition: string;
  meta: string;
  headline: ReactNode;
  subhead?: ReactNode;
  bottom?: ReactNode;
  center?: ReactNode;
}

export function Masthead({
  edition,
  meta,
  headline,
  subhead,
  bottom,
  center,
}: MastheadProps) {
  return (
    <section id="masthead" className="magazine-masthead magazine-section-light">
      <ParallaxDots />
      <div className="magazine-content relative z-10 flex flex-col justify-between min-h-screen py-10">
        {/* Top bar */}
        <div className="magazine-masthead-bar">
          <span className="text-dot-text">{edition}</span>
          <div className="magazine-masthead-divider" />
          <span className="magazine-masthead-meta">{meta}</span>
        </div>

        {/* Center content */}
        <div className="text-center">
          {center}
          <h1 className="text-5xl font-extrabold text-dot-text tracking-tight leading-tight">
            {headline}
          </h1>
          {subhead && (
            <p className="mt-2 text-sm text-dot-sub">{subhead}</p>
          )}
        </div>

        {/* Bottom content (indicator strip, etc.) */}
        {bottom && <div>{bottom}</div>}

        {/* Scroll hint */}
        {!bottom && <div />}
      </div>
    </section>
  );
}
