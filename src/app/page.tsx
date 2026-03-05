import { MiniLineChart } from '@/components/charts/mini-line-chart';
import { loadDashboardData, type Freshness, type MetricCardData } from '@/lib/dashboard';
import type { MarketStatus } from '@/lib/metrics';
import { getSiteUrl } from '@/lib/site-url';
import Link from 'next/link';
import type { ReactNode } from 'react';

export const revalidate = 3600;

const STATUS_STYLE: Record<
  MarketStatus,
  { emoji: string; label: string; badge: string; glow: string }
> = {
  accumulation: {
    emoji: '🟢',
    label: '축적 국면',
    badge: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/35',
    glow: 'from-emerald-500/20 to-transparent',
  },
  neutral: {
    emoji: '🟡',
    label: '중립',
    badge: 'bg-amber-500/15 text-amber-300 ring-amber-400/35',
    glow: 'from-amber-500/20 to-transparent',
  },
  caution: {
    emoji: '🔴',
    label: '주의 구간',
    badge: 'bg-rose-500/15 text-rose-300 ring-rose-400/35',
    glow: 'from-rose-500/20 to-transparent',
  },
  insufficient: {
    emoji: '⚪',
    label: '데이터 부족',
    badge: 'bg-slate-500/20 text-slate-200 ring-slate-300/30',
    glow: 'from-slate-500/20 to-transparent',
  },
};

const FRESHNESS_STYLE: Record<Freshness, { label: string; className: string }> = {
  fresh: {
    label: '정상',
    className: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30',
  },
  delayed: {
    label: '지연',
    className: 'bg-amber-500/15 text-amber-300 ring-amber-400/30',
  },
  stale: {
    label: '오래됨',
    className: 'bg-rose-500/15 text-rose-300 ring-rose-400/30',
  },
  unknown: {
    label: '미확인',
    className: 'bg-slate-500/20 text-slate-200 ring-slate-300/30',
  },
};

const CARD_FRESHNESS_STYLE: Record<Freshness, { label: string; className: string }> = {
  fresh: {
    label: '정상',
    className: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/30',
  },
  delayed: {
    label: '지연',
    className: 'bg-amber-500/10 text-amber-300 ring-amber-400/30',
  },
  stale: {
    label: '오래됨',
    className: 'bg-rose-500/10 text-rose-300 ring-rose-400/30',
  },
  unknown: {
    label: '미확인',
    className: 'bg-slate-500/20 text-slate-200 ring-slate-300/30',
  },
};

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

function formatMetric(card: MetricCardData): string {
  if (card.latest === null) return '데이터 없음';
  if (card.key === 'exchange_netflow') {
    const sign = card.latest > 0 ? '+' : '';
    return `${sign}${Math.round(card.latest).toLocaleString()} BTC`;
  }
  if (card.key === 'mempool_fees') {
    return `${Math.round(card.latest).toLocaleString()} sat/vB`;
  }
  if (card.key === 'fear_greed') {
    return `${Math.round(card.latest)}`;
  }
  return `${card.latest.toFixed(2)}%`;
}

function fearGreedLabel(value: number | null): string {
  if (value === null) return '미확인';
  if (value < 25) return '극도의 공포';
  if (value < 45) return '공포';
  if (value <= 55) return '중립';
  if (value <= 75) return '탐욕';
  return '극도의 탐욕';
}

