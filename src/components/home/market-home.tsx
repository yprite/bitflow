'use client';

import { MiniLineChart } from '@/components/charts/mini-line-chart';
import { FollowPanel } from '@/components/home/follow-panel';
import { LiveRankingBoard } from '@/components/home/live-ranking-board';
import {
  ALERT_MODE_LABEL,
  ALERT_MODE_STORAGE_KEY,
  FOLLOW_TAG_STORAGE_KEY,
  hasMatchingTag,
  prioritizeBySelectedTags,
  type AlertMode,
} from '@/lib/home-preferences';
import {
  type AnalysisCard,
  type MarketDirection,
  type MarketIndexCard,
  type PulseStat,
  type RankingTab,
  type ScheduleItem,
  type SpotlightTheme,
  type ThemeCard,
} from '@/lib/market-home-content';
import type { MarketHomeSnapshot } from '@/lib/market-home-data';
import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';

function directionStyles(direction: MarketDirection): { value: string; dot: string } {
  switch (direction) {
    case 'up':
      return {
        value: 'text-[#F97316]',
        dot: 'bg-[#F97316]',
      };
    case 'down':
      return {
        value: 'text-[#60A5FA]',
        dot: 'bg-[#60A5FA]',
      };
    default:
      return {
        value: 'text-slate-400',
        dot: 'bg-slate-500',
      };
  }
}

function spotlightStyles(accent: SpotlightTheme['accent']): string {
  switch (accent) {
    case 'signal':
      return 'from-[#FFF3D5] via-[#FFE4B0] to-[#FFD39A] text-slate-900';
    case 'heat':
      return 'from-[#161B34] via-[#1D2244] to-[#2E1D3D] text-white';
    case 'calendar':
      return 'from-[#DCFCE7] via-[#D1FAE5] to-[#BFDBFE] text-slate-900';
  }
}

