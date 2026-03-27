import { type ReactNode } from 'react';

interface DarkSectionProps {
  id?: string;
  children: ReactNode;
  className?: string;
}

export function DarkSection({ id, children, className = '' }: DarkSectionProps) {
  return (
    <section
      id={id}
      className={`magazine-full-bleed magazine-section-dark py-16 ${className}`}
    >
      <div className="magazine-content">{children}</div>
    </section>
  );
}
