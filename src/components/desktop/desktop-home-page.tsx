'use client';

import { useState, useEffect, type ReactNode, type WheelEvent } from 'react';
import EventStrip from '@/components/event-strip';
import HomeIntroModal from '@/components/home-intro-modal';
import { getUpcomingEvents } from '@/lib/events';
import SignalBadge from '@/components/signal-badge';
import type { DashboardData } from '@/lib/types';
import type { DayRange } from '@/components/data-provider';
import {
  DesktopHero,
  DesktopLinkCard,
  DesktopSectionHeader,
  DesktopStatCard,
  DesktopSurface,
} from '@/components/desktop/desktop-ui';
import { useData } from '@/components/data-provider';
import { SITE_CONTACT_EMAIL, SITE_BASE_URL } from '@/lib/site';
import { applyMarketTempWheelGuard } from '@/lib/market-temp-scroll-guard';

const overviewCards = [
  {
    eyebrow: 'On-chain',
    title: '온체인 모니터',
    body: '네트워크 압력, 고래 이동, 활동 공급, 지지 저항 해석을 데스크톱 밀도로 재배치했습니다.',
    href: '/desktop/onchain',
    label: '온체인 열기',
  },
  {
    eyebrow: 'Research',
    title: '주간 리포트와 히스토리',
    body: '리포트 아카이브, 히스토리 차트, 도구 모음을 PC 탐색 흐름으로 분리했습니다.',
    href: '/desktop/weekly',
    label: '리포트 열기',
  },
  {
    eyebrow: 'Utility',
    title: '도구',
    body: 'BTC 전송 준비, 수수료 계산, 막힌 거래 복구, UTXO 정리, 재정거래 판단 도구 모음입니다.',
    href: '/desktop/tools',
    label: '도구 열기',
  },
] as const;

const introCards = [
  {
    title: '온체인과 흐름 해석',
    body: '가격만 보지 않고 수수료 혼잡도, 고래 이동, 거래소 순유입, 활동 공급 비중까지 같이 확인할 수 있습니다.',
    href: '/desktop/onchain',
    label: '온체인 보기',
  },
  {
    title: '주간 리포트와 도구',
    body: '이번 주 핵심 리포트, BTC 전송 실무 도구, 차익 계산기까지 한국 사용자 기준으로 이어서 탐색할 수 있습니다.',
    href: '/desktop/weekly',
    label: '주간 리포트 보기',
  },
] as const;

// 클릭 가능한 지표 카드 정의
type IndicatorKey = 'kimp' | 'funding' | 'fearGreed' | 'usdt' | 'dominance' | 'longShort' | 'oi' | 'liquidation' | 'stablecoin' | 'volume' | 'strategy';

interface IndicatorDef {
  key: IndicatorKey;
  label: string;
}

const INDICATORS_ROW1: IndicatorDef[] = [
  { key: 'fearGreed', label: '공포탐욕' },
  { key: 'dominance', label: 'BTC 도미넌스' },
  { key: 'liquidation', label: '청산 비율' },
  { key: 'volume', label: '거래량 변화' },
  { key: 'stablecoin', label: '스테이블코인' },
  { key: 'strategy', label: '스트레티지' },
];

const INDICATORS_ROW2: IndicatorDef[] = [
  { key: 'kimp', label: '김치프리미엄' },
  { key: 'funding', label: '펀딩비' },
  { key: 'usdt', label: 'USDT 프리미엄' },
  { key: 'longShort', label: '롱숏 비율' },
  { key: 'oi', label: '미결제약정' },
];

function formatPercent(value: number, digits = 2) {
  return `${value > 0 ? '+' : ''}${value.toFixed(digits)}%`;
}

const TYPE_COLORS: Record<string, string> = {
  fomc: '#e53935',
  cpi: '#f9a825',
  employment: '#1e88e5',
  etf: '#00c853',
  halving: '#00c853',
  other: '#9ca3af',
};

