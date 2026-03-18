'use client';

import { useState, useEffect, useMemo } from 'react';
import KimpChart from '@/components/kimp-chart';
import OrbitalSilence from '@/components/motion/storytelling/OrbitalSilence';
import DotAssemblyReveal from '@/components/motion/transitions/DotAssemblyReveal';
import { useData } from '@/components/data-provider';
import FundingRateHistoryChart from '@/components/indicators/funding-rate-history-chart';
import FearGreedHistoryChart from '@/components/indicators/fear-greed-history-chart';
import KimpStatsCard from '@/components/indicators/kimp-stats-card';
import ExchangeRateChart from '@/components/indicators/exchange-rate-chart';
import BtcReturnHeatmap from '@/components/indicators/btc-return-heatmap';
import KimpCorrelationChart from '@/components/indicators/kimp-correlation-chart';
import GuideModal from '@/components/guide-modal';
import PageHeader from '@/components/page-header';
import type {
  IndicatorsPageData,
  KimpStats,
  ExtendedKimpHistoryPoint,
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

const cautions = [
  '단기 급등 구간에서는 김프와 펀딩비가 같이 튈 수 있어, 한 지표만 보고 과열을 단정하면 오판할 수 있습니다.',
  '김프 평균 회귀는 환율, 거래소 유동성, 글로벌 변동성과 함께 봐야 의미가 있습니다.',
  '히스토리 페이지는 투자 조언이 아니라 관측 도구입니다. 진입과 청산 판단은 별도 리스크 관리 기준이 필요합니다.',
];

function computeStats(data: ExtendedKimpHistoryPoint[]): KimpStats | null {
  if (data.length < 2) return null;
  const values = data.map((d) => d.value);
  const n = values.length;
  const avg = values.reduce((a, b) => a + b, 0) / n;
  const sorted = [...values].sort((a, b) => a - b);
  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
  const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);

  return {
    avg,
    min: Math.min(...values),
    max: Math.max(...values),
    stdDev,
    median,
    current: values[values.length - 1],
    dataPoints: n,
  };
}

function IndicatorsGuideContent() {
  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
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

      <div className="rounded-sm border border-dot-border/40 bg-white/70 p-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-dot-accent">
          해석할 때 주의할 점
        </h3>
        <ul className="mt-2 space-y-2 text-[11px] leading-relaxed text-dot-sub">
          {cautions.map((item, index) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-dot-muted/50 font-mono">{String(index + 1).padStart(2, '0')}</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default function IndicatorsPage() {
  const { data, chartData, error, loading, fetchData } = useData();
  const [indicatorData, setIndicatorData] = useState<IndicatorsPageData | null>(null);
  const [indicatorLoading, setIndicatorLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadIndicators() {
      try {
        const res = await fetch('/api/indicators');
        if (!res.ok) return;
        const json: IndicatorsPageData = await res.json();
        if (!cancelled) setIndicatorData(json);
      } catch {
        // silently fail - main data is still available
      } finally {
        if (!cancelled) setIndicatorLoading(false);
      }
    }
    loadIndicators();
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => {
    if (indicatorData?.kimpHistory.length) {
      return computeStats(indicatorData.kimpHistory);
    }
    return null;
  }, [indicatorData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <OrbitalSilence />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-dot-red text-lg mb-2">{error}</p>
          <button
            onClick={fetchData}
            className="text-sm text-dot-sub hover:text-dot-accent transition px-4 py-2 border-2 border-dot-border hover:border-dot-accent"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-5">
      <DotAssemblyReveal delay={0} duration={520} density="low">
        <PageHeader
          variant="card"
          eyebrow="과거 흐름"
          title="히스토리"
          description={(
            <span>
              김프와 파생 심리, 평균 회귀 구간을 한 화면에서 읽기 위한 과거 데이터 페이지입니다.
            </span>
          )}
          action={(
            <GuideModal
              title="히스토리 읽는 법"
              eyebrow="Indicator History"
              triggerLabel="읽는 법"
              maxWidthClassName="max-w-5xl"
              triggerClassName="inline-flex rounded-sm border border-dot-border/60 bg-white/75 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.16em] text-dot-sub transition hover:border-dot-accent/50 hover:text-dot-accent"
              intro={(
                <>
                  이 페이지는 김치프리미엄, 펀딩비, 공포탐욕지수의 시간 흐름을 함께 보여줍니다.
                  단순히 숫자를 나열하는 대신
                  <span className="font-medium text-dot-accent"> 과열 구간, 평균 회귀, 환율 영향, 변동성 확대 여부</span>
                  를 한 번에 읽을 수 있도록 설계했습니다.
                </>
              )}
            >
              <IndicatorsGuideContent />
            </GuideModal>
          )}
        />
      </DotAssemblyReveal>

      {/* 1. 기존 김프 히스토리 차트 */}
      <KimpChart data={chartData} />

      {/* 3. 김프 통계 요약 */}
      {stats && <KimpStatsCard stats={stats} period="30일" />}

      {/* 6. BTC 월간/분기 수익률 */}
      {indicatorLoading ? (
        <div className="dot-card p-6">
          <p className="text-dot-muted text-sm text-center">비트코인 수익률 데이터 로딩 중...</p>
        </div>
      ) : (
        <BtcReturnHeatmap data={indicatorData?.btcReturnsHistory ?? null} />
      )}

      {/* 1. 펀딩비 히스토리 차트 */}
      {indicatorLoading ? (
        <div className="dot-card p-6">
          <p className="text-dot-muted text-sm text-center">지표 데이터 로딩 중...</p>
        </div>
      ) : (
        indicatorData && (
          <>
            <FundingRateHistoryChart data={indicatorData.fundingRateHistory} />

            {/* 2. 공포탐욕지수 히스토리 차트 */}
            <FearGreedHistoryChart data={indicatorData.fearGreedHistory} />

            {/* 4. 환율 추이 차트 */}
            <ExchangeRateChart data={indicatorData.kimpHistory} />

            {/* 5. 김프-펀딩비 상관관계 */}
            <KimpCorrelationChart
              kimpData={indicatorData.kimpHistory}
              fundingData={indicatorData.fundingRateHistory}
            />
          </>
        )
      )}

      <section className="dot-card p-5 sm:p-6 space-y-3">
        <h2 className="text-xs font-semibold text-dot-accent uppercase tracking-wider">해석할 때 주의할 점</h2>
        <ul className="space-y-2 text-xs text-dot-sub leading-relaxed">
          {cautions.map((item, index) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-dot-muted/50 font-mono">{String(index + 1).padStart(2, '0')}</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
