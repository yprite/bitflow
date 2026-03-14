import type { Metadata } from 'next';
import AmbientBackground from '@/components/motion/ambient/AmbientBackground';
import AnimatedLogo from '@/components/motion/brand/AnimatedLogo';
import DataProvider from '@/components/data-provider';
import EventTracker from '@/components/event-tracker';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '비트코인 기상청 | 실시간 김치프리미엄 · 펀딩비 · 공포탐욕지수',
    template: '%s | 비트코인 기상청',
  },
  description:
    '실시간 김치프리미엄, 펀딩비, 공포탐욕지수를 한눈에. 50개 이상 코인 프리미엄 히트맵, 복합 시그널, 텔레그램 알림까지.',
  keywords: [
    '김치프리미엄',
    '김프',
    '비트코인',
    '펀딩비',
    '공포탐욕지수',
    'kimchi premium',
    '암호화폐',
    '가상화폐',
    '비트코인 프리미엄',
    '업비트',
    '코인 시세',
    '실시간 김프',
    '역프',
    '비트코인 기상청',
    'BitFlow',
  ],
  authors: [{ name: 'BitFlow' }],
  creator: 'BitFlow',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: '비트코인 기상청',
    title: '비트코인 기상청 | 실시간 김치프리미엄 · 펀딩비 · 공포탐욕지수',
    description:
      '실시간 김치프리미엄, 펀딩비, 공포탐욕지수를 한눈에. 50개 이상 코인 프리미엄 히트맵, 복합 시그널, 텔레그램 알림까지.',
  },
  twitter: {
    card: 'summary_large_image',
    title: '비트코인 기상청 | 실시간 김치프리미엄 · 펀딩비 · 공포탐욕지수',
    description:
      '실시간 김치프리미엄, 펀딩비, 공포탐욕지수를 한눈에. 50개 이상 코인 프리미엄 히트맵, 복합 시그널, 텔레그램 알림까지.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    types: {
      'application/llms+txt': '/llms.txt',
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '비트코인 기상청',
    alternateName: 'BitFlow',
    description:
      '실시간 김치프리미엄, 펀딩비, 공포탐욕지수를 한눈에. 50개 이상 코인 프리미엄 히트맵, 복합 시그널, 텔레그램 알림까지.',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KRW',
    },
    inLanguage: 'ko',
    keywords:
      '김치프리미엄, 김프, 비트코인, 펀딩비, 공포탐욕지수, kimchi premium, 암호화폐, 실시간 김프',
  };

  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f5f5f0" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="비트코인 기상청" />
        <meta name="naver-site-verification" content="" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-dot-bg env-safe dot-vignette">
        <AmbientBackground />
        <header className="dot-border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <nav className="max-w-3xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
            <a href="/" className="text-lg font-bold text-dot-accent tracking-tight">
              <span className="inline-flex items-center gap-2">
                <AnimatedLogo size={24} className="opacity-80" />
                비트코인 기상청
              </span>
            </a>
            <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm">
              <a href="/" className="text-dot-sub hover:text-dot-accent transition font-medium tracking-wide">
                홈
              </a>
              <a href="/indicators" className="text-dot-sub hover:text-dot-accent transition font-medium tracking-wide">
                히스토리
              </a>
              <a href="/tools" className="text-dot-sub hover:text-dot-accent transition font-medium tracking-wide">
                도구
              </a>
              <a href="/alert" className="text-dot-sub hover:text-dot-accent transition font-medium tracking-wide">
                알림
              </a>
            </div>
          </nav>
        </header>
        <main className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 relative z-10">
          <EventTracker />
          <DataProvider>
            {children}
          </DataProvider>
        </main>
        <footer className="dot-border-t mt-12 relative z-10 dot-grid-sparse">
          <div className="max-w-3xl mx-auto px-4 py-8 text-center space-y-2">
            <p className="text-[11px] text-dot-muted font-mono tracking-wide">
              비트코인 기상청 — 데이터 기반 시장 인사이트
            </p>
            <p className="text-[10px] text-dot-muted/60">
              실시간 데이터는 업비트, 글로벌 시세 API, alternative.me에서 제공됩니다.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
