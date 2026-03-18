'use client';

import { useEffect, useMemo, useState } from 'react';
import ExchangeRateChart from '@/components/indicators/exchange-rate-chart';
import FearGreedHistoryChart from '@/components/indicators/fear-greed-history-chart';
import FundingRateHistoryChart from '@/components/indicators/funding-rate-history-chart';
import BtcReturnHeatmap from '@/components/indicators/btc-return-heatmap';
import KimpCorrelationChart from '@/components/indicators/kimp-correlation-chart';
import KimpStatsCard from '@/components/indicators/kimp-stats-card';
import KimpChart from '@/components/kimp-chart';
import OrbitalSilence from '@/components/motion/storytelling/OrbitalSilence';
import {
  DesktopBulletList,
  DesktopHero,
  DesktopSectionHeader,
  DesktopStatCard,
  DesktopSurface,
} from '@/components/desktop/desktop-ui';
import { useData } from '@/components/data-provider';
import type {
  ExtendedKimpHistoryPoint,
  IndicatorsPageData,
  KimpStats,
} from '@/lib/types';

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
  const { data, chartData, error, loading, fetchData } = useData();
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
      <DesktopSurface className="flex min-h-[620px] items-center justify-center">
        <OrbitalSilence />
      </DesktopSurface>
    );
  }

  if (error || !data) {
    return (
      <DesktopSurface className="p-12 text-center">
        <p className="desktop-kicker">Load Error</p>
        <h1 className="mt-3 text-[30px] font-semibold tracking-[-0.03em] text-dot-red">히스토리 데이터를 불러올 수 없습니다.</h1>
        <p className="mt-3 text-[14px] leading-7 text-dot-sub">{error ?? '알 수 없는 오류'}</p>
        <button
          type="button"
          onClick={fetchData}
          className="mt-5 inline-flex border border-dot-border bg-white px-4 py-2 text-[12px] font-medium text-dot-accent transition hover:border-dot-accent"
        >
          다시 시도
        </button>
      </DesktopSurface>
    );
  }

  return (
    <div className="space-y-6">
      <DesktopHero
        eyebrow="Historical Research Deck"
        title="히스토리 Desktop"
        description={(
          <>
            과거 차트는 세로 스크롤을 줄이고 비교 밀도를 높이는 쪽으로 재배치했습니다.
            김프, 펀딩비, 심리 지수, 환율, 수익률 히트맵을 넓은 화면에서 바로 이어서 읽을 수 있습니다.
          </>
        )}
        sidebar={(
          <div className="space-y-4">
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

      <div className="grid grid-cols-4 gap-4">
        <DesktopStatCard
          label="김프"
          value="국내 체감 수급"
          detail="국내 시장 온도가 해외 대비 얼마나 뜨거운지 보는 핵심 지표입니다."
        />
        <DesktopStatCard
          label="펀딩비"
          value="파생 포지션 쏠림"
          detail="롱 과열과 숏 압박을 함께 읽는 데 유용합니다."
        />
        <DesktopStatCard
          label="심리"
          value="시장 군중 심리"
          detail="공포탐욕지수와 김프가 같이 움직이는지 비교합니다."
        />
        <DesktopStatCard
          label="히트맵"
          value="계절성 참고"
          detail="월간·분기 수익률을 함께 보면서 현재 구간의 역사적 위치를 가늠합니다."
        />
      </div>

      <div className="min-w-0">
        <KimpChart data={chartData} />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-6">
        <div className="min-w-0">
          {stats ? <KimpStatsCard stats={stats} period="30일" /> : null}
        </div>
        <DesktopSurface className="p-6">
          <DesktopSectionHeader
            eyebrow="Interpretation"
            title="해석 포인트"
            description="히스토리 차트를 읽을 때 같이 봐야 하는 문맥입니다."
          />
          <div className="mt-5">
            <DesktopBulletList
              numbered
              items={[
                '급등 구간에서는 김프와 펀딩비가 동시에 튈 수 있어서, 한 지표만으로 과열을 단정하면 오판할 수 있습니다.',
                '김프 평균 회귀는 환율, 거래소 유동성, 글로벌 변동성과 함께 봐야 의미가 있습니다.',
                '히스토리 페이지는 관측 도구입니다. 실제 진입과 청산 판단은 별도 리스크 기준이 필요합니다.',
              ]}
            />
          </div>
        </DesktopSurface>
      </div>

      {indicatorLoading ? (
        <DesktopSurface className="p-8 text-center text-[14px] text-dot-sub">
          세부 히스토리 데이터를 불러오는 중입니다.
        </DesktopSurface>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-6">
            <div className="min-w-0">
              <FundingRateHistoryChart data={indicatorData?.fundingRateHistory ?? []} />
            </div>
            <div className="min-w-0">
              <FearGreedHistoryChart data={indicatorData?.fearGreedHistory ?? []} />
            </div>
          </div>

          <div className="min-w-0">
            <BtcReturnHeatmap data={indicatorData?.btcReturnsHistory ?? null} />
          </div>

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
        </>
      )}
    </div>
  );
}
