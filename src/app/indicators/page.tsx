'use client';

import { useState, useEffect, useMemo } from 'react';
import KimpChart from '@/components/kimp-chart';
import OrbitalSilence from '@/components/motion/storytelling/OrbitalSilence';
import { useData } from '@/components/data-provider';
import FundingRateHistoryChart from '@/components/indicators/funding-rate-history-chart';
import FearGreedHistoryChart from '@/components/indicators/fear-greed-history-chart';
import KimpStatsCard from '@/components/indicators/kimp-stats-card';
import MultiCoinComparisonChart from '@/components/indicators/multi-coin-comparison-chart';
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

            {/* 4. 멀티코인 김프 비교 차트 */}
            <MultiCoinComparisonChart coins={indicatorData.multiCoin} />

            {/* 5. 환율 추이 차트 */}
            <ExchangeRateChart data={indicatorData.kimpHistory} />

            {/* 7. 김프-펀딩비 상관관계 */}
            <KimpCorrelationChart
              kimpData={indicatorData.kimpHistory}
              fundingData={indicatorData.fundingRateHistory}
            />
          </>
        )
      )}
    </div>
  );
}
