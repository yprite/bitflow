import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { RangeLineChart } from '@/components/charts/range-line-chart';
import { getIndicatorBySlug, getIndicatorSlugs, type IndicatorSlug } from '@/lib/indicator-content';
import { loadIndicatorPageData } from '@/lib/indicator-data';
import { getSiteUrl } from '@/lib/site-url';

export const revalidate = 3600;

const FRESHNESS_STYLE = {
  fresh: 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/40',
  delayed: 'bg-amber-500/20 text-amber-400 ring-amber-500/40',
  stale: 'bg-rose-500/20 text-rose-400 ring-rose-500/40',
  unknown: 'bg-slate-600/30 text-slate-300 ring-slate-500/30',
} as const;

const FRESHNESS_LABEL = {
  fresh: '정상',
  delayed: '지연',
  stale: '오래됨',
  unknown: '미확인',
} as const;

function formatKst(timestamp: string | null): string {
  if (!timestamp) return '데이터 없음';
  return `${new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(timestamp))} KST`;
}

function formatLatest(value: number | null, unit: string): string {
  if (value === null) return '데이터 없음';
  if (unit === 'index') return Math.round(value).toLocaleString();
  if (unit === 'BTC') return `${Math.round(value).toLocaleString()} BTC`;
  if (unit === 'sat/vB') return `${Math.round(value).toLocaleString()} sat/vB`;
  return `${value.toFixed(2)}${unit === '%' ? '%' : ''}`;
}

async function getPageSnapshot(slug: IndicatorSlug) {
  try {
    return await loadIndicatorPageData(slug);
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  return getIndicatorSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const config = getIndicatorBySlug(params.slug);
  if (!config) {
    return {
      title: 'Not Found | Bitflow',
      description: '요청한 지표 페이지를 찾을 수 없습니다.',
    };
  }

  const data = await getPageSnapshot(config.slug);
  const latest = data ? formatLatest(data.latestValue, config.unit) : null;
  const description = latest
    ? `${config.description} 최신 값: ${latest}.`
    : `${config.description} 최신 데이터는 수집 상태에 따라 지연될 수 있습니다.`;
  const url = `${getSiteUrl()}/${config.slug}`;

  return {
    title: `${config.title} | Bitflow`,
    description,
    alternates: { canonical: `/${config.slug}` },
    openGraph: {
      title: `${config.title} | Bitflow`,
      description,
      url,
      siteName: 'Bitflow',
      type: 'website',
      locale: 'ko_KR',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${config.title} | Bitflow`,
      description,
    },
  };
}

export default async function IndicatorDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const config = getIndicatorBySlug(params.slug);
  if (!config) notFound();

  const data = await loadIndicatorPageData(config.slug);
  const siteUrl = getSiteUrl();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${config.title} - Bitflow`,
    description: config.description,
    url: `${siteUrl}/${config.slug}`,
    inLanguage: 'ko-KR',
    creator: {
      '@type': 'Organization',
      name: 'Bitflow',
    },
    keywords: ['bitcoin', 'onchain', config.title, config.slug],
    isAccessibleForFree: true,
    variableMeasured: config.title,
  };

  return (
    <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-400/80">Indicator Detail</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">{config.title}</h1>
            <p className="mt-2 text-sm text-slate-400">{config.subtitle}</p>
          </div>
          <span className={`inline-flex rounded-full px-3 py-1.5 text-sm font-medium ring-1 ${FRESHNESS_STYLE[data.freshness]}`}>
            데이터 {FRESHNESS_LABEL[data.freshness]}
          </span>
        </div>
        <p className="mt-5 text-3xl font-bold tracking-tight text-white">{formatLatest(data.latestValue, config.unit)}</p>
        <p className="mt-1 text-xs text-slate-500">마지막 업데이트: {formatKst(data.latestAt)}</p>
      </header>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="mb-4 text-lg font-semibold text-white">실시간 차트 (30일/90일/1년)</h2>
        <RangeLineChart points={data.points} tone={config.tone} />
      </section>

      {data.errors.length > 0 ? (
        <section className="rounded-2xl border border-amber-500/30 bg-amber-950/50 p-4 text-sm text-amber-200">
          데이터 소스 연결 상태에 따라 일부 값이 비어 있을 수 있습니다.
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold text-white">지표 설명</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">{config.description}</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">현재 해석: {data.interpretation}</p>
          <p className="mt-3 text-xs text-slate-500">데이터 출처: {config.source}</p>
        </article>

        <aside className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-lg font-semibold text-white">관련 지표</h2>
          <ul className="mt-3 space-y-2">
            {data.related.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/${item.slug}`}
                  className="block rounded-lg border border-[var(--border)] bg-[var(--card-elevated)] px-3 py-2 text-sm text-slate-300 transition hover:border-[var(--border-light)] hover:text-white"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/"
            className="mt-4 inline-flex rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-slate-300 transition hover:border-[var(--border-light)] hover:text-white"
          >
            ← 대시보드로 돌아가기
          </Link>
        </aside>
      </section>
    </main>
  );
}
