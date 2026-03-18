import Link from 'next/link';
import type { ReactNode } from 'react';

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function desktopToneClass(tone?: 'accent' | 'positive' | 'negative' | 'neutral') {
  switch (tone) {
    case 'positive':
      return 'text-dot-green';
    case 'negative':
      return 'text-dot-red';
    case 'neutral':
      return 'text-dot-sub';
    default:
      return 'text-dot-accent';
  }
}

export function DesktopSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cx('desktop-surface', className)}>{children}</section>;
}

export function DesktopHero({
  eyebrow,
  title,
  description,
  action,
  sidebar,
}: {
  eyebrow: string;
  title: string;
  description: ReactNode;
  action?: ReactNode;
  sidebar?: ReactNode;
}) {
  return (
    <DesktopSurface className={sidebar ? 'desktop-hero' : 'p-[26px_28px]'}>
      <div className="space-y-5">
        <div className="space-y-3">
          <p className="desktop-kicker">{eyebrow}</p>
          <div className="space-y-3">
            <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-dot-accent">
              {title}
            </h1>
            <div className="max-w-3xl text-[15px] leading-8 text-dot-sub">
              {description}
            </div>
          </div>
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      {sidebar ? (
        <div className="space-y-3 border-l border-dashed border-dot-border/70 pl-6">
          {sidebar}
        </div>
      ) : null}
    </DesktopSurface>
  );
}

export function DesktopSectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-6">
      <div className="space-y-2">
        <p className="desktop-kicker">{eyebrow}</p>
        <div className="space-y-1">
          <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-dot-accent">{title}</h2>
          {description ? (
            <div className="max-w-3xl text-[13px] leading-7 text-dot-sub">
              {description}
            </div>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function DesktopStatCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: 'accent' | 'positive' | 'negative' | 'neutral';
}) {
  return (
    <div className="border border-dot-border/55 bg-white/70 p-4">
      <p className="desktop-kicker">{label}</p>
      <div className={cx('mt-3 text-[22px] font-semibold tracking-[-0.03em]', desktopToneClass(tone))}>
        {value}
      </div>
      {detail ? <div className="mt-2 text-[12px] leading-6 text-dot-sub">{detail}</div> : null}
    </div>
  );
}

export function DesktopTextCard({
  label,
  title,
  body,
}: {
  label: string;
  title: string;
  body: ReactNode;
}) {
  return (
    <div className="border border-dot-border/55 bg-white/70 p-5">
      <div className="space-y-2">
        <p className="desktop-kicker">{label}</p>
        <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-dot-accent">{title}</h3>
        <div className="text-[13px] leading-7 text-dot-sub">{body}</div>
      </div>
    </div>
  );
}

export function DesktopLinkCard({
  eyebrow,
  title,
  body,
  href,
  label,
}: {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  label: string;
}) {
  return (
    <Link href={href} className="desktop-surface block p-5 transition-transform duration-200 hover:-translate-y-0.5">
      <div className="space-y-3">
        <p className="desktop-kicker">{eyebrow}</p>
        <div className="space-y-2">
          <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-dot-accent">{title}</h3>
          <p className="text-[13px] leading-7 text-dot-sub">{body}</p>
        </div>
        <span className="inline-flex items-center gap-2 text-[12px] font-medium text-dot-accent">
          {label}
          <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}

export function DesktopBulletList({
  items,
  numbered = false,
}: {
  items: ReactNode[];
  numbered?: boolean;
}) {
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-3 text-[13px] leading-7 text-dot-sub">
          <span className="mt-0.5 w-7 shrink-0 font-mono text-[11px] text-dot-muted">
            {numbered ? String(index + 1).padStart(2, '0') : '·'}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function DesktopEmptyState({
  title,
  body,
}: {
  title: string;
  body: ReactNode;
}) {
  return (
    <DesktopSurface className="p-12 text-center">
      <div className="mx-auto max-w-2xl space-y-3">
        <p className="desktop-kicker">No Data</p>
        <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-dot-accent">{title}</h2>
        <div className="text-[14px] leading-8 text-dot-sub">{body}</div>
      </div>
    </DesktopSurface>
  );
}
