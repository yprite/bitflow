import Dashboard from '@/components/dashboard';
import HomeIntroModal from '@/components/home-intro-modal';
import {
  SITE_ALTERNATE_NAME,
  SITE_CONTACT_EMAIL,
  SITE_NAME,
  getBaseUrl,
} from '@/lib/site';

const overviewCards = [
  {
    title: '실시간 시장 체온',
    body: '김치프리미엄, 펀딩비, 공포탐욕, 거래량 변화를 함께 묶어 지금 시장이 과열인지 경계 국면인지 빠르게 읽도록 구성했습니다.',
    href: '/realtime',
    label: '실시간 지표 보기',
  },
  {
    title: '온체인과 흐름 해석',
    body: '가격만 보지 않고 수수료 혼잡도, 고래 이동, 거래소 순유입, 활동 공급 비중까지 같이 확인할 수 있습니다.',
    href: '/onchain',
    label: '온체인 보기',
  },
  {
    title: '주간 리포트와 도구',
    body: '이번 주 핵심 리포트, BTC 전송 실무 도구, 차익 계산기까지 한국 사용자 기준으로 이어서 탐색할 수 있습니다.',
    href: '/weekly',
    label: '주간 리포트 보기',
  },
] as const;

export default function HomePage() {
  const baseUrl = getBaseUrl();
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    url: baseUrl,
    name: SITE_NAME,
    alternateName: SITE_ALTERNATE_NAME,
    description:
      '비트코인 기상청은 실시간 김치프리미엄, 펀딩비, 공포탐욕지수를 한눈에 보여주는 비트코인 데이터 사이트입니다.',
    inLanguage: 'ko-KR',
    publisher: {
      '@id': `${baseUrl}/#organization`,
    },
  };
  const homePageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${baseUrl}/#home`,
    url: baseUrl,
    name: `${SITE_NAME} | 실시간 김치프리미엄 · 펀딩비 · 공포탐욕지수`,
    isPartOf: {
      '@id': `${baseUrl}/#website`,
    },
    about: [
      {
        '@type': 'Thing',
        name: 'Bitcoin',
      },
      {
        '@type': 'Thing',
        name: '김치프리미엄',
      },
    ],
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homePageJsonLd) }}
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-dot-accent">실시간 대시보드</h2>
            <p className="mt-1 text-xs leading-relaxed text-dot-sub">
              아래 대시보드는 클라이언트에서 최신 데이터를 불러와 지속적으로 갱신합니다.
            </p>
          </div>
          <HomeIntroModal
            overviewCards={overviewCards}
            baseUrl={baseUrl}
            contactEmail={SITE_CONTACT_EMAIL}
          />
        </div>
        <Dashboard />
      </section>
    </div>
  );
}
