'use client';

import { useEffect, useMemo, useState } from 'react';
import ExchangeRateChart from '@/components/indicators/exchange-rate-chart';
import FearGreedHistoryChart from '@/components/indicators/fear-greed-history-chart';
import FundingRateHistoryChart from '@/components/indicators/funding-rate-history-chart';
import BtcReturnHeatmap from '@/components/indicators/btc-return-heatmap';
import KimpCorrelationChart from '@/components/indicators/kimp-correlation-chart';
import KimpStatsCard from '@/components/indicators/kimp-stats-card';
import KimpChart from '@/components/kimp-chart';
import DotAssemblyReveal from '@/components/motion/transitions/DotAssemblyReveal';
import {
  DesktopHero,
  DesktopStatCard,
  DesktopSurface,
} from '@/components/desktop/desktop-ui';
import { useData } from '@/components/data-provider';
import type {
  ExtendedKimpHistoryPoint,
  IndicatorsPageData,
  KimpStats,
} from '@/lib/types';

const readingSteps = [
  {
    title: '1. 먼저 김프 흐름',
    body: '김프 차트와 통계 카드로 현재 값이 최근 평균 대비 어느 위치인지 먼저 확인합니다.',
  },
  {
    title: '2. 다음은 펀딩비 / 심리',
    body: '파생 포지션 쏠림과 공포탐욕지수를 같이 보면서, 과열이 현물 체감과 동행하는지 확인합니다.',
  },
  {
    title: '3. 환율과 상관관계',
    body: '김프 변화가 환율 때문인지, 국내 수급 때문인지 구분하려면 환율 차트와 상관관계 차트를 같이 봐야 합니다.',
  },
  {
    title: '4. 마지막은 수익률 히트맵',
    body: '월간·분기 수익률 히트맵으로 현재 구간이 역사적으로 어떤 계절성과 변동성 구간인지 비교합니다.',
  },
];

const indicatorGuides = [
  {
    title: '김치프리미엄',
    body: '국내 수급이 해외 대비 얼마나 강한지 보여주는 국내 체감 지표입니다. 평균 회귀가 빠른 구간인지 같이 봐야 합니다.',
  },
  {
    title: '펀딩비',
    body: '파생 포지션이 한쪽으로 과도하게 쏠렸는지 읽는 데 유용합니다. 급등장에서 김프와 동시에 튈 수 있습니다.',
  },
  {
    title: '공포탐욕지수',
    body: '시장 심리 과열 여부를 보여줍니다. 국내 프리미엄과 같이 오르면 군중 심리가 더 강하게 반영될 수 있습니다.',
  },
  {
    title: '환율 / 상관관계',
    body: '김프가 정말 국내 수급 신호인지, 환율 영향이 섞였는지 분해해서 보는 용도입니다.',
  },
];

