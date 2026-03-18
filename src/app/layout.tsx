import type { Metadata } from 'next';
import AmbientBackground from '@/components/motion/ambient/AmbientBackground';
import SiteChrome from '@/components/site-chrome';
import {
  SITE_CONTACT_EMAIL,
  SITE_ALTERNATE_NAME,
  SITE_NAME,
  SITE_NAVER_SITE_VERIFICATION,
  SITE_REPO_URL,
  getBaseUrl,
} from '@/lib/site';
import './globals.css';

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  applicationName: SITE_NAME,
  title: {
    default: `${SITE_NAME} | 실시간 김치프리미엄 · 펀딩비 · 공포탐욕지수`,
    template: `%s | ${SITE_NAME}`,
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: [{ url: '/favicon-32.png', type: 'image/png' }],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  description:
    '비트코인 기상청은 실시간 김치프리미엄, 펀딩비, 공포탐욕지수를 한눈에 보여주는 비트코인 데이터 사이트입니다.',
  keywords: [
    SITE_NAME,
    `${SITE_NAME} ${SITE_ALTERNATE_NAME}`,
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
    SITE_ALTERNATE_NAME,
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: baseUrl,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | 실시간 김치프리미엄 · 펀딩비 · 공포탐욕지수`,
    description:
      '비트코인 기상청은 실시간 김치프리미엄, 펀딩비, 공포탐욕지수를 한눈에 보여주는 비트코인 데이터 사이트입니다.',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} | 실시간 김치프리미엄 · 펀딩비 · 공포탐욕지수`,
    description:
      '비트코인 기상청은 실시간 김치프리미엄, 펀딩비, 공포탐욕지수를 한눈에 보여주는 비트코인 데이터 사이트입니다.',
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
    canonical: '/',
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
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: SITE_NAME,
    alternateName: SITE_ALTERNATE_NAME,
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/icon-512.png`,
    },
    sameAs: [SITE_REPO_URL],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        url: `${baseUrl}/contact`,
        ...(SITE_CONTACT_EMAIL ? { email: SITE_CONTACT_EMAIL } : {}),
      },
    ],
  };

  const webApplicationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': `${baseUrl}/#webapp`,
    name: SITE_NAME,
    alternateName: SITE_ALTERNATE_NAME,
    description:
      '비트코인 기상청은 실시간 김치프리미엄, 펀딩비, 공포탐욕지수를 한눈에 보여주는 비트코인 데이터 사이트입니다.',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    url: baseUrl,
    publisher: {
      '@id': `${baseUrl}/#organization`,
    },
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
        {SITE_NAVER_SITE_VERIFICATION ? (
          <meta name="naver-site-verification" content={SITE_NAVER_SITE_VERIFICATION} />
        ) : null}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationJsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-dot-bg env-safe dot-vignette">
        <AmbientBackground />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
