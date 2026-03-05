import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getGlossaryBySlug, getGlossarySlugs } from '@/lib/indicator-content';
import { getSiteUrl } from '@/lib/site-url';

export const revalidate = 86400;

export async function generateStaticParams() {
  return getGlossarySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const entry = getGlossaryBySlug(params.slug);
  if (!entry) {
    return {
      title: 'Not Found | Bitflow',
      description: '요청한 용어 페이지를 찾을 수 없습니다.',
    };
  }

  const description = `${entry.summary} ${entry.definition}`;
  return {
    title: `${entry.title} | Bitflow 용어집`,
    description,
    alternates: { canonical: `/glossary/${entry.slug}` },
    openGraph: {
      title: `${entry.title} | Bitflow 용어집`,
      description,
      url: `${getSiteUrl()}/glossary/${entry.slug}`,
      type: 'article',
      locale: 'ko_KR',
    },
  };
}

export default function GlossaryDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const entry = getGlossaryBySlug(params.slug);
  if (!entry) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: entry.title,
    description: entry.summary,
    termCode: entry.slug,
    inDefinedTermSet: `${getSiteUrl()}/glossary/${entry.slug}`,
  };

  return (
    <main className="relative mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-400/80">Glossary</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">{entry.title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">{entry.summary}</p>
      </header>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-semibold text-white">정의</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">{entry.definition}</p>
        {entry.formula ? (
          <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--card-elevated)] px-4 py-3 font-mono text-sm text-emerald-400">
            {entry.formula}
          </div>
        ) : null}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-lg font-semibold text-white">읽는 방법</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {entry.signals.map((signal) => (
              <li key={signal} className="rounded-lg border border-[var(--border)] bg-[var(--card-elevated)] px-3 py-2">
                {signal}
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-lg font-semibold text-white">주의할 점</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {entry.cautions.map((caution) => (
              <li key={caution} className="rounded-lg border border-[var(--border)] bg-[var(--card-elevated)] px-3 py-2">
                {caution}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="text-lg font-semibold text-white">관련 용어</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {entry.related.map((relatedSlug) => (
            <Link
              key={relatedSlug}
              href={`/glossary/${relatedSlug}`}
              className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-slate-300 transition hover:border-[var(--border-light)] hover:text-white"
            >
              {relatedSlug}
            </Link>
          ))}
        </div>
        <Link
          href="/"
          className="mt-5 inline-flex rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-slate-300 transition hover:border-[var(--border-light)] hover:text-white"
        >
          ← 대시보드로 돌아가기
        </Link>
      </section>
    </main>
  );
}
