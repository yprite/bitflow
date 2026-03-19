'use client';

import Link from 'next/link';
import DotAssemblyReveal from '@/components/motion/transitions/DotAssemblyReveal';
import OrbitalSilence from '@/components/motion/storytelling/OrbitalSilence';
import EventStrip from '@/components/event-strip';
import HomeIntroModal from '@/components/home-intro-modal';
import MarketBriefing from '@/components/market-briefing';
import SignalBadge from '@/components/signal-badge';
import {
  DesktopHero,
  DesktopLinkCard,
  DesktopSectionHeader,
  DesktopStatCard,
  DesktopSurface,
} from '@/components/desktop/desktop-ui';
import { useData } from '@/components/data-provider';
import { SITE_CONTACT_EMAIL, SITE_BASE_URL } from '@/lib/site';

const overviewCards = [
  {
    eyebrow: 'Realtime',
    title: '실시간 시장 체온',
    body: '김치프리미엄, 펀딩비, 공포탐욕, 거래량 변화를 한 화면에서 읽는 PC 전용 실시간 관제 화면입니다.',
    href: '/desktop/realtime',
    label: '실시간 지표 열기',
  },
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
] as const;

const introCards = [
  {
    title: '실시간 시장 체온',
    body: '김치프리미엄, 펀딩비, 공포탐욕, 거래량 변화를 함께 묶어 지금 시장이 과열인지 경계 국면인지 빠르게 읽도록 구성했습니다.',
    href: '/desktop/realtime',
    label: '실시간 지표 보기',
  },
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

function formatPercent(value: number, digits = 2) {
  return `${value > 0 ? '+' : ''}${value.toFixed(digits)}%`;
}

export default function DesktopHomePage() {
  const { data, error, loading, lastUpdated, fetchData } = useData();

  if (loading) {
    return (
      <DesktopSurface className="flex min-h-[620px] items-center justify-center">
        <OrbitalSilence />
      </DesktopSurface>
    );
  }

  if (error || !data) {
    return (
      <DesktopSurface className="p-12">
        <div className="space-y-4 text-center">
          <p className="desktop-kicker">Load Error</p>
          <h1 className="text-[30px] font-semibold tracking-[-0.03em] text-dot-red">
            데이터를 불러올 수 없습니다.
          </h1>
          <p className="text-[14px] leading-7 text-dot-sub">{error ?? '알 수 없는 오류'}</p>
          <button
            type="button"
            onClick={fetchData}
            className="inline-flex border border-dot-border bg-white px-4 py-2 text-[12px] font-medium text-dot-accent transition hover:border-dot-accent"
          >
            다시 시도
          </button>
        </div>
      </DesktopSurface>
    );
  }

  return (
    <div className="space-y-6">
      <DotAssemblyReveal delay={0} duration={500} density="low">
        <DesktopHero
          eyebrow="Command Deck"
          title="비트코인 기상청"
          description={(
            <>
              모바일용 정보 구조를 그대로 늘리지 않고, PC에서 빠르게 훑고 비교할 수 있도록 전용 흐름으로 다시 배치했습니다.
              첫 화면에서는 현재 시장 체온, 핵심 해석, 이벤트 캘린더를 넓은 밀도로 확인할 수 있습니다.
            </>
          )}
          action={(
            <div className="flex items-center gap-3">
              <Link href="/desktop/realtime" className="desktop-chip text-dot-accent hover:border-dot-accent/50">
                실시간 지표 바로가기
              </Link>
              <button
                type="button"
                onClick={fetchData}
                className="desktop-chip hover:border-dot-accent/40 hover:text-dot-accent"
              >
                새로고침
              </button>
              <HomeIntroModal
                overviewCards={introCards}
                baseUrl={SITE_BASE_URL}
                contactEmail={SITE_CONTACT_EMAIL}
              />
            </div>
          )}
          sidebar={(
            <div className="space-y-4">
              <DesktopStatCard label="현재 신호" value={data.signal.level} />
              <DesktopStatCard label="김치프리미엄" value={formatPercent(data.kimp.kimchiPremium)} />
              <DesktopStatCard
                label="펀딩비"
                value={formatPercent(data.fundingRate.fundingRate * 100, 3)}
                tone={data.fundingRate.fundingRate > 0 ? 'negative' : 'positive'}
              />
              <DesktopStatCard label="마지막 업데이트" value={lastUpdated || '동기화 중'} tone="neutral" />
            </div>
          )}
        />
      </DotAssemblyReveal>

      <DotAssemblyReveal delay={100} duration={600}>
        <div className="grid grid-cols-3 gap-5">
          {overviewCards.map((card) => (
            <DesktopLinkCard key={card.href} {...card} />
          ))}
        </div>
      </DotAssemblyReveal>

      <DotAssemblyReveal delay={200} duration={700}>
        <DesktopSurface className="p-6">
          <DesktopSectionHeader
            eyebrow="Market Temperature"
            title="현재 시장 체온"
            description="핵심 합성 시그널과 해석 브리핑을 데스크톱 기준으로 분리 배치했습니다."
          />
          <div className="mt-6 grid grid-cols-[minmax(0,1.2fr)_420px] gap-5">
            <div className="min-w-0">
              <SignalBadge signal={data.signal} upbitPrice={data.kimp.upbitPrice} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DesktopStatCard
                label="공포탐욕"
                value={`${data.fearGreed.value}`}
                detail={data.fearGreed.classification}
              />
              <DesktopStatCard
                label="BTC 도미넌스"
                value={formatPercent(data.btcDominance.dominance)}
              />
              <DesktopStatCard
                label="청산 비율"
                value={`${(data.liquidation.ratio * 100).toFixed(1)}%`}
                detail="롱 청산 비중"
              />
              <DesktopStatCard
                label="거래량 변화"
                value={formatPercent(data.volumeChange.binanceChangeRate || data.volumeChange.changeRate)}
                tone={(data.volumeChange.binanceChangeRate || data.volumeChange.changeRate) >= 0 ? 'accent' : 'neutral'}
              />
            </div>
          </div>
        </DesktopSurface>
      </DotAssemblyReveal>

      <DotAssemblyReveal delay={300} duration={700}>
        <DesktopSurface className="p-6">
          <DesktopSectionHeader
            eyebrow="Interpretation"
            title="브리핑"
            description="원시 숫자보다 해석 흐름이 먼저 보이도록 데스크톱용 요약 영역을 따로 둡니다."
          />
          <div className="mt-6 grid grid-cols-[minmax(0,1.1fr)_380px] gap-5">
            <div className="min-w-0">
              <MarketBriefing data={data} />
            </div>
            <div className="space-y-4">
              <DesktopSurface className="p-5">
                <div className="space-y-3">
                  <p className="desktop-kicker">Quick Access</p>
                  <div className="space-y-2 text-[13px] leading-7 text-dot-sub">
                    <p>실시간 지표 페이지에서는 선택한 팩터의 상세 카드가 우측 패널에 고정됩니다.</p>
                    <p>히스토리 페이지는 차트 비교 밀도를 올리고, 주간 리포트는 본문과 아카이브를 분리했습니다.</p>
                  </div>
                </div>
              </DesktopSurface>
              <DesktopSurface className="p-5">
                <div className="space-y-3">
                  <p className="desktop-kicker">Desktop Routes</p>
                  <div className="grid grid-cols-2 gap-2 text-[12px] text-dot-sub">
                    <Link href="/desktop/indicators" className="border border-dot-border/60 bg-white/70 px-3 py-2 hover:text-dot-accent">
                      히스토리
                    </Link>
                    <Link href="/desktop/tools" className="border border-dot-border/60 bg-white/70 px-3 py-2 hover:text-dot-accent">
                      도구
                    </Link>
                    <Link href="/desktop/weekly" className="border border-dot-border/60 bg-white/70 px-3 py-2 hover:text-dot-accent">
                      주간 리포트
                    </Link>
                    <Link href="/desktop/alert" className="border border-dot-border/60 bg-white/70 px-3 py-2 hover:text-dot-accent">
                      알림
                    </Link>
                  </div>
                </div>
              </DesktopSurface>
            </div>
          </div>
        </DesktopSurface>
      </DotAssemblyReveal>

      <DotAssemblyReveal delay={400} duration={700}>
        <DesktopSurface className="p-6">
          <DesktopSectionHeader
            eyebrow="Calendar"
            title="이벤트 스트립"
            description="실시간 화면 아래에서 바로 매크로 이벤트를 확인할 수 있게 분리했습니다."
          />
          <div className="mt-6 min-w-0">
            <EventStrip />
          </div>
        </DesktopSurface>
      </DotAssemblyReveal>
    </div>
  );
}