function MetricCard({
  card,
  tone,
  href,
  extra,
}: {
  card: MetricCardData;
  tone: string;
  href: string;
  extra?: ReactNode;
}) {
  const freshness = CARD_FRESHNESS_STYLE[card.freshness];

  return (
    <section className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur">
      <header className="mb-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-slate-300">{card.title}</p>
          <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] ring-1 ${freshness.className}`}>
            {freshness.label}
          </span>
        </div>
        <p className="mt-1 text-2xl font-semibold text-white">{formatMetric(card)}</p>
        <p className="mt-1 text-xs text-slate-400">{card.subtitle}</p>
      </header>
      <MiniLineChart points={card.points} tone={tone} />
      {extra ? <div className="mt-3 text-sm text-slate-200">{extra}</div> : null}
      <p className="mt-3 text-xs text-slate-400">업데이트: {formatKst(card.latestAt)}</p>
      <Link href={href} className="mt-3 inline-flex text-xs text-slate-200 underline-offset-4 transition hover:underline">
        상세 페이지 보기
      </Link>
    </section>
  );
}

export default async function Home() {
  const dashboard = await loadDashboardData();
  const status = STATUS_STYLE[dashboard.status];
  const freshness = FRESHNESS_STYLE[dashboard.freshness];
  const fearGreed = dashboard.cards.fearGreed.latest;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Bitflow 비트코인 온체인 데이터 대시보드',
    description: '한국 투자자를 위한 비트코인 온체인 데이터 대시보드',
    url: getSiteUrl(),
    inLanguage: 'ko-KR',
    creator: {
      '@type': 'Organization',
      name: 'Bitflow',
    },
    variableMeasured: ['exchange_netflow', 'utxo_age_1y', 'mempool_fees', 'fear_greed'],
    isAccessibleForFree: true,
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70rem_40rem_at_0%_-20%,rgba(0,150,255,0.15),transparent_65%),radial-gradient(60rem_35rem_at_100%_0%,rgba(255,128,0,0.12),transparent_70%)]" />
      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">BITFLOW DASHBOARD</p>
              <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">비트코인 온체인 대시보드</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ring-1 ${status.badge}`}>
                <span>{status.emoji}</span>
                <span>{status.label}</span>
              </span>
              <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm ring-1 ${freshness.className}`}>
                데이터 {freshness.label}
              </span>
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-200">{dashboard.summary}</p>
          <p className="mt-2 text-xs text-slate-400">점수 합계: {dashboard.totalScore >= 0 ? `+${dashboard.totalScore}` : dashboard.totalScore}</p>
          <div className={`mt-4 h-px w-full bg-gradient-to-r ${status.glow}`} />
        </header>

        {dashboard.errors.length > 0 ? (
          <section className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
            일부 데이터 소스 연결에 실패했습니다. 마지막 정상 데이터 기준으로 표시합니다.
          </section>
        ) : null}

        {dashboard.freshness !== 'fresh' ? (
          <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
            일부 지표 업데이트가 지연되고 있습니다. 자동 트윗은 stale 조건에서 스킵될 수 있습니다.
          </section>
        ) : null}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <MetricCard
            card={dashboard.cards.netflow}
            tone="#34d399"
            href="/exchange-netflow"
            extra={
              <span>
                {dashboard.cards.netflow.latest === null
                  ? '판정 불가'
                  : dashboard.cards.netflow.latest < -2000
                    ? '거래소 순유출 우세'
                    : dashboard.cards.netflow.latest > 2000
                      ? '거래소 순유입 우세'
                      : '중립 범위'}
              </span>
            }
          />
          <MetricCard
            card={dashboard.cards.utxoAge}
            tone="#60a5fa"
            href="/utxo-age"
            extra={
              dashboard.utxoWeeklyChange === null ? (
                <span>7일 변화량 계산 데이터 부족</span>
              ) : (
                <span>
                  7일 변화량: {dashboard.utxoWeeklyChange > 0 ? '+' : ''}
                  {dashboard.utxoWeeklyChange.toFixed(2)}%p
                </span>
              )
            }
          />
          <MetricCard card={dashboard.cards.mempoolFees} tone="#f59e0b" href="/mempool-fees" />
          <MetricCard
            card={dashboard.cards.fearGreed}
            tone="#f97316"
            href="/fear-greed"
            extra={
              <div className="space-y-2">
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500"
                    style={{ width: `${Math.max(0, Math.min(100, fearGreed ?? 0))}%` }}
                  />
                </div>
                <div className="text-xs text-slate-300">{fearGreedLabel(fearGreed)}</div>
              </div>
            }
          />
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">고래 이동 피드 (최근 24h)</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">최대 10건</span>
              <Link href="/whale-tracker" className="text-xs text-slate-200 underline-offset-4 transition hover:underline">
                상세 페이지 보기
              </Link>
            </div>
          </div>
          {dashboard.whaleTransactions.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/15 px-4 py-6 text-sm text-slate-300">
              최근 24시간 고래 트랜잭션이 없거나 API 한도에 도달했습니다.
            </p>
          ) : (
            <ul className="space-y-2">
              {dashboard.whaleTransactions.map((whale) => (
                <li
                  key={whale.txHash}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
                >
                  <div className="min-w-0">
                    <p className="truncate">
                      {whale.fromName ?? 'Unknown'} → {whale.toName ?? 'Unknown'}
                    </p>
                    <p className="text-xs text-slate-400">{formatKst(whale.timestamp)}</p>
                  </div>
                  <p className="font-semibold text-amber-300">{whale.amountBtc.toLocaleString()} BTC</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-slate-300">
          <p>마지막 업데이트: {formatKst(dashboard.lastUpdatedAt)}</p>
          <p className="mt-1">데이터 출처: CoinGecko, Alternative.me, Blockchain.com, Mempool.space, Whale Alert</p>
          <p className="mt-2 text-slate-400">
            본 사이트는 투자 조언을 제공하지 않습니다. 모든 데이터는 참고용이며, 투자 결정은 본인의 책임입니다.
            {' · '}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-slate-200">개인정보처리방침</Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
