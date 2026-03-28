import { type ReactNode } from 'react';

interface MastheadProps {
  edition: string;
  meta: string;
  headline: ReactNode;
  subhead?: ReactNode;
  bottom?: ReactNode;
}

export function Masthead({
  edition,
  meta,
  headline,
  subhead,
  bottom,
}: MastheadProps) {
  return (
    <section id="masthead" className="magazine-masthead magazine-section-light border-b border-dot-border">
      <div className="magazine-content py-16">
        <div className="magazine-masthead-bar">
          <span className="text-dot-text">{edition}</span>
          <span className="text-[11px] text-dot-sub">{meta}</span>
        </div>

        <div className="mt-8 max-w-3xl space-y-3">
          <h1 className="text-[20px] font-bold leading-[1.3] text-dot-text">
            {headline}
          </h1>
          {subhead && (
            <p className="max-w-2xl text-[14px] leading-[1.6] text-dot-sub">{subhead}</p>
          )}
        </div>

        {bottom && <div className="mt-8">{bottom}</div>}
      </div>
    </section>
  );
}
