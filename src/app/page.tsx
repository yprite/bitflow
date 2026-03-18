import Link from 'next/link';
import Dashboard from '@/components/dashboard';
import OverviewOverlay from '@/components/overview-overlay';
import PageHeader from '@/components/page-header';
import {
  SITE_ALTERNATE_NAME,
  SITE_CONTACT_EMAIL,
  SITE_NAME,
  SITE_REPO_URL,
  getBaseUrl,
} from '@/lib/site';

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

      <OverviewOverlay />

      <section className="dot-card p-5 sm:p-6">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-dot-sub">
          <Link href="/weekly" className="hover:text-dot-accent transition">주간 리포트</Link>
          <Link href="/privacy" className="hover:text-dot-accent transition">개인정보처리방침</Link>
          <Link href="/contact" className="hover:text-dot-accent transition">문의</Link>
          <Link href="/disclaimer" className="hover:text-dot-accent transition">면책 및 이용안내</Link>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-dot-sub">
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
