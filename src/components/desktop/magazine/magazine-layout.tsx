'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';
import AnimatedLogo from '@/components/motion/brand/AnimatedLogo';
import { SITE_NAME } from '@/lib/site';

interface MagazineLayoutProps {
  children: ReactNode;
}

export default function MagazineLayout({ children }: MagazineLayoutProps) {
  return (
    <div className="magazine-shell">
      {/* Minimal top bar — logo only */}
      <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="magazine-content py-4">
          <Link
            href="/desktop"
            className="inline-flex items-center gap-2 pointer-events-auto opacity-60 hover:opacity-100 transition-opacity"
          >
            <AnimatedLogo size={20} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-dot-text">
              {SITE_NAME}
            </span>
          </Link>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
