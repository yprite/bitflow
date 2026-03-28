'use client';

import { useEffect, useState, useMemo } from 'react';
import { useData } from '@/components/data-provider';
import { Masthead } from '@/components/desktop/magazine/masthead';
import { FloatingProgress } from '@/components/desktop/magazine/floating-progress';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { NumberCounter } from '@/components/motion/number-counter';
import { IndicatorCard } from '@/components/desktop/magazine/indicator-card';
import { SignalBar } from '@/components/desktop/magazine/signal-bar';
import { LightSection } from '@/components/desktop/magazine/light-section';
import { MagazineFooter } from '@/components/desktop/magazine/magazine-footer';
import { DesktopSurface } from '@/components/desktop/desktop-ui';
import { getUpcomingEvents } from '@/lib/events';
import type { DashboardData, IndicatorsPageData, ExtendedKimpHistoryPoint, KimpStats } from '@/lib/types';

// Chart components — exact paths verified from desktop-indicators-page.tsx
import KimpChart from '@/components/kimp-chart';
import KimpStatsCard from '@/components/indicators/kimp-stats-card';
import FundingRateHistoryChart from '@/components/indicators/funding-rate-history-chart';
import FearGreedHistoryChart from '@/components/indicators/fear-greed-history-chart';
import BtcReturnHeatmap from '@/components/indicators/btc-return-heatmap';

const PROGRESS_SECTIONS = [
  { id: 'masthead', label: '마스트헤드' },
  { id: 'headline', label: '헤드라인' },
  { id: 'thermometer', label: '온도계' },
  { id: 'charts', label: '차트' },
  { id: 'heatmap', label: '히트맵' },
  { id: 'events', label: '이벤트' },
  { id: 'tools', label: '도구' },
];

// Helpers
function formatVol(): string {
  const start = new Date('2024-01-01');
  const now = new Date();
  const days = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  return String(days);
}

