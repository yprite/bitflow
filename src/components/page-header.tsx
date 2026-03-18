import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  eyebrow?: string;
  description?: ReactNode;
  action?: ReactNode;
  variant?: 'compact' | 'card';
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-mono tracking-[0.24em] text-dot-muted">
      {children}
    </p>
  );
}

export default function PageHeader({
  title,
  eyebrow,
  description,
  action,
  variant = 'compact',
}: PageHeaderProps) {
  const headerEyebrow = eyebrow ?? title;

  if (variant === 'card') {
    return (
      <section className="dot-card p-5 sm:p-6 space-y-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Eyebrow>{headerEyebrow}</Eyebrow>
            <h1 className="text-sm sm:text-base font-semibold text-dot-accent tracking-tight">{title}</h1>
            {description ? (
              <div className="text-sm text-dot-sub leading-relaxed">
                {description}
              </div>
            ) : null}
          </div>
          {action ? <div className="sm:self-end sm:shrink-0">{action}</div> : null}
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="space-y-1">
          <Eyebrow>{headerEyebrow}</Eyebrow>
          <h1 className="text-sm font-semibold text-dot-sub uppercase tracking-wider">{title}</h1>
          {description ? (
            <div className="text-xs text-dot-sub leading-relaxed">
              {description}
            </div>
          ) : null}
        </div>
      </div>
      {action ? <div className="sm:shrink-0">{action}</div> : null}
    </div>
  );
}
