import Link from 'next/link';
import Dashboard from '@/components/dashboard';
import PageHeader from '@/components/page-header';
import {
  SITE_ALTERNATE_NAME,
  SITE_CONTACT_EMAIL,
  SITE_NAME,
  SITE_REPO_URL,
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
      <PageHeader
        variant="card"
        eyebrow="Bitcoin Weather Station"
        title={SITE_NAME}
        description={(
          <>
            비트코인 기상청(BitFlow)은 한국 투자자가 실제로 체감하는 국내 프리미엄,
            파생 포지셔닝, 온체인 흐름을 한 화면에서 읽기 쉽게 정리한 비트코인 데이터 사이트입니다.
          </>
        )}
        action={(
          <Link
            href="/about"
            className="inline-flex rounded-sm border border-dot-border/60 bg-white/75 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.16em] text-dot-sub transition hover:border-dot-accent/50 hover:text-dot-accent"
          >
            서비스 소개
          </Link>
        )}
      />

      <section className="dot-card p-5 sm:p-6 space-y-4">
        <div className="space-y-1">
          <h2 className="text-xs font-semibold text-dot-accent uppercase tracking-wider">
            비트코인 기상청에서 바로 할 수 있는 것
          </h2>
          <p className="text-xs leading-relaxed text-dot-sub">
            실시간 데이터 확인에 그치지 않고, 해석 가능한 신호와 주간 정리 콘텐츠까지 함께 제공합니다.
            브랜드 검색어인 비트코인 기상청으로 유입된 사용자가 사이트 목적을 즉시 이해할 수 있도록 핵심 화면을 아래에 묶었습니다.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {overviewCards.map((card) => (
            <article key={card.title} className="border border-dot-border/60 p-4 dot-grid-sparse">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-dot-sub">{card.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-dot-sub">{card.body}</p>
              <Link
                href={card.href}
                className="mt-3 inline-flex text-[11px] font-medium text-dot-accent hover:underline"
              >
                {card.label}
              </Link>
            </article>
          ))}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-dot-sub">
          <Link href="/weekly" className="hover:text-dot-accent transition">주간 리포트</Link>
          <Link href="/privacy" className="hover:text-dot-accent transition">개인정보처리방침</Link>
          <Link href="/contact" className="hover:text-dot-accent transition">문의</Link>
          <Link href="/disclaimer" className="hover:text-dot-accent transition">면책 및 이용안내</Link>
        </div>
        <p className="text-[11px] leading-relaxed text-dot-sub">
          공식 사이트:
          {' '}
          <a href={baseUrl} className="text-dot-accent hover:underline">
            {SITE_NAME}
          </a>
          {' · '}
          공개 저장소:
          {' '}
          <a href={SITE_REPO_URL} target="_blank" rel="noreferrer" className="text-dot-accent hover:underline">
            GitHub
          </a>
          {SITE_CONTACT_EMAIL ? (
            <>
              {' · '}
              문의:
              {' '}
              <a href={`mailto:${SITE_CONTACT_EMAIL}`} className="text-dot-accent hover:underline">
                {SITE_CONTACT_EMAIL}
              </a>
            </>
          ) : null}
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-dot-accent">실시간 대시보드</h2>
            <p className="mt-1 text-xs leading-relaxed text-dot-sub">
              아래 대시보드는 클라이언트에서 최신 데이터를 불러와 지속적으로 갱신합니다.
            </p>
          </div>
          <Link href="/realtime" className="text-[11px] font-medium text-dot-accent hover:underline">
            전체 지표 화면
          </Link>
        </div>
        <Dashboard />
      </section>
    </div>
  );
}
