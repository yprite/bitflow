import { type ReactNode } from 'react';

interface LightSectionProps {
  id?: string;
  children: ReactNode;
  className?: string;
}

export function LightSection({ id, children, className = '' }: LightSectionProps) {
  return (
    <section
      id={id}
      className={`magazine-full-bleed magazine-section-light py-16 ${className}`}
    >
      <div className="magazine-content">{children}</div>
    </section>
  );
}
