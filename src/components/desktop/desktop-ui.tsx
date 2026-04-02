import Link from 'next/link';
import type { ReactNode } from 'react';

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function desktopToneClass(tone?: 'heat' | 'cool') {
  switch (tone) {
    case 'heat':
      return 'text-dot-red';
    case 'cool':
      return 'text-dot-blue';
    default:
      return 'text-dot-text';
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
}: {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  action?: ReactNode;
}) {
  return (
    <DesktopSurface className="py-6">
      <div className="space-y-3">
        <p className="desktop-kicker">{eyebrow}</p>
        <h1 className="text-[20px] font-bold leading-[1.3] text-dot-text">
          {title}
        </h1>
        <div className="max-w-3xl text-[14px] leading-[1.6] text-dot-sub">
          {description}
        </div>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
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
    <div className="flex items-start justify-between gap-6">
      <div className="space-y-2">
        <p className="desktop-kicker">{eyebrow}</p>
        <h2 className="text-[20px] font-bold text-dot-text">{title}</h2>
        {description ? (
          <div className="max-w-3xl text-[11px] leading-[1.5] text-dot-sub">
            {description}
          </div>
        ) : null}
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
  tone?: 'heat' | 'cool';
}) {
  return (
    <div className="border-t border-dot-border py-3">
      <p className="desktop-kicker">{label}</p>
      <div className={cx('mt-2 text-[13px] font-bold', desktopToneClass(tone))}>
        {value}
      </div>
      {detail ? <div className="mt-1 text-[11px] leading-[1.5] text-dot-sub">{detail}</div> : null}
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
    <div className="border-t border-dot-border py-4">
      <p className="desktop-kicker">{label}</p>
      <h3 className="mt-2 text-[14px] font-bold text-dot-text">{title}</h3>
      <div className="mt-1 text-[14px] leading-[1.6] text-dot-sub">{body}</div>
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
    <Link href={href} className="desktop-surface block py-4">
      <div className="space-y-2">
        <p className="desktop-kicker">{eyebrow}</p>
        <h3 className="text-[14px] font-bold text-dot-text">{title}</h3>
        <p className="text-[14px] leading-[1.6] text-dot-sub">{body}</p>
        <span className="inline-flex items-center gap-2 text-[11px] text-dot-text">
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
        <li key={index} className="flex items-start gap-3 text-[14px] leading-[1.6] text-dot-sub">
          <span className="mt-0.5 w-6 shrink-0 text-[11px] text-dot-muted">
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
    <DesktopSurface className="py-8">
      <div className="mx-auto max-w-2xl space-y-2">
        <h2 className="text-[20px] font-bold text-dot-text">{title}</h2>
        <div className="text-[14px] leading-[1.6] text-dot-sub">{body}</div>
      </div>
    </DesktopSurface>
  );
}
