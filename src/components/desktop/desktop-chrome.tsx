'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AnimatedLogo from '@/components/motion/brand/AnimatedLogo';
import { SITE_NAME } from '@/lib/site';

const DESKTOP_NAV_ITEMS = [
  { href: '/desktop', label: '개요' },
  { href: '/desktop/realtime', label: '실시간 지표' },
  { href: '/desktop/onchain', label: '온체인' },
  { href: '/desktop/indicators', label: '히스토리' },
  { href: '/desktop/tools', label: '도구' },
  { href: '/desktop/weekly', label: '주간 리포트' },
  { href: '/desktop/alert', label: '알림' },
  { href: '/desktop/about', label: '소개' },
] as const;

function isActive(pathname: string, href: string) {
  if (pathname === href) return true;
  return href !== '/desktop' && pathname.startsWith(`${href}/`);
}

export default function DesktopChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/desktop';

  return (
    <div className="desktop-shell">
      <div className="desktop-frame">
        <aside className="desktop-rail">
          <section className="desktop-surface p-5">
            <div className="space-y-4">
              <Link href="/desktop" className="inline-flex items-center gap-3 text-dot-accent">
                <AnimatedLogo size={28} className="opacity-85" />
                <div className="space-y-1">
                  <p className="desktop-kicker">Desktop Edition</p>
                  <p className="text-[18px] font-semibold tracking-[-0.02em]">{SITE_NAME}</p>
                </div>
              </Link>
              <p className="desktop-microcopy">
                모바일 페이지와 별도로 구성한 PC 전용 뷰입니다. 고정 폭 레이아웃으로 정보 밀도와 탐색 속도를 올렸습니다.
              </p>
            </div>
          </section>

          <section className="desktop-surface p-4">
            <div className="space-y-2">
              <p className="desktop-kicker">Navigation</p>
              <nav className="space-y-2">
                {DESKTOP_NAV_ITEMS.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`desktop-nav-link ${active ? 'desktop-nav-link-active' : ''}`}
                    >
                      <span className="text-[13px] font-medium">{item.label}</span>
                      <span className="font-mono text-[10px] opacity-70">
                        {active ? 'OPEN' : 'GO'}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </section>

          <section className="desktop-surface p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="desktop-kicker">Switch</p>
                <div className="space-y-2 text-[12px] leading-6 text-dot-sub">
                  <p>현재 공개 중인 모바일 페이지는 그대로 유지됩니다.</p>
                  <Link href="/" className="inline-flex items-center gap-2 text-dot-accent hover:underline">
                    모바일/기존 페이지 열기
                    <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              </div>
              <div className="desktop-divider pt-4 text-[11px] leading-6 text-dot-muted">
                PC 전용 라우트는 `/desktop` 아래에 분리되어 있습니다.
              </div>
            </div>
          </section>
        </aside>

        <main className="flex min-w-0 flex-col gap-6">
          {children}
        </main>
      </div>
    </div>
  );
}