function SectionHeader({
  eyebrow,
  title,
  actionLabel,
  actionHref,
}: {
  eyebrow: string;
  title: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F59E0B]">{eyebrow}</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">{title}</h2>
      </div>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

function MarketIndexPanel({ card }: { card: MarketIndexCard }) {
  const styles = directionStyles(card.direction);

  return (
    <article className="rounded-[28px] border border-white/10 bg-[#0D172A]/85 p-4 shadow-[0_20px_60px_rgba(2,6,23,0.35)] backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{card.name}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{card.level}</p>
        </div>
        <span className={`rounded-full border border-white/10 px-2.5 py-1 text-xs font-semibold ${styles.value}`}>
          {card.change}
        </span>
      </div>
      <div className="mt-4">
        <MiniLineChart points={card.points} tone={card.tone} />
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-300">
        <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
        <span>{card.note}</span>
      </div>
    </article>
  );
}

function SpotlightCard({ item, index }: { item: SpotlightTheme; index: number }) {
  return (
    <article
      className={`relative overflow-hidden rounded-[32px] bg-gradient-to-br p-5 shadow-[0_24px_70px_rgba(2,6,23,0.24)] ${spotlightStyles(item.accent)}`}
    >
      <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-white/20 blur-2xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-current/70">Hot #{index + 1}</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">{item.title}</h3>
          </div>
          <span className="rounded-full border border-current/15 bg-white/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-current">
            {item.badge}
          </span>
        </div>
        <p className="mt-4 text-sm leading-6 text-current/85">{item.summary}</p>
        <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-2xl border border-current/10 bg-white/30 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-current/55">평균 상승</p>
            <p className="mt-1 font-semibold">{item.momentum}</p>
          </div>
          <div className="rounded-2xl border border-current/10 bg-white/30 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-current/55">시장 반응</p>
            <p className="mt-1 font-semibold">{item.flow}</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {item.relatedTickers.map((ticker) => (
            <span key={ticker} className="rounded-full border border-current/10 bg-white/25 px-3 py-1.5 text-xs font-medium text-current/85">
              {ticker}
            </span>
          ))}
        </div>
        <Link
          href={item.accent === 'calendar' ? '#schedule' : '#themes'}
          className="mt-5 inline-flex rounded-full border border-current/15 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white"
        >
          {item.cta}
        </Link>
      </div>
    </article>
  );
}

function ThemeGridCard({ card }: { card: ThemeCard }) {
  const styles = directionStyles(card.direction);

  return (
    <article className="rounded-[28px] border border-white/10 bg-[#0E182D]/80 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold tracking-tight text-white">{card.name}</p>
          <span className="mt-2 inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
            {card.badge}
          </span>
        </div>
        <div className="text-right">
          <p className={`text-lg font-semibold ${styles.value}`}>{card.averageReturn}</p>
          <p className="mt-1 text-xs text-slate-500">거래대금 {card.turnover}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-300">{card.summary}</p>
      <div className="mt-4 rounded-2xl border border-white/8 bg-black/10 px-3 py-3 text-sm text-slate-200">
        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">다음 촉매</p>
        <p className="mt-1 font-medium">{card.nextCatalyst}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {card.tickers.map((ticker) => (
          <span key={ticker} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">
            {ticker}
          </span>
        ))}
      </div>
    </article>
  );
}

function AnalysisTile({ card }: { card: AnalysisCard }) {
  return (
    <article className="rounded-[28px] border border-white/10 bg-gradient-to-br from-[#161B34] to-[#111827] p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-2.5 py-1 text-[11px] font-semibold text-[#FBBF24]">
          {card.category}
        </span>
        <span className="text-xs text-slate-500">{card.readingTime}</span>
      </div>
      <h3 className="mt-4 text-lg font-semibold leading-7 tracking-tight text-white">{card.title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-300">{card.blurb}</p>
      <Link href="#ranking" className="mt-4 inline-flex text-sm font-medium text-[#FDBA74] underline-offset-4 hover:underline">
        분석 열기
      </Link>
    </article>
  );
}

function PulseStatCard({ stat }: { stat: PulseStat }) {
  const content = (
    <>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{stat.label}</p>
        <p className="mt-2 text-lg font-semibold tracking-tight text-slate-900">{stat.value}</p>
        <p className="mt-3 text-sm leading-6 text-slate-700">{stat.caption}</p>
      </div>
      <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
        <span>{stat.cta}</span>
        <span aria-hidden="true">{'->'}</span>
      </div>
    </>
  );

  return stat.href ? (
    <Link
      href={stat.href}
      className="flex h-full flex-col justify-between rounded-[24px] border border-slate-900/10 bg-white/60 px-4 py-4 transition hover:border-slate-900/25 hover:bg-white/80"
    >
      {content}
    </Link>
  ) : (
    <div className="flex h-full flex-col justify-between rounded-[24px] border border-slate-900/10 bg-white/60 px-4 py-4">
      {content}
    </div>
  );
}

interface AlertPreviewItem {
  title: string;
  summary: string;
}

function buildAlertPreviews(params: {
  alertMode: AlertMode;
  rankingTabs: RankingTab[];
  themes: ThemeCard[];
  schedule: ScheduleItem[];
  selectedTags: string[];
}): AlertPreviewItem[] {
  const modeLabel = ALERT_MODE_LABEL[params.alertMode];

  if (!params.selectedTags.length) {
    return [
      {
        title: '관심 테마를 먼저 골라주세요',
        summary: '반도체, 조선, 배당처럼 내가 자주 보는 테마를 골라야 알림 미리보기가 개인화됩니다.',
      },
      {
        title: `${modeLabel} 예시`,
        summary: '예: 반도체가 Top 3에 다시 진입하면 바로 알려주고, 장마감에는 놓친 흐름을 한 번에 요약합니다.',
      },
    ];
  }

  const topReason = params.rankingTabs.find((tab) => tab.label === '왜 오름')?.items[0];
  const topMoney = params.rankingTabs.find((tab) => tab.label === '돈 붙는 곳')?.items[0];
  const nextSchedule = params.schedule.find((item) => hasMatchingTag(item.tags, params.selectedTags)) ?? params.schedule[0];
  const topTheme = params.themes[0];

  const previews: AlertPreviewItem[] = [];

  if (topTheme) {
    previews.push({
      title: `${modeLabel}: ${topTheme.name} 다시 붙을 때`,
      summary: `${topTheme.name} 테마가 다시 강해지면 평균 ${topTheme.averageReturn}, 다음 촉매 ${topTheme.nextCatalyst} 기준으로 먼저 확인하게 만듭니다.`,
    });
  }

  if (topMoney) {
    previews.push({
      title: `${modeLabel}: ${topMoney.name} 자금 유입`,
      summary: `${topMoney.name}에 ${topMoney.signal}이 붙고 있을 때 ${topMoney.reason} 이유까지 같이 확인하는 알림입니다.`,
    });
  } else if (topReason) {
    previews.push({
      title: `${modeLabel}: ${topReason.name} 급등 포착`,
      summary: `${topReason.name} ${topReason.change} 움직임이 다시 나오면 ${topReason.reason} 맥락으로 바로 열어볼 수 있게 준비합니다.`,
    });
  }

  if (nextSchedule) {
    previews.push({
      title: `${modeLabel}: ${nextSchedule.title}`,
      summary: `${nextSchedule.time} ${nextSchedule.category} 일정입니다. ${nextSchedule.summary}`,
    });
  }

  return previews;
}

export function MarketHome({ initialSnapshot }: { initialSnapshot: MarketHomeSnapshot }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [isPending, startTransition] = useTransition();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [marketView, setMarketView] = useState<'all' | 'followed'>('all');
  const [alertMode, setAlertMode] = useState<AlertMode>('instant');
  const { content, meta } = snapshot;
  const hasSelectedTags = selectedTags.length > 0;

  useEffect(() => {
    let cancelled = false;

    async function refreshSnapshot() {
      try {
        const response = await fetch('/api/market-home', { cache: 'no-store' });
        if (!response.ok) return;

        const nextSnapshot = (await response.json()) as MarketHomeSnapshot;
        if (cancelled) return;

        startTransition(() => {
          setSnapshot(nextSnapshot);
        });
      } catch {
        // Keep the fallback snapshot when live refresh fails.
      }
    }

    refreshSnapshot();

    return () => {
      cancelled = true;
    };
  }, [startTransition]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(FOLLOW_TAG_STORAGE_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setSelectedTags(parsed.filter((value): value is string => typeof value === 'string'));
      }
    } catch {
      localStorage.removeItem(FOLLOW_TAG_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(FOLLOW_TAG_STORAGE_KEY, JSON.stringify(selectedTags));
  }, [selectedTags]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ALERT_MODE_STORAGE_KEY);
      if (saved === 'instant' || saved === 'close' || saved === 'off') {
        setAlertMode(saved);
      }
    } catch {
      localStorage.removeItem(ALERT_MODE_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(ALERT_MODE_STORAGE_KEY, alertMode);
  }, [alertMode]);

  useEffect(() => {
    if (!hasSelectedTags && marketView === 'followed') {
      setMarketView('all');
    }
  }, [hasSelectedTags, marketView]);

  const orderedSpotlightThemes = useMemo(
    () => prioritizeBySelectedTags(content.spotlightThemes, selectedTags),
    [content.spotlightThemes, selectedTags]
  );
  const orderedThemes = useMemo(
    () => prioritizeBySelectedTags(content.themes, selectedTags),
    [content.themes, selectedTags]
  );
  const orderedRankingTabs = useMemo<RankingTab[]>(
    () =>
      content.rankingTabs.map((tab) => ({
        ...tab,
        items: prioritizeBySelectedTags(tab.items, selectedTags),
      })),
    [content.rankingTabs, selectedTags]
  );

  const spotlightThemes =
    marketView === 'followed'
      ? orderedSpotlightThemes.filter((item) => hasMatchingTag(item.tags, selectedTags))
      : orderedSpotlightThemes;
  const themeCards =
    marketView === 'followed'
      ? orderedThemes.filter((item) => hasMatchingTag(item.tags, selectedTags))
      : orderedThemes;
  const rankingTabs = useMemo<RankingTab[]>(
    () =>
      orderedRankingTabs.map((tab) => ({
        ...tab,
        items:
          marketView === 'followed'
            ? tab.items.filter((item) => hasMatchingTag(item.tags, selectedTags))
            : tab.items,
      })),
    [marketView, orderedRankingTabs, selectedTags]
  );
  const visibleSpotlightThemes = spotlightThemes.length > 0 ? spotlightThemes : orderedSpotlightThemes;
  const visibleThemeCards = themeCards.length > 0 ? themeCards : orderedThemes;
  const visibleRankingTabs = rankingTabs.map((tab, index) => ({
    ...tab,
    items: tab.items.length > 0 ? tab.items : orderedRankingTabs[index]?.items ?? [],
  }));
  const alertPreviews = useMemo(
    () =>
      buildAlertPreviews({
        alertMode,
        rankingTabs: visibleRankingTabs,
        themes: visibleThemeCards,
        schedule: content.schedule,
        selectedTags,
      }),
    [alertMode, content.schedule, selectedTags, visibleRankingTabs, visibleThemeCards]
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#09111F] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(42rem_22rem_at_15%_0%,rgba(249,115,22,0.18),transparent_65%),radial-gradient(36rem_24rem_at_90%_10%,rgba(20,184,166,0.14),transparent_60%),linear-gradient(180deg,#09111F_0%,#0B1323_48%,#080E18_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:22px_22px] opacity-20" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 px-4 pb-28 pt-4 sm:px-6">
        <header id="home" className="sticky top-3 z-20">
          <div className="rounded-[28px] border border-white/10 bg-[#0A1325]/80 px-4 py-3 shadow-[0_18px_70px_rgba(2,6,23,0.45)] backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF3D5] text-sm font-semibold tracking-[0.2em] text-slate-900">
                  BF
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-tight text-white">BitFlow Radar</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <p className="text-xs text-slate-400">{content.liveStamp}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                        meta.source === 'live'
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-amber-500/15 text-amber-300'
                      }`}
                    >
                      {meta.source === 'live' ? 'Live' : 'Fallback'}
                    </span>
                    {isPending ? <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Syncing</span> : null}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="#ranking"
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10"
                >
                  왜 오름
                </Link>
                <Link
                  href="#follow"
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10"
                >
                  관심 알림
                </Link>
              </div>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {content.pulse.tickers.map((ticker) => (
                <span
                  key={ticker}
                  className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300"
                >
                  {ticker}
                </span>
              ))}
            </div>
          </div>
        </header>

        <section className="overflow-hidden rounded-[32px] bg-gradient-to-br from-[#FFF1D6] via-[#FFE7BE] to-[#FFD7A0] p-5 text-slate-900 shadow-[0_25px_80px_rgba(15,23,42,0.28)]">
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-700">
                {content.pulse.eyebrow}
              </p>
              <p className="mt-3 inline-flex rounded-full border border-slate-900/10 bg-white/55 px-3 py-1 text-xs font-semibold text-slate-700">
                30초 안에 지금 붙는 테마, 상승 이유, 내일 일정을 훑는 화면
              </p>
              <h1 className="mt-3 max-w-xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                {content.pulse.title}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-700">{content.pulse.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {['지금 붙는 테마', '왜 움직이는지', '내일 일정'].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-slate-900/10 bg-slate-900/5 px-3 py-1.5 text-xs font-medium text-slate-700"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="#ranking"
                  className="inline-flex rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  왜 오름부터 보기
                </Link>
                <Link
                  href="#schedule"
                  className="inline-flex rounded-full border border-slate-900/10 bg-white/75 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-white"
                >
                  내일 일정 보기
                </Link>
              </div>
              <p className="mt-3 max-w-2xl text-xs leading-5 text-slate-600">{meta.note}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">오늘 놓치면 안 되는 3가지 변화</p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {content.pulse.stats.map((stat) => (
                  <PulseStatCard key={stat.label} stat={stat} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {content.indices.map((card) => (
            <MarketIndexPanel key={card.name} card={card} />
          ))}
        </section>

        <section id="themes" className="rounded-[32px] border border-white/10 bg-[#0B1426]/80 p-5 backdrop-blur">
          <SectionHeader eyebrow="Spotlight" title="지금 시장에서 바로 봐야 할 3개 테마" actionLabel="전체 테마" actionHref="#theme-grid" />
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setMarketView('all')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                marketView === 'all'
                  ? 'bg-[#FFF3D5] text-slate-900'
                  : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              전체 시장
            </button>
            <button
              type="button"
              onClick={() => hasSelectedTags && setMarketView('followed')}
              disabled={!hasSelectedTags}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                marketView === 'followed'
                  ? 'bg-[#DCFCE7] text-slate-900'
                  : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50'
              }`}
            >
              내 관심 시장
            </button>
            {hasSelectedTags ? (
              <p className="text-sm text-slate-400">우선 정렬: {selectedTags.join(' · ')}</p>
            ) : (
              <p className="text-sm text-slate-500">관심 테마를 고르면 이 구역부터 먼저 달라집니다.</p>
            )}
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
            {visibleSpotlightThemes.map((item, index) => (
              <SpotlightCard key={item.title} item={item} index={index} />
            ))}
          </div>
        </section>

        <section id="ranking" className="rounded-[32px] border border-white/10 bg-[#0B1426]/80 p-5 backdrop-blur">
          <SectionHeader eyebrow="Ranking" title="왜 오르는지 바로 보는 랭킹" actionLabel="상승 이유 보기" actionHref="#ranking" />
          <LiveRankingBoard tabs={visibleRankingTabs} note={meta.note} />
        </section>

        <section className="rounded-[32px] border border-[#F59E0B]/20 bg-gradient-to-br from-[#1B223B] to-[#111827] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F59E0B]">Briefing</p>
          <p className="mt-3 text-xl font-semibold leading-8 tracking-tight text-white">{content.briefing}</p>
        </section>

        <section id="theme-grid" className="rounded-[32px] border border-white/10 bg-[#0B1426]/80 p-5 backdrop-blur">
          <SectionHeader eyebrow="Theme Deck" title="지금 붙는 테마와 다음 촉매" actionLabel="팔로우" actionHref="#follow" />
          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {visibleThemeCards.map((card) => (
              <ThemeGridCard key={card.name} card={card} />
            ))}
          </div>
        </section>

        <section id="schedule" className="rounded-[32px] border border-white/10 bg-[#0B1426]/80 p-5 backdrop-blur">
          <SectionHeader eyebrow="Tomorrow" title="내일 일정 있는 종목" actionLabel="캘린더" actionHref="#schedule" />
          <div className="mt-5 space-y-3">
            {content.schedule.map((item) => (
              <article key={`${item.time}-${item.title}`} className="grid grid-cols-[auto_1fr] gap-3 rounded-[26px] border border-white/8 bg-white/5 px-4 py-4">
                <div className="flex flex-col items-center justify-center rounded-2xl bg-[#FFF3D5] px-3 py-2 text-center text-slate-900">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{item.category}</span>
                  <span className="mt-1 text-sm font-semibold">{item.time}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.summary}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-[#0B1426]/80 p-5 backdrop-blur">
          <SectionHeader eyebrow="Editor Picks" title="많이 읽을 분석" />
          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {content.analysis.map((card) => (
              <AnalysisTile key={card.title} card={card} />
            ))}
          </div>
        </section>

        <section
          id="follow"
          className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#DCFCE7] via-[#F0FDF4] to-[#E0F2FE] p-5 text-slate-900"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600">Retention</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">관심 테마 3개만 골라도 다음에 다시 볼 이유가 생깁니다</h2>
          <FollowPanel
            tags={content.followTags}
            selected={selectedTags}
            onChange={setSelectedTags}
            alertMode={alertMode}
            onAlertModeChange={setAlertMode}
            previews={alertPreviews}
          />
        </section>

        <footer className="px-1 pb-6 text-xs text-slate-500">
          <p>BitFlow는 더 많은 숫자를 쌓기보다, 지금 붙는 이유와 다음 체크포인트를 먼저 설명하는 장중 레이더를 목표로 합니다.</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link href="/privacy" className="underline underline-offset-4 hover:text-slate-300">
              개인정보처리방침
            </Link>
            <Link href="/glossary" className="underline underline-offset-4 hover:text-slate-300">
              용어집
            </Link>
          </div>
        </footer>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#08111F]/90 px-3 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between gap-2">
          {[
            { label: '홈', href: '#home' },
            { label: '랭킹', href: '#ranking' },
            { label: '테마', href: '#themes' },
            { label: '일정', href: '#schedule' },
            { label: '관심', href: '#follow' },
          ].map((item, index) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex min-w-[60px] flex-col items-center rounded-2xl px-3 py-2 text-xs font-medium transition ${
                index === 0 ? 'bg-[#FFF3D5] text-slate-900' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
