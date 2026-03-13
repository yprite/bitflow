import type { Metadata } from 'next';
import AmbientBackground from '@/components/motion/ambient/AmbientBackground';
import './globals.css';

export const metadata: Metadata = {
  title: '김치프리미엄 트래커',
  description: '실시간 김치프리미엄, 펀딩비, 공포탐욕지수를 한눈에',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="min-h-screen bg-dot-bg env-safe">
        <AmbientBackground />
        <header className="dot-border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <nav className="max-w-3xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
            <a href="/" className="text-lg font-bold text-dot-accent tracking-tight">
              <span className="inline-flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="opacity-80">
                  <circle cx="6" cy="6" r="2.5" fill="#1a1a1a"/>
                  <circle cx="14" cy="6" r="3.5" fill="#1a1a1a"/>
                  <circle cx="22" cy="6" r="2" fill="#1a1a1a"/>
                  <circle cx="6" cy="14" r="3" fill="#1a1a1a"/>
                  <circle cx="14" cy="14" r="4" fill="#1a1a1a"/>
                  <circle cx="6" cy="22" r="1.5" fill="#1a1a1a"/>
                </svg>
                김프 트래커
              </span>
            </a>
            <div className="flex gap-4 sm:gap-6 text-sm">
              <a href="/" className="text-dot-sub hover:text-dot-accent transition font-medium">
                대시보드
              </a>
              <a href="/alert" className="text-dot-sub hover:text-dot-accent transition font-medium">
                알림 설정
              </a>
            </div>
          </nav>
        </header>
        <main className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 relative z-10">
          {children}
        </main>
        <footer className="dot-border-t mt-12 relative z-10">
          <div className="max-w-3xl mx-auto px-4 py-6 text-center text-xs text-dot-muted">
            실시간 데이터는 업비트, 글로벌 시세 API, alternative.me에서 제공됩니다.
          </div>
        </footer>
      </body>
    </html>
  );
}
