import { type ReactNode } from 'react';

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
    <section id="masthead" className="magazine-masthead magazine-section-light border-b border-dot-border/20">
      <div className="magazine-content relative z-10 flex min-h-[72vh] flex-col justify-between py-24">
        <div className="magazine-masthead-bar">
          <span className="text-dot-text">{edition}</span>
          <div className="magazine-masthead-divider" />
          <span className="magazine-masthead-meta">{meta}</span>
        </div>

        <div className="max-w-3xl space-y-4">
          {center}
          <h1 className="text-[42px] font-semibold leading-[1.05] tracking-[-0.04em] text-dot-text">
            {headline}
          </h1>
          {subhead && (
            <p className="max-w-2xl text-[14px] leading-7 text-dot-sub">{subhead}</p>
          )}
        </div>

        {bottom && <div>{bottom}</div>}
        {!bottom && <div />}
      </div>
    </section>
  );
}
