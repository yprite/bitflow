'use client';

import { useState, useEffect, useMemo } from 'react';
import KimpChart from '@/components/kimp-chart';
import OrbitalSilence from '@/components/motion/storytelling/OrbitalSilence';
import { useData } from '@/components/data-provider';
import FundingRateHistoryChart from '@/components/indicators/funding-rate-history-chart';
import FearGreedHistoryChart from '@/components/indicators/fear-greed-history-chart';
import KimpStatsCard from '@/components/indicators/kimp-stats-card';
import ExchangeRateChart from '@/components/indicators/exchange-rate-chart';
import KimpCalendar from '@/components/indicators/kimp-calendar';
import KimpCorrelationChart from '@/components/indicators/kimp-correlation-chart';
import type {
  IndicatorsPageData,
  KimpStats,
  ExtendedKimpHistoryPoint,
} from '@/lib/types';

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
      <div className="flex items-center gap-3">
        <a href="/" className="text-dot-muted hover:text-dot-accent transition text-sm font-mono">← 홈</a>
        <h1 className="text-sm font-semibold text-dot-sub uppercase tracking-wider">지표</h1>
      </div>

      <section className="dot-card p-5 sm:p-6 space-y-3">
        <h2 className="text-xs font-semibold text-dot-accent uppercase tracking-wider">히스토리 읽는 법</h2>
        <p className="text-xs text-dot-sub leading-relaxed">
          이 페이지는 김치프리미엄, 펀딩비, 공포탐욕지수의 시간 흐름을 함께 보여줍니다.
          단순히 숫자를 나열하는 대신 과열 구간, 평균 회귀, 변동성 확대 여부를 한 번에 읽을 수 있도록 설계했습니다.
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="border border-dot-border/60 p-3 dot-grid-sparse">
            <p className="text-[10px] text-dot-muted uppercase tracking-wider">김프</p>
            <p className="text-[11px] text-dot-sub mt-1 leading-relaxed">국내 수급이 해외 대비 얼마나 강한지 보여주는 국내 체감 지표입니다.</p>
          </div>
          <div className="border border-dot-border/60 p-3 dot-grid-sparse">
            <p className="text-[10px] text-dot-muted uppercase tracking-wider">펀딩비</p>
            <p className="text-[11px] text-dot-sub mt-1 leading-relaxed">파생 포지션 한쪽으로 쏠림이 강한지 판단하는 데 유용합니다.</p>
          </div>
          <div className="border border-dot-border/60 p-3 dot-grid-sparse">
            <p className="text-[10px] text-dot-muted uppercase tracking-wider">심리 지수</p>
            <p className="text-[11px] text-dot-sub mt-1 leading-relaxed">시장 심리와 국내 프리미엄이 얼마나 같이 움직이는지 비교할 수 있습니다.</p>
          </div>
        </div>
      </section>

      {/* 1. 기존 김프 히스토리 차트 */}
      <KimpChart data={chartData} />

      {/* 3. 김프 통계 요약 */}
      {stats && <KimpStatsCard stats={stats} period="30일" />}

      {/* 6. 히트맵 캘린더 */}
      {indicatorData && indicatorData.kimpHistory.length > 0 && (
        <KimpCalendar data={indicatorData.kimpHistory} />
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
          <li className="flex items-start gap-2">
            <span className="text-dot-muted/50 font-mono">01</span>
            <span>단기 급등 구간에서는 김프와 펀딩비가 같이 튈 수 있어, 한 지표만 보고 과열을 단정하면 오판할 수 있습니다.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-dot-muted/50 font-mono">02</span>
            <span>김프 평균 회귀는 환율, 거래소 유동성, 글로벌 변동성과 함께 봐야 의미가 있습니다.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-dot-muted/50 font-mono">03</span>
            <span>이 히스토리는 투자 조언이 아니라 관측 도구입니다. 진입과 청산 판단은 별도 리스크 관리 기준이 필요합니다.</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
