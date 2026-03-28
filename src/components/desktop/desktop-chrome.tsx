'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AnimatedLogo from '@/components/motion/brand/AnimatedLogo';
import { SITE_NAME } from '@/lib/site';

const DESKTOP_NAV_ITEMS = [
  { href: '/desktop', label: '개요' },
  { href: '/desktop/onchain', label: '온체인' },
  { href: '/desktop/indicators', label: '히스토리' },
  { href: '/desktop/tools', label: '도구' },
  { href: '/desktop/weekly', label: '주간 리포트' },
  { href: '/desktop/about', label: '소개' },
] as const;

function isActive(pathname: string, href: string) {
  if (pathname === href) return true;
  return href !== '/desktop' && pathname.startsWith(`${href}/`);
}

export default function DesktopChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/desktop';

  return (
    <div className="magazine-content pt-20 pb-16">
      <header className="mb-8 flex items-center justify-between gap-6 border-b border-dot-border/35 pb-4">
        <Link href="/desktop" className="inline-flex items-center gap-3 text-dot-accent">
          <AnimatedLogo size={24} className="opacity-85" />
          <div className="space-y-1">
            <p className="desktop-kicker">Desktop Edition</p>
            <p className="text-[16px] font-semibold tracking-[-0.02em]">{SITE_NAME}</p>
          </div>
        </Link>

        <nav className="flex items-center gap-4">
          {DESKTOP_NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[11px] uppercase tracking-[0.14em] ${active ? 'text-dot-accent' : 'text-dot-muted hover:text-dot-accent'}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="flex min-w-0 flex-col gap-6">
        {children}
      </main>
    </div>
  );
}
