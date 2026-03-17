'use client';

import type { StrategyBtcData, StrategyCapitalData, StrategyCapitalEstimateDay } from '@/lib/types';
import type { DayRange } from './data-provider';
import DotGauge from './motion/indicators/DotGauge';
import DotKPIValue from './motion/typography/DotKPIValue';
import LivePulse from './motion/indicators/LivePulse';
import DayRangeSlider from './day-range-slider';

interface MicroStrategyCardProps {
  btcData: StrategyBtcData;
  capitalData: StrategyCapitalData;
  btcRange?: DayRange | null;
  capitalRange?: DayRange | null;
}

function formatUsdCompact(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  return `$${value.toFixed(0)}`;
}

function formatDate(value: string | null): string {
  if (!value) return 'N/A';

  const parsed = value.length > 10
    ? new Date(value)
    : new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function formatEstimatedBtc(value: number): string {
  return `~${value.toLocaleString('en-US', {
    minimumFractionDigits: value >= 100 ? 0 : 1,
    maximumFractionDigits: value >= 100 ? 0 : 1,
  })} BTC`;
}

function getCapitalStatusMeta(data: StrategyCapitalData) {
  if (data.status === 'active') {
    return { label: 'ACTIVE', color: '#00c853' };
  }

  if (data.status === 'standby') {
    return { label: 'STANDBY', color: '#f59e0b' };
  }

  return { label: 'N/A', color: '#6b7280' };
}

function getMicroStrategyInsight(btcData: StrategyBtcData, capitalData: StrategyCapitalData): string {
  const confirmedNetProceeds = capitalData.latestConfirmed?.netProceedsUsd ?? 0;

  if (btcData.holdingsChange > 0 && capitalData.currentWeekEstimatedBtc >= 1000) {
    return 'MSTR 보유 증가와 STRC 자본엔진 가동이 동시에 포착됨 — 마이크로스트레티지 매수 모멘텀 강화';
  }

  if (btcData.holdingsChange > 0) {
    return 'MSTR 보유량 증가가 확인됨 — STRC보다 실제 축적 신호가 우선 반영되는 구간';
  }

  if (capitalData.currentWeekEstimatedBtc >= 1000 || confirmedNetProceeds >= 100_000_000) {
    return 'STRC 엔진이 먼저 뜨거워지는 구간 — 아직 보유량 변화 전이라도 매수 재원 확대 가능성 점검';
  }

  if (capitalData.distanceToThreshold < 0) {
    return 'STRC 가격이 임계가 아래라 신규 자금 조달은 제한적 — MSTR 보유 변화도 함께 관찰 필요';
  }

  return 'MSTR 보유 변화와 STRC 자본엔진 모두 중립권 — 다음 공시와 장중 거래를 함께 확인할 구간';
}

function RecentTrendSparkline({ days }: { days: StrategyCapitalEstimateDay[] }) {
  if (days.length < 2) {
    return (
      <div className="rounded-sm border border-dashed border-dot-border/30 bg-white/70 px-3 py-2 text-[11px] text-dot-muted">
        최근 STRC 추세를 그릴 만큼 데이터가 아직 충분하지 않습니다.
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

export default function MicroStrategyCard({
  btcData,
  capitalData,
  btcRange,
  capitalRange,
}: MicroStrategyCardProps) {
  const capitalStatus = getCapitalStatusMeta(capitalData);
  const mstrColor =
    btcData.holdingsChange > 0 ? '#00c853' : btcData.holdingsChange < 0 ? '#e53935' : '#6b7280';
  const mstrDotCount = btcData.holdingsChange === 0
    ? 0
    : Math.min(Math.max(Math.round(Math.abs(btcData.changeRate) * 4), 1), 8);
  const latestCapitalDay = capitalData.currentDay;
  const eligiblePct = latestCapitalDay ? latestCapitalDay.eligibleRatio * 100 : 0;
  const capitalDotCount = Math.min(Math.max(Math.round((eligiblePct / 100) * 8), 0), 8);
  const latestConfirmedBtc = capitalData.latestConfirmed?.estimatedBtc ?? 0;
  const recentDays = [...capitalData.recentDays].reverse();
  const recentEstimatedBtc = recentDays.reduce((total, day) => total + day.estimatedBtc, 0);

  return (
    <div className="dot-card p-4 sm:p-5">
      <div className="dot-card-inner">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <LivePulse size={4} />
          마이크로스트레티지
        </h2>
        <p className="text-[11px] text-dot-muted leading-relaxed">
          MSTR 보유 변화와 STRC 자본엔진을 하나의 복합 팩터로 합산해 표시합니다.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <section className="rounded-sm border border-dot-border/20 bg-white/65 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] uppercase tracking-[0.18em] text-dot-muted">
                MSTR 보유 변화
              </span>
              <span className="text-[10px] font-mono text-dot-sub">
                {formatDate(btcData.timestamp)}
              </span>
            </div>
            <div className="mt-2">
              <DotKPIValue
                value={btcData.changeRate}
                decimals={2}
                suffix="%"
                showSign
                colorBySentiment={false}
                color={mstrColor}
                fontScale={4.2}
                morphMode="crossfade"
                morphDuration={400}
              />
            </div>
            <div className="mt-2 mb-3">
              <DotGauge
                activeDots={mstrDotCount}
                max={8}
                activeColor={mstrColor}
              />
            </div>
            <div className="space-y-1 text-xs font-mono text-dot-muted">
              <p>최근 변화: {btcData.holdingsChange >= 0 ? '+' : ''}{btcData.holdingsChange.toLocaleString()} BTC</p>
              <p>총 보유: {btcData.totalHoldings.toLocaleString()} BTC</p>
              <p>평가액: {formatUsdCompact(btcData.currentValueUsd)}</p>
              <p>공급 비중: {btcData.supplyPercentage.toFixed(3)}%</p>
            </div>
            {btcRange && btcRange.min !== btcRange.max && (
              <DayRangeSlider range={btcRange} decimals={2} suffix="%" />
            )}
          </section>

          <section className="rounded-sm border border-dot-border/20 bg-white/65 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] uppercase tracking-[0.18em] text-dot-muted">
                STRC 자본엔진
              </span>
              <span className="text-[10px] font-mono" style={{ color: capitalStatus.color }}>
                {capitalStatus.label}
              </span>
            </div>
            <div className="mt-2">
              <DotKPIValue
                value={capitalData.currentWeekEstimatedBtc}
                decimals={0}
                suffix=" BTC"
                showSign={false}
                colorBySentiment={false}
                color={capitalStatus.color}
                fontScale={4.2}
                morphMode="crossfade"
                morphDuration={400}
              />
            </div>
            <div className="mt-2 mb-3">
              <DotGauge
                activeDots={capitalDotCount}
                max={8}
                activeColor={capitalStatus.color}
              />
            </div>
            <div className="space-y-1 text-xs font-mono text-dot-muted">
              <p>임계가 거리: {capitalData.distanceToThreshold >= 0 ? '+' : ''}{capitalData.distanceToThreshold.toFixed(2)}$</p>
              <p>최근 세션: {latestCapitalDay ? `${formatEstimatedBtc(latestCapitalDay.estimatedBtc)} / 적격 ${eligiblePct.toFixed(0)}%` : 'N/A'}</p>
              <p>최근 filing: {capitalData.latestConfirmed ? `${formatDate(capitalData.latestConfirmed.filedDate)} / ${formatUsdCompact(capitalData.latestConfirmed.netProceedsUsd)} / ~${latestConfirmedBtc.toFixed(0)} BTC` : 'N/A'}</p>
              <p>누적 확인: ~{capitalData.confirmedTotalEstimatedBtc.toFixed(0)} BTC</p>
            </div>
            {capitalRange && capitalRange.min !== capitalRange.max && (
              <DayRangeSlider range={capitalRange} decimals={0} suffix=" BTC" />
            )}
          </section>
        </div>

        {recentDays.length > 0 && (
          <div className="mt-4 space-y-3 border-t border-dashed border-dot-border/20 pt-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] uppercase tracking-[0.18em] text-dot-muted">
                최근 5일 STRC 추정
              </span>
              <span className="text-[10px] font-mono text-dot-sub">
                누적 {formatEstimatedBtc(recentEstimatedBtc)}
              </span>
            </div>
            <RecentTrendSparkline days={recentDays} />
          </div>
        )}

        <p className="dot-insight">{getMicroStrategyInsight(btcData, capitalData)}</p>
      </div>
    </div>
  );
}
