import { SessionLineChart } from '@/components/charts/session-line-chart';
import {
  fetchTrackedStockPageData,
  getTrackedStockBySlug,
  type MarketStockPageData,
  type StockTimelineItem,
} from '@/lib/market-home-data';
import { getSiteUrl } from '@/lib/site-url';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

function formatTimelineTime(item: Pick<StockTimelineItem, 'publishedAt' | 'displayTime'>): string {
  if (item.displayTime) {
    return item.displayTime;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(item.publishedAt));
}

function directionClasses(data: MarketStockPageData): { change: string; badge: string } {
  switch (data.direction) {
    case 'up':
      return {
        change: 'text-[#F97316]',
        badge: 'bg-[#F97316]/12 text-[#FDBA74]',
      };
    case 'down':
      return {
        change: 'text-[#60A5FA]',
        badge: 'bg-[#60A5FA]/12 text-[#BFDBFE]',
      };
    default:
      return {
        change: 'text-slate-300',
        badge: 'bg-white/10 text-slate-300',
      };
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const definition = getTrackedStockBySlug(params.slug);

  if (!definition) {
    return {
      title: '종목을 찾을 수 없음 | BitFlow Radar',
    };
  }

  const title = `${definition.name} 왜 오름? | BitFlow Radar`;
  const description = `${definition.theme} 테마의 ${definition.name} 실시간 맥락과 다음 체크포인트를 요약합니다.`;
  const url = `${getSiteUrl()}/stocks/${definition.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      locale: 'ko_KR',
    },
  };
}

export default async function StockDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const data = await fetchTrackedStockPageData(params.slug);
  if (!data) notFound();

  const styles = directionClasses(data);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#08111F] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_20rem_at_10%_0%,rgba(249,115,22,0.16),transparent_65%),radial-gradient(36rem_20rem_at_90%_5%,rgba(96,165,250,0.12),transparent_60%),linear-gradient(180deg,#08111F_0%,#0B1323_50%,#070C15_100%)]" />

      <main className="relative mx-auto flex max-w-5xl flex-col gap-4 px-4 py-5 pb-20 sm:px-6">
        <header className="flex items-center justify-between gap-3">
          <Link
            href="/#ranking"
            className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            홈으로
          </Link>
          <span className="text-xs text-slate-500">{data.liveStamp}</span>
        </header>

        <section className="rounded-[32px] border border-white/10 bg-[#0B1426]/80 p-5 backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#FFF3D5] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-900">
                  {data.theme}
                </span>
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${styles.badge}`}>
                  {data.source === 'live' ? 'Live' : 'Fallback'}
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{data.name}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">{data.summary}</p>
            </div>
            <div className="min-w-[180px] rounded-[28px] border border-white/10 bg-black/10 px-4 py-4 text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">현재가</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{data.price}</p>
              <p className={`mt-2 text-lg font-semibold ${styles.change}`}>{data.change}</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] border border-white/8 bg-white/5 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">거래대금</p>
              <p className="mt-2 text-lg font-semibold text-white">{data.turnover}</p>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-white/5 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">거래 시그널</p>
              <p className="mt-2 text-lg font-semibold text-white">{data.volumeSignal}</p>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-white/5 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">추적 테마</p>
              <p className="mt-2 text-lg font-semibold text-white">{data.theme}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-[#0B1426]/80 p-5 backdrop-blur">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F59E0B]">Session Chart</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">최근 5일 흐름</h2>
            </div>
            <span className="text-xs text-slate-500">최근 5거래일</span>
          </div>
          <div className="mt-5">
            <SessionLineChart points={data.points} tone={data.tone} />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[32px] border border-white/10 bg-[#0B1426]/80 p-5 backdrop-blur">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F59E0B]">Why It Moves</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">왜 움직이는지 3줄로 정리</h2>
            <ol className="mt-5 space-y-3">
              {data.whyNow.map((line, index) => (
                <li key={line} className="grid grid-cols-[auto_1fr] gap-3 rounded-[24px] border border-white/8 bg-white/5 px-4 py-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#FFF3D5] text-sm font-semibold text-slate-900">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-6 text-slate-200">{line}</p>
                </li>
              ))}
            </ol>
          </article>

          <article className="rounded-[32px] border border-white/10 bg-[#0B1426]/80 p-5 backdrop-blur">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F59E0B]">Catalyst</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">다음 체크포인트</h2>
            <div className="mt-5 space-y-3">
              {data.catalysts.map((item) => (
                <div key={item} className="rounded-[24px] border border-white/8 bg-white/5 px-4 py-4">
                  <p className="text-sm leading-6 text-slate-200">{item}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-[#0B1426]/80 p-5 backdrop-blur">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F59E0B]">Timeline</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">뉴스 / 공시 타임라인</h2>
            </div>
            <span className="text-xs text-slate-500">최근 6개 항목</span>
          </div>
          <div className="mt-5 space-y-3">
            {data.timeline.map((item) => (
              <article
                key={item.id}
                className="grid grid-cols-[auto_1fr] gap-3 rounded-[24px] border border-white/8 bg-white/5 px-4 py-4"
              >
                  <div className="flex w-[74px] flex-col items-center justify-center rounded-2xl bg-[#FFF3D5] px-3 py-2 text-center text-slate-900">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</span>
                  <span className="mt-1 text-xs font-semibold">{formatTimelineTime(item)}</span>
                </div>
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold leading-6 text-white">{item.title}</h3>
                    {item.href ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 text-xs font-medium text-[#FDBA74] underline-offset-4 hover:underline"
                      >
                        원문 보기
                      </a>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.summary}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-[#0B1426]/80 p-5 backdrop-blur">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F59E0B]">Peers</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">같이 보는 종목</h2>
            </div>
            <Link href="/#themes" className="text-sm font-medium text-[#FDBA74] underline-offset-4 hover:underline">
              테마 홈으로
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {data.peers.map((peer) => (
              <Link
                key={peer.slug}
                href={peer.href}
                className="flex items-center justify-between gap-3 rounded-[24px] border border-white/8 bg-white/5 px-4 py-4 transition hover:border-white/20 hover:bg-white/10"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{peer.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{peer.slug}</p>
                </div>
                <p
                  className={
                    peer.direction === 'up'
                      ? 'text-sm font-semibold text-[#F97316]'
                      : peer.direction === 'down'
                        ? 'text-sm font-semibold text-[#60A5FA]'
                        : 'text-sm font-semibold text-slate-300'
                  }
                >
                  {peer.change}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