function IndicatorsGuideContent() {
  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2">
        {readingSteps.map((step) => (
          <div key={step.title} className="border border-dot-border/60 p-3 dot-grid-sparse">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">{step.title}</p>
            <p className="mt-2 text-[11px] leading-relaxed text-dot-sub">{step.body}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {indicatorGuides.map((guide) => (
          <div key={guide.title} className="border border-dot-border/60 p-3 dot-grid-sparse">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">{guide.title}</p>
            <p className="mt-2 text-[11px] leading-relaxed text-dot-sub">{guide.body}</p>
          </div>
        ))}
      </div>
    </>
  );
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

export default function DesktopIndicatorsPage() {
  const { data, chartData, error, loading } = useData();
  const [indicatorData, setIndicatorData] = useState<IndicatorsPageData | null>(null);
  const [indicatorLoading, setIndicatorLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadIndicators() {
      try {
        const response = await fetch('/api/indicators');
        if (!response.ok) return;
        const json: IndicatorsPageData = await response.json();
        if (!cancelled) {
          setIndicatorData(json);
        }
      } catch {
        // ignore - main page can still render without deep history data
      } finally {
        if (!cancelled) {
          setIndicatorLoading(false);
        }
      }
    }

    loadIndicators();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    if (!indicatorData?.kimpHistory.length) return null;
    return computeStats(indicatorData.kimpHistory);
  }, [indicatorData]);

  if (loading) {
    return (
      <DesktopSurface className="p-8">
        <p className="desktop-kicker">History</p>
        <p className="mt-2 text-[12px] leading-6 text-dot-sub">히스토리 데이터를 정리하는 중입니다.</p>
      </DesktopSurface>
    );
  }

  if (error || !data) {
    return (
      <DesktopSurface className="p-8">
        <p className="desktop-kicker">History</p>
        <h1 className="mt-2 text-[18px] font-semibold tracking-[-0.02em] text-dot-accent">히스토리 데이터를 아직 표시할 수 없습니다.</h1>
        <p className="mt-2 text-[12px] leading-6 text-dot-sub">{error ?? '잠시 후 다시 자동 갱신됩니다.'}</p>
      </DesktopSurface>
    );
  }

  return (
    <div className="space-y-6">
      <DotAssemblyReveal delay={0} duration={500} density="low">
        <DesktopHero
          eyebrow="Historical Research Deck"
          title="히스토리"
          description={(
            <>
              과거 차트는 비교를 위해 모아 두되, 한 화면에서 모두 설명하려고 하지 않습니다.
              김프의 위치를 먼저 보고, 이어서 펀딩비와 심리, 환율과 히트맵으로 넘어가는 읽기 순서를 유지합니다.
            </>
          )}
          action={<IndicatorsGuideContent />}
          sidebar={(
            <div className="space-y-3">
              <DesktopStatCard label="현재 김프" value={`${data.kimp.kimchiPremium.toFixed(2)}%`} />
              <DesktopStatCard label="현재 공포탐욕" value={data.fearGreed.value} />
              <DesktopStatCard label="차트 포인트" value={chartData.length} tone="neutral" />
              <DesktopStatCard
                label="30일 평균"
                value={data.avg30d !== null ? `${data.avg30d.toFixed(2)}%` : '—'}
                tone="neutral"
              />
            </div>
          )}
        />
      </DotAssemblyReveal>

      <DotAssemblyReveal delay={100} duration={700}>
        <div className="min-w-0">
          <KimpChart data={chartData} />
        </div>
      </DotAssemblyReveal>

      {stats && (
        <DotAssemblyReveal delay={200} duration={700}>
          <div className="min-w-0">
            <KimpStatsCard stats={stats} period="30일" />
          </div>
        </DotAssemblyReveal>
      )}

      {indicatorLoading ? (
        <DesktopSurface className="p-6">
          <p className="desktop-kicker">History</p>
          <p className="mt-2 text-[12px] leading-6 text-dot-sub">세부 히스토리 데이터를 정리하는 중입니다.</p>
        </DesktopSurface>
      ) : (
        <>
          <DotAssemblyReveal delay={300} duration={700}>
            <div className="grid grid-cols-2 gap-6">
              <div className="min-w-0">
                <FundingRateHistoryChart data={indicatorData?.fundingRateHistory ?? []} />
              </div>
              <div className="min-w-0">
                <FearGreedHistoryChart data={indicatorData?.fearGreedHistory ?? []} />
              </div>
            </div>
          </DotAssemblyReveal>

          <DotAssemblyReveal delay={400} duration={700}>
            <div className="min-w-0">
              <BtcReturnHeatmap data={indicatorData?.btcReturnsHistory ?? null} />
            </div>
          </DotAssemblyReveal>

          <DotAssemblyReveal delay={500} duration={700}>
            <div className="grid grid-cols-2 gap-6">
              <div className="min-w-0">
                <ExchangeRateChart data={indicatorData?.kimpHistory ?? []} />
              </div>
              <div className="min-w-0">
                <KimpCorrelationChart
                  kimpData={indicatorData?.kimpHistory ?? []}
                  fundingData={indicatorData?.fundingRateHistory ?? []}
                />
              </div>
            </div>
          </DotAssemblyReveal>
        </>
      )}
    </div>
  );
}
