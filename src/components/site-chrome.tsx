'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AnimatedLogo from '@/components/motion/brand/AnimatedLogo';
import DataProvider from '@/components/data-provider';
import EventTracker from '@/components/event-tracker';
import { SITE_NAME } from '@/lib/site';

const PUBLIC_NAV_ITEMS = [
  { href: '/realtime', label: '실시간' },
  { href: '/onchain', label: '온체인' },
  { href: '/indicators', label: '히스토리' },
  { href: '/tools', label: '도구' },
  { href: '/alert', label: '알림' },
] as const;

const ADMIN_NAV_ITEMS = [
  { href: '/admin', label: '이벤트' },
] as const;

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  active,
  variant = 'public',
}: {
  href: string;
  label: string;
  active: boolean;
  variant?: 'public' | 'admin';
}) {
  const baseClassName =
    variant === 'admin'
      ? 'px-2.5 py-1.5 border text-xs sm:text-sm font-medium tracking-wide transition'
      : 'transition font-medium tracking-wide text-xs sm:text-sm';

  const activeClassName =
    variant === 'admin'
      ? 'border-amber-700/70 bg-amber-50 text-amber-950'
      : 'text-dot-accent';

  const idleClassName =
    variant === 'admin'
      ? 'border-stone-300/70 text-stone-600 hover:border-amber-700/50 hover:text-amber-900'
      : 'text-dot-sub hover:text-dot-accent';

  return (
    <Link href={href} className={`${baseClassName} ${active ? activeClassName : idleClassName}`}>
      {label}
    </Link>
  );
}

function PublicChrome({ children, pathname }: { children: React.ReactNode; pathname: string }) {
  return (
    <>
      <header className="dot-border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <nav className="max-w-3xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-dot-accent tracking-tight">
            <span className="inline-flex items-center gap-2">
              <AnimatedLogo size={24} className="opacity-80" />
              {SITE_NAME}
            </span>
          </Link>
          <div className="flex flex-wrap justify-end gap-3 sm:gap-5">
            {PUBLIC_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                active={isActivePath(pathname, item.href)}
              />
            ))}
          </div>
        </nav>
      </header>
      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 relative z-10">
        <EventTracker />
        <DataProvider>{children}</DataProvider>
      </main>
      <footer className="dot-border-t mt-12 relative z-10 dot-grid-sparse">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-dot-sub">
            <Link href="/about" className="hover:text-dot-accent transition">서비스 소개</Link>
            <Link href="/contact" className="hover:text-dot-accent transition">문의</Link>
            <Link href="/privacy" className="hover:text-dot-accent transition">개인정보처리방침</Link>
            <Link href="/disclaimer" className="hover:text-dot-accent transition">면책 및 이용안내</Link>
          </div>
          <p className="text-[10px] text-dot-muted/60">
            본 사이트의 정보는 투자 자문이 아니며, 모든 투자 판단과 책임은 사용자에게 있습니다.
          </p>
        </div>
      </footer>
    </>
  );
}

function AdminChrome({ children, pathname }: { children: React.ReactNode; pathname: string }) {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-stone-900/80 bg-stone-950/92 text-stone-100 backdrop-blur-sm">
        <nav className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide">
              <AnimatedLogo size={22} className="opacity-85" />
              <span>{SITE_NAME}</span>
            </Link>
            <span className="hidden sm:inline text-[11px] uppercase tracking-[0.22em] text-stone-400">
              Admin Console
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {ADMIN_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                active={isActivePath(pathname, item.href)}
                variant="admin"
              />
            ))}
            <Link
              href="/"
              className="px-2.5 py-1.5 border border-stone-700 text-stone-300 hover:border-stone-500 hover:text-white transition text-xs sm:text-sm font-medium tracking-wide"
            >
              사이트 홈
            </Link>
          </div>
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 relative z-10">
        {children}
      </main>
      <footer className="mt-10 border-t border-stone-900/20 relative z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-2 text-[11px] text-stone-500 sm:flex-row sm:items-center sm:justify-between">
          <p>관리자 전용 화면입니다. 일반 사용자 메뉴와 분리되어 표시됩니다.</p>
          <Link href="/" className="hover:text-stone-800 transition">
            공개 사이트로 이동
          </Link>
        </div>
      </footer>
    </>
  );
}

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/';
  const isAdminRoute = pathname.startsWith('/admin');

  if (isAdminRoute) {
    return <AdminChrome pathname={pathname}>{children}</AdminChrome>;
  }

  return <PublicChrome pathname={pathname}>{children}</PublicChrome>;
}
