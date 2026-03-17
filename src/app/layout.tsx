import type { Metadata } from 'next';
import AmbientBackground from '@/components/motion/ambient/AmbientBackground';
import SiteChrome from '@/components/site-chrome';
import { SITE_ALTERNATE_NAME, SITE_NAME, getBaseUrl } from '@/lib/site';
import './globals.css';

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: `${SITE_NAME} | 실시간 김치프리미엄 · 펀딩비 · 공포탐욕지수`,
    template: `%s | ${SITE_NAME}`,
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
    SITE_NAME,
    SITE_ALTERNATE_NAME,
  ],
  authors: [{ name: SITE_ALTERNATE_NAME }],
  creator: SITE_ALTERNATE_NAME,
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: baseUrl,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | 실시간 김치프리미엄 · 펀딩비 · 공포탐욕지수`,
    description:
      '실시간 김치프리미엄, 펀딩비, 공포탐욕지수를 한눈에. 50개 이상 코인 프리미엄 히트맵, 복합 시그널, 텔레그램 알림까지.',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} | 실시간 김치프리미엄 · 펀딩비 · 공포탐욕지수`,
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
    name: SITE_NAME,
    alternateName: SITE_ALTERNATE_NAME,
    description:
      '실시간 김치프리미엄, 펀딩비, 공포탐욕지수를 한눈에. 50개 이상 코인 프리미엄 히트맵, 복합 시그널, 텔레그램 알림까지.',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    url: baseUrl,
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
        <meta name="apple-mobile-web-app-title" content={SITE_NAME} />
        <meta name="naver-site-verification" content="" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-dot-bg env-safe dot-vignette">
        <AmbientBackground />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