function MiniCalendar() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const events = getUpcomingEvents(20);
  const eventDayMap = new Map<number, string>();
  for (const ev of events) {
    const d = new Date(ev.date + 'T00:00:00');
    if (d.getFullYear() === year && d.getMonth() === month) {
      eventDayMap.set(d.getDate(), TYPE_COLORS[ev.type] || TYPE_COLORS.other);
    }
  }

  const monthLabel = `${year}년 ${month + 1}월`;
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="border-t border-dot-border p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="desktop-kicker">{monthLabel}</span>
        <span className="text-[11px] text-dot-muted">이벤트 표시</span>
      </div>
      <div className="grid grid-cols-7 gap-px text-center text-[11px]">
        {weekdays.map((w) => (
          <div key={w} className="py-1 text-dot-muted">{w}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const eventColor = eventDayMap.get(day);
          const isToday = day === today;
          return (
            <div
              key={day}
              className={`relative py-1 ${
                isToday
                  ? 'font-bold text-dot-accent'
                  : 'text-dot-sub'
              }`}
            >
              {day}
              {eventColor && (
                <span
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ backgroundColor: eventColor }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ClickableStatCard({
  label,
  value,
  detail,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: 'accent' | 'positive' | 'negative' | 'neutral';
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left border p-4 transition-all ${
        active
          ? 'border-dot-accent bg-dot-accent/[0.04] ring-1 ring-dot-accent/20'
          : 'border-dot-border hover:border-dot-accent'
      }`}
    >
      <p className="desktop-kicker">{label}</p>
      <div className={`mt-3 text-[13px] font-bold ${
        tone === 'positive' ? 'text-dot-blue'
        : tone === 'negative' ? 'text-dot-red'
        : tone === 'neutral' ? 'text-dot-sub'
        : 'text-dot-accent'
      }`}>
        {value}
      </div>
      {detail ? <div className="mt-2 text-[11px] leading-6 text-dot-sub">{detail}</div> : null}
    </button>
  );
}

export default function DesktopHomePage() {
  const {
    data, error, loading, lastUpdated, fetchData,
    fundingRange, fearGreedRange,
    usdtPremiumRange, btcDominanceRange, longShortRange,
    oiRange, liqRange, stableRange, volumeRange, strategyBtcRange, capitalRange,
  } = useData();
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorKey | null>('fearGreed');
  const [isMarketTempHovered, setIsMarketTempHovered] = useState(false);

  // 자동 슬라이딩: 8초마다 다음 슬라이드 (일시정지 시 멈춤)
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setSlide((prev) => (prev + 1) % 2);
    }, 8000);
    return () => clearInterval(timer);
  }, [paused]);

  if (!data) return null;

  const toggleIndicator = (key: IndicatorKey) => {
    setSelectedIndicator((prev) => (prev === key ? null : key));
  };

  const renderDetail = (): ReactNode => {
    if (!selectedIndicator || !data) return null;
    const fmt = formatPercent;
    const row = (label: string, value: string, sub?: string) => (
      <div key={label} className="flex items-center justify-between py-1 border-b border-dot-border last:border-0">
        <span className="text-[11px] text-dot-muted">{label}</span>
        <div className="text-right">
          <span className="text-[11px] font-bold text-dot-accent">{value}</span>
          {sub && <span className="ml-2 text-[11px] text-dot-muted">{sub}</span>}
        </div>
      </div>
    );
    switch (selectedIndicator) {
      case 'kimp':
        return <>{row('업비트', `₩${data.kimp.upbitPrice.toLocaleString()}`)}{row('바이낸스', `$${data.kimp.globalPrice.toLocaleString()}`)}{row('환율', `₩${data.kimp.usdKrw.toLocaleString()}`)}{row('김프', fmt(data.kimp.kimchiPremium))}{row('30일 평균', data.avg30d !== null ? fmt(data.avg30d) : '—')}</>;
      case 'funding':
        return <>{row('현재 펀딩비', fmt(data.fundingRate.fundingRate * 100, 4))}{row('연환산', fmt(data.fundingRate.fundingRate * 100 * 3 * 365, 1))}{fundingRange && <>{row('당일 최저', fmt(fundingRange.min, 4))}{row('당일 최고', fmt(fundingRange.max, 4))}</>}</>;
      case 'fearGreed':
        return <>{row('현재', `${data.fearGreed.value}`, data.fearGreed.classification)}{fearGreedRange && <>{row('당일 최저', `${fearGreedRange.min}`)}{row('당일 최고', `${fearGreedRange.max}`)}</>}</>;
      case 'usdt':
        return <>{row('USDT/KRW', `₩${data.usdtPremium.usdtKrwPrice.toLocaleString()}`)}{row('실제 환율', `₩${data.usdtPremium.actualUsdKrw.toLocaleString()}`)}{row('프리미엄', fmt(data.usdtPremium.premium))}{usdtPremiumRange && <>{row('당일 범위', `${fmt(usdtPremiumRange.min)} ~ ${fmt(usdtPremiumRange.max)}`)}</>}</>;
      case 'dominance':
        return <>{row('BTC 도미넌스', fmt(data.btcDominance.dominance))}{row('BTC 시총', `$${(data.btcDominance.btcMarketCap / 1e12).toFixed(2)}T`)}{row('전체 시총', `$${(data.btcDominance.totalMarketCap / 1e12).toFixed(2)}T`)}</>;
      case 'longShort':
        return <>{row('롱 비율', `${data.longShortRatio.longRatio.toFixed(1)}%`)}{row('숏 비율', `${data.longShortRatio.shortRatio.toFixed(1)}%`)}{row('롱숏 비율', data.longShortRatio.longShortRatio.toFixed(2))}{longShortRange && row('당일 범위', `${longShortRange.min.toFixed(1)} ~ ${longShortRange.max.toFixed(1)}`)}</>;
      case 'oi':
        return <>{row('미결제약정', `$${(data.openInterest.oiUsd / 1e9).toFixed(2)}B`)}{row('OI (BTC)', data.openInterest.oi.toLocaleString())}{row('24h 변화', fmt(data.openInterest.changeRate))}</>;
      case 'liquidation':
        return <>{row('총 청산', `$${(data.liquidation.totalLiqUsd / 1e6).toFixed(1)}M`)}{row('롱 청산', `$${(data.liquidation.longLiqUsd / 1e6).toFixed(1)}M`)}{row('숏 청산', `$${(data.liquidation.shortLiqUsd / 1e6).toFixed(1)}M`)}{row('롱 비중', `${(data.liquidation.ratio * 100).toFixed(1)}%`)}</>;
      case 'stablecoin':
        return <>{row('총 시총', `$${(data.stablecoinMcap.totalMcap / 1e9).toFixed(0)}B`)}{row('24h 변화', fmt(data.stablecoinMcap.change24h))}</>;
      case 'volume':
        return <>{row('바이낸스 24h', `${data.volumeChange.binanceVolume24h.toLocaleString()} BTC`)}{row('7일 평균', `${data.volumeChange.binanceVolumeAvg7d.toLocaleString()} BTC`)}{row('변화율', fmt(data.volumeChange.binanceChangeRate))}</>;
      case 'strategy':
        return <>{row('보유량', `${data.strategyBtc.totalHoldings.toLocaleString()} BTC`)}{row('매입 비용', `$${(data.strategyBtc.totalEntryValueUsd / 1e9).toFixed(2)}B`)}{row('현재 가치', `$${(data.strategyBtc.currentValueUsd / 1e9).toFixed(2)}B`)}{row('공급 비중', `${data.strategyBtc.supplyPercentage.toFixed(2)}%`)}</>;
      default: return null;
    }
  };

  const d = data;
  const handleMarketTempWheel = (event: WheelEvent<HTMLDivElement>) => {
    applyMarketTempWheelGuard(event, { slide, isMarketTempHovered });
  };

  function getStatValue(key: IndicatorKey): { value: ReactNode; detail?: ReactNode; tone?: 'accent' | 'positive' | 'negative' | 'neutral' } {
    switch (key) {
      case 'fearGreed': return { value: `${d.fearGreed.value}`, detail: d.fearGreed.classification };
      case 'dominance': return { value: formatPercent(d.btcDominance.dominance) };
      case 'liquidation': return { value: `${(d.liquidation.ratio * 100).toFixed(1)}%`, detail: '롱 청산 비중' };
      case 'volume': return { value: formatPercent(d.volumeChange.binanceChangeRate || d.volumeChange.changeRate), tone: (d.volumeChange.binanceChangeRate || d.volumeChange.changeRate) >= 0 ? 'accent' : 'neutral' };
      case 'kimp': return { value: formatPercent(d.kimp.kimchiPremium), tone: d.kimp.kimchiPremium > 3 ? 'negative' : d.kimp.kimchiPremium > 0 ? 'accent' : 'neutral' };
      case 'funding': return { value: formatPercent(d.fundingRate.fundingRate * 100, 3), tone: d.fundingRate.fundingRate > 0 ? 'negative' : 'positive' };
      case 'usdt': return { value: formatPercent(d.usdtPremium.premium), tone: d.usdtPremium.premium > 0 ? 'accent' : 'neutral' };
      case 'longShort': return { value: `${d.longShortRatio.longRatio.toFixed(1)}%`, detail: `숏 ${d.longShortRatio.shortRatio.toFixed(1)}%` };
      case 'oi': return { value: `$${(d.openInterest.oiUsd / 1e9).toFixed(1)}B`, tone: 'neutral' };
      case 'stablecoin': return { value: `$${(d.stablecoinMcap.totalMcap / 1e9).toFixed(0)}B`, tone: 'neutral' };
      case 'strategy': return { value: `${(d.strategyBtc.totalHoldings / 1000).toFixed(0)}K BTC`, tone: 'neutral' };
      default: return { value: '—' };
    }
  }

  return (
    <div className="space-y-6">
      <DesktopHero
        eyebrow="Command Deck"
        title={(
          <span className="flex items-center justify-between">
            <span>비트코인 기상청</span>
            <HomeIntroModal
              overviewCards={introCards}
              baseUrl={SITE_BASE_URL}
              contactEmail={SITE_CONTACT_EMAIL}
            />
          </span>
        )}
        description={(
          <>
            실시간 시장 체온, 핵심 해석, 이벤트 캘린더를 한 화면에서 확인합니다.
            지표를 클릭하면 상세 분석 카드가 펼쳐집니다.
          </>
        )}
        action={(
          <div>
            {/* 슬라이딩 캐러셀 */}
            <div className="relative overflow-hidden border border-dot-border">
              {/* 인디케이터 */}
              <div className="flex items-center gap-6 px-4 pt-3 pb-1">
                <button
                  type="button"
                  onClick={() => setPaused((p) => !p)}
                  className="text-[11px] text-dot-muted hover:text-dot-accent transition-colors"
                  title={paused ? '자동 슬라이드 재생' : '자동 슬라이드 일시정지'}
                >
                  {paused ? '▶' : '❚❚'}
                </button>
                {['시장 체온', '이벤트'].map((label, i) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setSlide(i)}
                    className={`desktop-kicker transition-colors ${
                      slide === i ? 'text-dot-accent' : 'text-dot-muted hover:text-dot-sub'
                    }`}
                  >
                    {label}
                    {slide === i && <div className="mt-1 h-[1.5px] bg-dot-accent" />}
                  </button>
                ))}
                <div className="flex-1" />
                <span className="text-[11px] text-dot-muted">{slide + 1}/2</span>
              </div>

              {/* 슬라이드 트랙 */}
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${slide * 100}%)` }}
              >
                {/* Slide 1: 시장 체온 — 클릭 가능 지표 */}
                <div
                  className="w-full flex-shrink-0 px-4 pb-4 pt-2 space-y-3"
                  onMouseEnter={() => setIsMarketTempHovered(true)}
                  onMouseLeave={() => setIsMarketTempHovered(false)}
                  onWheelCapture={handleMarketTempWheel}
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-4 items-stretch">
                    <div className="min-w-0 [&>*]:h-full [&_button:has(+div)]:hidden [&_button+div]:hidden">
                      <SignalBadge signal={data.signal} upbitPrice={data.kimp.upbitPrice} />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {INDICATORS_ROW1.map((ind) => {
                        const stat = getStatValue(ind.key);
                        return (
                          <ClickableStatCard
                            key={ind.key}
                            label={ind.label}
                            value={stat.value}
                            detail={stat.detail}
                            tone={stat.tone}
                            active={selectedIndicator === ind.key}
                            onClick={() => toggleIndicator(ind.key)}
                          />
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    {INDICATORS_ROW2.map((ind) => {
                      const stat = getStatValue(ind.key);
                      return (
                        <ClickableStatCard
                          key={ind.key}
                          label={ind.label}
                          value={stat.value}
                          detail={stat.detail}
                          tone={stat.tone}
                          active={selectedIndicator === ind.key}
                          onClick={() => toggleIndicator(ind.key)}
                        />
                      );
                    })}
                  </div>

                  {selectedIndicator && (
                    <div className="max-h-[180px] overflow-y-auto">
                      {renderDetail()}
                    </div>
                  )}

                </div>

                {/* Slide 2: 이벤트 (달력 + 리스트) */}
                <div className="w-full flex-shrink-0 px-4 pb-4 pt-2">
                  <div className="space-y-4">
                    <MiniCalendar />
                    <EventStrip />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      />
    </div>
  );
}
