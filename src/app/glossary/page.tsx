import Link from 'next/link';
import { getGlossaryEntries } from '@/lib/indicator-content';
import type { Metadata } from 'next';

export const revalidate = 86400;
export const metadata: Metadata = {
  title: '온체인 용어집 | Bitflow',
  description: '비트코인 온체인 지표 용어를 쉽게 설명한 Bitflow 용어집',
};

export default function GlossaryIndexPage() {
  const entries = getGlossaryEntries();

  return (
    <main className="relative mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Glossary</p>
        <h1 className="mt-2 text-3xl font-bold text-white">온체인 용어집</h1>
        <p className="mt-3 text-sm leading-6 text-slate-200">
          자주 쓰이는 비트코인 온체인 지표 용어를 짧고 명확하게 정리했습니다.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {entries.map((entry) => (
          <Link
            key={entry.slug}
            href={`/glossary/${entry.slug}`}
            className="rounded-xl border border-white/10 bg-black/30 p-4 backdrop-blur transition hover:border-white/25 hover:bg-black/40"
          >
            <h2 className="text-base font-semibold text-white">{entry.title}</h2>
            <p className="mt-2 text-sm text-slate-300">{entry.summary}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