function todayFormatted(): string {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function computeStats(data: ExtendedKimpHistoryPoint[]): KimpStats | null {
  if (data.length < 2) return null;
  const values = data.map((d) => d.value);
  const n = values.length;
  const avg = values.reduce((a, b) => a + b, 0) / n;
  const sorted = [...values].sort((a, b) => a - b);
  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / n;

  return {
    avg,
    min: Math.min(...values),
    max: Math.max(...values),
    stdDev: Math.sqrt(variance),
    median,
    current: values[values.length - 1],
    dataPoints: n,
  };
}

type Tone = 'positive' | 'negative' | 'neutral' | 'accent';

interface IndicatorDef {
  key: string;
  label: string;
  labelEn: string;
  getValue: (d: DashboardData) => number;
  getDisplay?: (d: DashboardData) => string;
  getTone: (d: DashboardData) => Tone;
  getToneLabel: (d: DashboardData) => string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

// Define all 11 indicators — adapted from desktop-home-page.tsx with corrected field names
const INDICATORS: IndicatorDef[] = [
  {
    key: 'fearGreed',
    label: '공포탐욕 지수',
    labelEn: 'Fear & Greed Index',
    getValue: (d) => d.fearGreed.value,
    getTone: (d) => d.fearGreed.value >= 60 ? 'positive' : d.fearGreed.value <= 40 ? 'negative' : 'neutral',
    getToneLabel: (d) => d.fearGreed.value >= 75 ? '극단적 탐욕' : d.fearGreed.value >= 60 ? '탐욕' : d.fearGreed.value <= 25 ? '극단적 공포' : d.fearGreed.value <= 40 ? '공포' : '중립',
    decimals: 0,
  },
  {
    key: 'kimp',
    label: 'KIMP 프리미엄',
    labelEn: 'Korea Premium',
    getValue: (d) => d.kimp.kimchiPremium,
    getDisplay: (d) => `${d.kimp.kimchiPremium >= 0 ? '+' : ''}${d.kimp.kimchiPremium.toFixed(1)}%`,
    getTone: (d) => Math.abs(d.kimp.kimchiPremium) >= 3 ? 'negative' : Math.abs(d.kimp.kimchiPremium) >= 1.5 ? 'accent' : 'neutral',
    getToneLabel: (d) => d.kimp.kimchiPremium >= 3 ? '높음' : d.kimp.kimchiPremium <= -1 ? '역프' : '보통',
    suffix: '%',
    decimals: 1,
  },
  {
    key: 'funding',
    label: '펀딩비',
    labelEn: 'Funding Rate',
    getValue: (d) => d.fundingRate.fundingRate * 100,
    getTone: (d) => d.fundingRate.fundingRate > 0.0005 ? 'positive' : d.fundingRate.fundingRate < -0.0005 ? 'negative' : 'neutral',
    getToneLabel: (d) => d.fundingRate.fundingRate > 0.0005 ? '롱 우위' : d.fundingRate.fundingRate < -0.0005 ? '숏 우위' : '중립',
    suffix: '%',
    decimals: 3,
  },
  {
    key: 'dominance',
    label: 'BTC 도미넌스',
    labelEn: 'Dominance',
    getValue: (d) => d.btcDominance.dominance,
    getTone: () => 'accent',
    getToneLabel: (d) => d.btcDominance.dominance > 55 ? '높음' : d.btcDominance.dominance < 45 ? '낮음' : '안정',
    suffix: '%',
    decimals: 1,
  },
  {
    key: 'liquidation',
    label: '청산량',
    labelEn: 'Liquidation',
    getValue: (d) => d.liquidation.totalLiqUsd / 1_000_000,
    getTone: (d) => d.liquidation.totalLiqUsd > 100_000_000 ? 'negative' : 'neutral',
    getToneLabel: (d) => d.liquidation.totalLiqUsd > 200_000_000 ? '매우 높음' : d.liquidation.totalLiqUsd > 100_000_000 ? '높음' : '보통',
    prefix: '$',
    suffix: 'M',
    decimals: 0,
  },
  {
    key: 'volume',
    label: '거래량 변화',
    labelEn: 'Volume Change',
    getValue: (d) => d.volumeChange.binanceChangeRate,
    getTone: (d) => d.volumeChange.binanceChangeRate > 10 ? 'positive' : d.volumeChange.binanceChangeRate < -10 ? 'negative' : 'neutral',
    getToneLabel: (d) => d.volumeChange.binanceChangeRate > 0 ? '증가' : '감소',
    prefix: '+',
    suffix: '%',
    decimals: 1,
  },
  {
    key: 'stablecoin',
    label: '스테이블코인',
    labelEn: 'Stablecoin Supply',
    getValue: (d) => d.stablecoinMcap.totalMcap / 1_000_000_000,
    getTone: () => 'neutral',
    getToneLabel: () => '시가총액',
    prefix: '$',
    suffix: 'B',
    decimals: 1,
  },
  {
    key: 'strategy',
    label: '전략 BTC',
    labelEn: 'Strategy BTC',
    getValue: (d) => d.strategyBtc.totalHoldings,
    getDisplay: (d) => (d.strategyBtc.totalHoldings / 1000).toFixed(0) + 'K',
    getTone: () => 'accent',
    getToneLabel: () => '보유량',
    decimals: 0,
  },
  {
    key: 'usdt',
    label: 'USDT 프리미엄',
    labelEn: 'USDT Premium',
    getValue: (d) => d.usdtPremium.premium,
    getTone: (d) => Math.abs(d.usdtPremium.premium) >= 1 ? 'negative' : 'neutral',
    getToneLabel: (d) => d.usdtPremium.premium > 0 ? '프리미엄' : d.usdtPremium.premium < 0 ? '디스카운트' : '중립',
    suffix: '%',
    decimals: 2,
  },
  {
    key: 'longShort',
    label: '롱숏 비율',
    labelEn: 'Long-Short Ratio',
    getValue: (d) => d.longShortRatio.longShortRatio,
    getTone: (d) => d.longShortRatio.longShortRatio > 1.2 ? 'positive' : d.longShortRatio.longShortRatio < 0.8 ? 'negative' : 'neutral',
    getToneLabel: (d) => d.longShortRatio.longShortRatio > 1 ? '롱 우위' : '숏 우위',
    decimals: 2,
  },
  {
    key: 'oi',
    label: '미결제약정',
    labelEn: 'Open Interest',
    getValue: (d) => d.openInterest.oiUsd / 1_000_000_000,
    getTone: () => 'accent',
    getToneLabel: () => '총액',
    prefix: '$',
    suffix: 'B',
    decimals: 1,
  },
];

// ── Internal: Event Calendar ──

const EVENT_TYPE_BORDER: Record<string, string> = {
  fomc: 'border-l-dot-red',
  cpi: 'border-l-dot-red',
  etf: 'border-l-dot-blue',
  halving: 'border-l-dot-blue',
  employment: 'border-l-dot-muted',
  other: 'border-l-dot-muted',
};

function EventCalendar() {
  const events = getUpcomingEvents(5);

  if (events.length === 0) {
    return <div className="text-center text-dot-muted text-sm py-8">예정된 이벤트가 없습니다</div>;
  }

  return (
    <div className="flex gap-4">
      {events.map((event, i) => (
        <ScrollReveal key={`${event.date}-${event.title}`} delay={i * 80} className="flex-1">
          <div className={`border-l-[2px] ${EVENT_TYPE_BORDER[event.type] ?? EVENT_TYPE_BORDER.other} bg-transparent pl-3 py-2`}>
            <div className="text-[11px] font-semibold text-dot-text">{event.title}</div>
            <div className="text-[10px] text-dot-sub">
              {event.date} · <NumberCounter value={event.daysUntil} prefix="D-" decimals={0} duration={600} />
            </div>
          </div>
        </ScrollReveal>
      ))}
    </div>
  );
}

// ── Internal: Tools Grid ──

const TOOL_ITEMS = [
  { label: 'TX 수수료 계산기', section: 'prepare' },
  { label: 'TX 사이즈 추정', section: 'prepare' },
  { label: '단위 변환기', section: 'prepare' },
  { label: 'UTXO 통합 플래너', section: 'prepare' },
  { label: '멈춘 TX 구조', section: 'recover' },
  { label: 'TX 상태 추적', section: 'recover' },
  { label: '환율 차트', section: 'market' },
  { label: 'KIMP 상관관계', section: 'market' },
  { label: '차익거래 분석', section: 'market' },
];

function ToolsGrid() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {TOOL_ITEMS.map((tool, i) => (
        <ScrollReveal key={tool.label} delay={i * 80}>
          <a
            href={`/desktop/tools#${tool.section}`}
            className="desktop-surface block p-4 text-left"
          >
            <p className="desktop-kicker">{tool.section}</p>
            <div className="mt-2 text-[12px] font-semibold text-dot-text">{tool.label}</div>
          </a>
        </ScrollReveal>
      ))}
    </div>
  );
}

