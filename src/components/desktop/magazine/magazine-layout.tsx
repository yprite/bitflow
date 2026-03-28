'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import AnimatedLogo from '@/components/motion/brand/AnimatedLogo';
import { SITE_NAME } from '@/lib/site';

interface MagazineLayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { href: '/desktop', label: '개요' },
  { href: '/desktop/onchain', label: '온체인' },
  { href: '/desktop/weekly', label: '주간 리포트' },
  { href: '/desktop/tools', label: '도구' },
] as const;

function cx(...values: Array<string | false>) {
  return values.filter(Boolean).join(' ');
}

function isActive(pathname: string, href: string) {
  if (pathname === href) return true;
  return href !== '/desktop' && pathname.startsWith(`${href}/`);
}

function getContext(pathname: string) {
  if (pathname.startsWith('/desktop/onchain')) {
    return { eyebrow: 'On-chain', title: '깊이 분석' };
  }
  if (pathname.startsWith('/desktop/weekly')) {
    return { eyebrow: 'Weekly', title: '주간 아카이브' };
  }
  if (pathname.startsWith('/desktop/tools')) {
    return { eyebrow: 'Utility', title: '실행 도구' };
  }
  if (pathname.startsWith('/desktop/contact')) {
    return { eyebrow: 'Contact', title: '문의 및 제보' };
  }
  if (pathname.startsWith('/desktop/privacy')) {
    return { eyebrow: 'Policy', title: '개인정보 처리방침' };
  }
  if (pathname.startsWith('/desktop/disclaimer')) {
    return { eyebrow: 'Policy', title: '면책 및 안내' };
  }
  if (pathname.startsWith('/desktop/about')) {
    return { eyebrow: 'About', title: '제품 소개' };
  }

  return { eyebrow: 'Today', title: '오늘의 종합 브리핑' };
}

export default function MagazineLayout({ children }: MagazineLayoutProps) {
  const pathname = usePathname() ?? '/desktop';
  const context = getContext(pathname);

  return (
    <div className="magazine-shell">
      <header className="magazine-topbar">
        <div className="magazine-content">
          <div className="magazine-topbar-inner">
            <div className="magazine-topbar-brand-group">
              <Link href="/desktop" className="magazine-topbar-brand">
                <AnimatedLogo size={20} />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-dot-text">
                  {SITE_NAME}
                </span>
              </Link>
              <div className="magazine-topbar-context">
                <p className="desktop-kicker">{context.eyebrow}</p>
                <p className="magazine-topbar-title">{context.title}</p>
              </div>
            </div>

            <nav className="magazine-topbar-nav" aria-label="Desktop sections">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cx(
                    'magazine-topbar-link',
                    isActive(pathname, item.href) && 'magazine-topbar-link-active',
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
