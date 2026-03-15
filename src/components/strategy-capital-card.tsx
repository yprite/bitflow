'use client';

import type { StrategyCapitalData, StrategyCapitalEstimateDay } from '@/lib/types';
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

function formatEstimatedBtc(value: number): string {
  return `~${value.toLocaleString('en-US', {
    minimumFractionDigits: value >= 100 ? 0 : 1,
    maximumFractionDigits: value >= 100 ? 0 : 1,
  })} BTC`;
}

function RecentTrendSparkline({ days }: { days: StrategyCapitalEstimateDay[] }) {
  if (days.length < 2) {
    return (
      <div className="rounded-sm border border-dashed border-dot-border/30 bg-white/70 px-3 py-2 text-[11px] text-dot-muted">
        최근 추세를 그릴 만큼 데이터가 아직 충분하지 않습니다.
      </div>
    );
  }

  const values = days.map((day) => day.estimatedBtc);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = days
    .map((day, index) => {
      const x = (index / (days.length - 1)) * 100;
      const y = 100 - ((day.estimatedBtc - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');
  const area = `0,100 ${points} 100,100`;

  return (
    <div className="space-y-2">
      <div className="h-16 rounded-sm border border-dot-border/30 bg-white/70 p-2">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
          <polygon points={area} fill="rgba(39, 86, 73, 0.08)" />
          <polyline
            points={points}
            fill="none"
            stroke="#275649"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <div className="flex items-center justify-between text-[10px] font-mono text-dot-muted">
        <span>{formatDate(days[0]?.date ?? null)}</span>
        <span>{formatDate(days.at(-1)?.date ?? null)}</span>
      </div>
    </div>
  );
}

export default function StrategyCapitalCard({ data, dayRange }: StrategyCapitalCardProps) {
  const status = getStatusMeta(data);
  const latestDay = data.currentDay;
  const eligiblePct = latestDay ? latestDay.eligibleRatio * 100 : 0;
  const dotCount = Math.min(Math.max(Math.round((eligiblePct / 100) * 8), 0), 8);
  const latestConfirmedBtc = data.latestConfirmed?.estimatedBtc ?? 0;
  const recentDays = [...data.recentDays].reverse();
  const recentEstimatedBtc = recentDays.reduce((total, day) => total + day.estimatedBtc, 0);

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
        {recentDays.length > 0 && (
          <div className="mt-4 space-y-3 border-t border-dashed border-dot-border/20 pt-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] uppercase tracking-[0.18em] text-dot-muted">
                최근 5일 추정
              </span>
              <span className="text-[10px] font-mono text-dot-sub">
                누적 {formatEstimatedBtc(recentEstimatedBtc)}
              </span>
            </div>
            <RecentTrendSparkline days={recentDays} />
            <div className="space-y-1.5">
              {recentDays.map((day) => (
                <div
                  key={day.date}
                  className="flex items-center justify-between gap-3 rounded-sm border border-dot-border/20 bg-white/60 px-2.5 py-1.5 text-[10px] font-mono"
                >
                  <span className="text-dot-sub">{formatDate(day.date)}</span>
                  <span className="text-dot-muted">적격 {Math.round(day.eligibleRatio * 100)}%</span>
                  <span className="text-dot-text">{formatEstimatedBtc(day.estimatedBtc)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {dayRange && dayRange.min !== dayRange.max && (
          <DayRangeSlider range={dayRange} decimals={0} suffix=" BTC" />
        )}
        <p className="dot-insight">{getInsight(data)}</p>
      </div>
    </div>
  );
}