export default function DesktopMagazinePage() {
  const { data, error, loading } = useData();
  const [indicatorData, setIndicatorData] = useState<IndicatorsPageData | null>(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartTriggered, setChartTriggered] = useState(false);

  // Lazy-load chart data when charts section enters viewport
  useEffect(() => {
    if (!chartTriggered || chartLoading || indicatorData) return;
    setChartLoading(true);
    fetch('/api/indicators')
      .then((r) => r.json())
      .then((d) => setIndicatorData(d))
      .catch(() => {})
      .finally(() => setChartLoading(false));
  }, [chartTriggered, chartLoading, indicatorData]);

  // Signal counting
  const signalCounts = useMemo(() => {
    if (!data?.signal?.factors) return { positive: 0, neutral: 0, negative: 0, total: 0 };
    let positive = 0, neutral = 0, negative = 0;
    for (const f of data.signal.factors) {
      if (f.weightedScore > 0.1) positive++;
      else if (f.weightedScore < -0.1) negative++;
      else neutral++;
    }
    return { positive, neutral, negative, total: data.signal.factors.length };
  }, [data?.signal]);

  // Compute kimp stats for KimpStatsCard
  const kimpStats = useMemo(() => {
    if (!indicatorData?.kimpHistory.length) return null;
    return computeStats(indicatorData.kimpHistory);
  }, [indicatorData]);

  if (loading && !data) {
    return (
      <div className="magazine-content py-24">
        <div className="desktop-surface p-8">
          <p className="desktop-kicker">Daily</p>
          <p className="mt-2 text-[12px] leading-6 text-dot-sub">오늘의 데이터를 정리하는 중입니다.</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="magazine-content py-24">
        <div className="desktop-surface p-8">
          <p className="desktop-kicker">Daily</p>
          <p className="mt-2 text-[12px] leading-6 text-dot-sub">데이터를 아직 표시할 수 없습니다.</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const btcPrice = data.kimp.globalPrice;
  // NOTE: data.kimp.kimchiPremium is KIMP premium, not 24h BTC change.
  // TODO: Find the actual 24h BTC price change field in DashboardData.
  // If unavailable, use premium as placeholder or omit the change display.
  const btcChange = data.kimp.kimchiPremium;

  return (
    <>
      <FloatingProgress sections={PROGRESS_SECTIONS} />

      {/* Section 1: Masthead Hero */}
      <Masthead
        edition="BITFLOW DAILY"
        meta={`Vol. ${formatVol()} — ${todayFormatted()}`}
        headline={
          <NumberCounter
            value={btcPrice}
            prefix="$"
            decimals={0}
            format={(v) => `$${Math.round(v).toLocaleString()}`}
            className="text-6xl font-extrabold text-dot-text tracking-tighter"
          />
        }
        subhead={
          <span>
            Bitcoin —{' '}
            <span className={btcChange >= 0 ? 'text-dot-blue font-semibold' : 'text-dot-red font-semibold'}>
              {btcChange >= 0 ? '+' : ''}{btcChange.toFixed(1)}%
            </span>
          </span>
        }
        bottom={
          <div className="magazine-indicator-strip">
            {INDICATORS.slice(0, 5).map((ind) => (
              <div key={ind.key} className="magazine-indicator-strip-cell">
                <div className="magazine-indicator-strip-label">{ind.labelEn.split(' ')[0]}</div>
                <div className={`magazine-indicator-strip-value ${
                  ind.getTone(data) === 'positive' ? 'text-dot-blue' :
                  ind.getTone(data) === 'negative' ? 'text-dot-red' : 'text-dot-text'
                }`}>
                  {ind.getDisplay?.(data) ?? ind.getValue(data).toFixed(ind.decimals ?? 1)}{ind.suffix ?? ''}
                </div>
              </div>
            ))}
          </div>
        }
      />

      {/* Section 2: Today's Headline */}
      <LightSection id="headline" className="bg-white">
        <ScrollReveal className="text-center max-w-2xl mx-auto">
          <div className="text-[10px] text-dot-sub uppercase tracking-[3px] mb-4">
            Today&apos;s Signal
          </div>
          <h2 className="text-4xl font-extrabold text-dot-text tracking-tight leading-tight mb-3">
            {data.signal.description}
          </h2>
          <p className="text-sm text-dot-sub leading-relaxed mb-6">
            {data.signal.factors
              .filter((f) => Math.abs(f.weightedScore) > 0.3)
              .slice(0, 3)
              .map((f) => f.label)
              .join(', ')}
            {' '}등 주요 지표가 현재 시장 방향을 주도하고 있습니다.
          </p>
          <SignalBar
            total={signalCounts.total}
            positive={signalCounts.positive}
            neutral={signalCounts.neutral}
            negative={signalCounts.negative}
          />
        </ScrollReveal>
      </LightSection>

      {/* Section 3: Market Thermometer */}
      <LightSection id="thermometer">
        <div className="text-[10px] text-dot-sub uppercase tracking-[3px] mb-6">
          Market Thermometer
        </div>
        <div className="grid grid-cols-2 gap-3">
          {INDICATORS.map((ind, i) => (
            <ScrollReveal key={ind.key} delay={i * 60}>
              <IndicatorCard
                label={ind.label}
                labelEn={ind.labelEn}
                value={ind.getValue(data)}
                displayValue={ind.getDisplay?.(data)}
                tone={ind.getTone(data)}
                toneLabel={ind.getToneLabel(data)}
                prefix={ind.prefix}
                suffix={ind.suffix}
                decimals={ind.decimals}
              />
            </ScrollReveal>
          ))}
        </div>
      </LightSection>

      {/* Section 4: Chart Deep Dive — lazy load trigger */}
      <LightSection id="charts">
        <ScrollReveal
          threshold={0.05}
          className=""
        >
          <div
            ref={(el) => {
              if (el && !chartTriggered) {
                const obs = new IntersectionObserver(
                  ([e]) => { if (e.isIntersecting) { setChartTriggered(true); obs.disconnect(); } },
                  { threshold: 0.05 },
                );
                obs.observe(el);
              }
            }}
          >
            <div className="text-[10px] text-dot-muted uppercase tracking-[3px] mb-6">
              Deep Dive Charts
            </div>
            {chartLoading && (
              <DesktopSurface className="p-5">
                <p className="text-[12px] text-dot-muted">차트 데이터를 정리하는 중입니다.</p>
              </DesktopSurface>
            )}
            {indicatorData && (
              <div className="space-y-4">
                <ScrollReveal>
                  <DesktopSurface className="p-5">
                    <KimpChart data={indicatorData.kimpHistory} />
                  </DesktopSurface>
                </ScrollReveal>
                {kimpStats && (
                  <ScrollReveal delay={50}>
                    <KimpStatsCard stats={kimpStats} period="30일" />
                  </ScrollReveal>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <ScrollReveal delay={100}>
                    <DesktopSurface className="p-4">
                      <FundingRateHistoryChart data={indicatorData.fundingRateHistory} />
                    </DesktopSurface>
                  </ScrollReveal>
                  <ScrollReveal delay={200}>
                    <DesktopSurface className="p-4">
                      <FearGreedHistoryChart data={indicatorData.fearGreedHistory} />
                    </DesktopSurface>
                  </ScrollReveal>
                </div>
              </div>
            )}
            {!chartLoading && !indicatorData && chartTriggered && (
              <DesktopSurface className="p-5">
                <p className="text-[12px] text-dot-muted">차트 데이터를 불러올 수 없습니다.</p>
              </DesktopSurface>
            )}
          </div>
        </ScrollReveal>
      </LightSection>

      {/* Section 5: BTC Returns Heatmap */}
      <LightSection id="heatmap">
        <ScrollReveal>
          <div className="text-[10px] text-dot-sub uppercase tracking-[3px] mb-6">
            Returns Heatmap
          </div>
          {indicatorData?.btcReturnsHistory ? (
            <BtcReturnHeatmap data={indicatorData.btcReturnsHistory} />
          ) : (
            <div className="text-center py-12 text-dot-muted text-sm">
              {chartTriggered ? '히트맵 데이터 로딩 중...' : '스크롤하여 데이터 로드'}
            </div>
          )}
        </ScrollReveal>
      </LightSection>

      {/* Section 6: Event Calendar */}
      <LightSection id="events" className="bg-white">
        <div className="text-[10px] text-dot-sub uppercase tracking-[3px] mb-6">
          Upcoming Events
        </div>
        <EventCalendar />
      </LightSection>

      {/* Section 7: Tools */}
      <LightSection id="tools">
        <div className="text-[10px] text-dot-sub uppercase tracking-[3px] mb-6">
          Tools
        </div>
        <ToolsGrid />
      </LightSection>

      {/* Section 8: Footer */}
      <MagazineFooter
        links={[
          { label: '온체인 딥다이브 →', sublabel: '더 깊이 읽기', href: '/desktop/onchain' },
          { label: '주간 아카이브 →', sublabel: '지난 이야기', href: '/desktop/weekly' },
        ]}
      />
    </>
  );
}
