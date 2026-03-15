'use client';

import type { StrategyCapitalData } from '@/lib/types';
import type { DayRange } from './data-provider';
import DotGauge from './motion/indicators/DotGauge';
import DotKPIValue from './motion/typography/DotKPIValue';
import LivePulse from './motion/indicators/LivePulse';
import DayRangeSlider from './day-range-slider';

interface StrategyCapitalCardProps {
  data: StrategyCapitalData;
  dayRange?: DayRange | null;
}

function formatUsd(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return `$${value.toFixed(0)}`;
}

function formatDate(value: string | null): string {
  if (!value) return 'N/A';

  const parsed = value.includes('-')
    ? new Date(`${value}T00:00:00Z`)
    : new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function getStatusMeta(data: StrategyCapitalData) {
  if (data.status === 'active') {
    return { label: 'ACTIVE', color: '#00c853' };
  }

  if (data.status === 'standby') {
    return { label: 'STANDBY', color: '#f59e0b' };
  }

  return { label: 'N/A', color: '#6b7280' };
}

function getInsight(data: StrategyCapitalData): string {
  if (data.currentWeekEstimatedBtc >= 3000) {
    return 'STRC ATM 엔진 강하게 가동 중 — 이번 주 Strategy 매수 재원 확대 추정';
  }

  if (data.currentWeekEstimatedBtc > 0) {
    return 'STRC 엔진 가동 흔적 존재 — 장중 적격 거래량과 최신 filing을 함께 확인';
  }

  if ((data.latestConfirmed?.netProceedsUsd ?? 0) >= 100_000_000) {
    return '최근 filing은 강했지만 현재는 임계가 하회 — 자본엔진 대기 구간';
  }

  if (data.distanceToThreshold < 0) {
    return 'STRC 가격이 ATM 임계가 아래 — 신규 자금 조달은 제한적';
  }

  return 'STRC 자본엔진 데이터 부족 — 다음 filing 또는 장중 거래 재확인 필요';
}

export default function StrategyCapitalCard({ data, dayRange }: StrategyCapitalCardProps) {
  const status = getStatusMeta(data);
  const latestDay = data.currentDay;
  const eligiblePct = latestDay ? latestDay.eligibleRatio * 100 : 0;
  const dotCount = Math.min(Math.max(Math.round((eligiblePct / 100) * 8), 0), 8);
  const latestConfirmedBtc = data.latestConfirmed?.estimatedBtc ?? 0;

  return (
    <div className="dot-card p-4 sm:p-5">
      <div className="dot-card-inner">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <LivePulse size={4} />
          STRC 자본엔진
        </h2>
        <DotKPIValue
          value={data.currentWeekEstimatedBtc}
          decimals={0}
          suffix=" BTC"
          showSign={false}
          colorBySentiment={false}
          color={status.color}
          fontScale={4.5}
          morphMode="crossfade"
          morphDuration={400}
        />
        <div className="mt-2 mb-3">
          <DotGauge
            activeDots={dotCount}
            max={8}
            activeColor={status.color}
          />
        </div>
        <div className="space-y-1 text-xs text-dot-muted font-mono">
          <p>상태: <span style={{ color: status.color }}>{status.label}</span> / 임계가 거리: {data.distanceToThreshold >= 0 ? '+' : ''}{data.distanceToThreshold.toFixed(2)}$</p>
          <p>최근 세션: {latestDay ? `~${latestDay.estimatedBtc.toFixed(2)} BTC / 적격 ${eligiblePct.toFixed(0)}%` : 'N/A'}</p>
          <p>최근 filing: {data.latestConfirmed ? `${formatDate(data.latestConfirmed.filedDate)} / ${formatUsd(data.latestConfirmed.netProceedsUsd)} / ~${latestConfirmedBtc.toFixed(0)} BTC` : 'N/A'}</p>
          <p>누적 확인: ~{data.confirmedTotalEstimatedBtc.toFixed(0)} BTC / 수익률: {data.currentYield.toFixed(2)}%</p>
          <p>다음 배당 기준일: {formatDate(data.exDividendDate)}</p>
        </div>
        {dayRange && dayRange.min !== dayRange.max && (
          <DayRangeSlider range={dayRange} decimals={0} suffix=" BTC" />
        )}
        <p className="dot-insight">{getInsight(data)}</p>
      </div>
    </div>
  );
}
