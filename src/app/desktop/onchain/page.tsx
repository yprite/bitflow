import type { Metadata } from 'next';
import DotAssemblyReveal from '@/components/motion/transitions/DotAssemblyReveal';
import HalvingCountdown from '@/components/halving-countdown';
import OnchainAgeBandCard from '@/components/onchain-age-band-card';
import OnchainBlockTempoCard from '@/components/onchain-block-tempo-card';
import OnchainBriefingCard from '@/components/onchain-briefing-card';
import OnchainDormancyPulseCard from '@/components/onchain-dormancy-pulse-card';
import OnchainEntityFlowCard from '@/components/onchain-entity-flow-card';
import OnchainFeePressureCard from '@/components/onchain-fee-pressure-card';
import OnchainFeeRegimeHistoryCard from '@/components/onchain-fee-regime-history-card';
import OnchainFlowPressureCard from '@/components/onchain-flow-pressure-card';
import OnchainGuideCard from '@/components/onchain-guide-card';
import OnchainMetricCard from '@/components/onchain-metric-card';
import OnchainRegimeCard from '@/components/onchain-regime-card';
import OnchainSupportResistanceCard from '@/components/onchain-support-resistance-card';
import OnchainWhaleSummaryCard from '@/components/onchain-whale-summary-card';
import WeatherEffect from '@/components/motion/storytelling/WeatherEffect';
import { DesktopHero, DesktopSectionHeader, DesktopStatCard, DesktopSurface } from '@/components/desktop/desktop-ui';
import { fetchOnchainSummary } from '@/lib/onchain';
import {
  deriveOnchainAgeBands,
  deriveOnchainBriefing,
  deriveOnchainDormancyPulse,
  deriveOnchainFlowPressure,
  deriveOnchainRegime,
  deriveOnchainSupportResistance,
  deriveOnchainWhaleSummary,
  fetchOnchainNetworkPulse,
} from '@/lib/onchain-monitor';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '온체인',
  description: '비트코인 온체인 모니터의 PC 전용 버전입니다.',
};

function formatTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul',
  });
}

export default async function DesktopOnchainPage() {
  const [summary, networkPulse] = await Promise.all([
    fetchOnchainSummary({
      metricLookbackDays: 30,
      alertLimit: 60,
      entityLimit: 18,
    }),
    fetchOnchainNetworkPulse(),
  ]);

  const visibleMetrics = summary.metrics.filter((metric) => metric.latestValue !== null);
  const hasFlows = summary.entityFlows.length > 0;
  const regime = deriveOnchainRegime(summary.metrics, summary.alertStats);
  const whaleSummary = summary.status === 'available' ? deriveOnchainWhaleSummary(summary.alerts) : null;
  const dormancyPulse = deriveOnchainDormancyPulse(summary.metrics);
  const flowPressure = deriveOnchainFlowPressure(summary.entityFlows);
  const ageBands = deriveOnchainAgeBands(summary.metrics);
  const supportResistance = deriveOnchainSupportResistance(
    networkPulse?.marketContext ?? null,
    regime,
    whaleSummary,
    dormancyPulse,
    flowPressure,
  );
  const briefing = deriveOnchainBriefing({
    regime,
    whaleSummary,
    feePressure: networkPulse?.feePressure ?? null,
    dormancyPulse,
    flowPressure,
    ageBands,
    levels: supportResistance,
  });
  const feeHistory = networkPulse?.feeHistory ?? null;
  const visibleEntityFlows = summary.entityFlows.slice(0, 6);
  const freshnessLabel = summary.latestDay
    ? new Date(`${summary.latestDay}T00:00:00Z`).toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      })
    : formatTimestamp(summary.updatedAt);

  return (
    <div className="space-y-6">
      <DotAssemblyReveal delay={0} duration={500} density="low">
        <DesktopHero
          eyebrow="Bitcoin On-chain"
          title="온체인 모니터"
          description={(
            <>
              모바일 카드 나열 대신 네트워크 해석 흐름을 넓은 캔버스에 맞게 다시 묶었습니다.
              상단에서 현재 레짐과 브리핑을 잡고, 아래에서 활동성, 수수료 압력, 엔티티 흐름을 이어서 읽도록 구성했습니다.
              <WeatherEffect weather="windy" width={700} height={250} className="absolute bottom-0 left-0 z-0 pointer-events-none" />
            </>
          )}
          sidebar={(
            <div className="space-y-4">
              <DesktopStatCard label="기준일" value={freshnessLabel} tone="neutral" />
              {briefing && (
                <div className="border border-dot-border/55 bg-white/70 p-4 space-y-2">
                  <p className="desktop-kicker">브리핑</p>
                  <p className="text-[13px] font-semibold text-dot-accent leading-snug">{briefing.headline}</p>
                  <p className="text-[11px] leading-relaxed text-dot-sub">{briefing.summary}</p>
                  <div className="pt-1 border-t border-dot-border/30">
                    <p className="text-[10px] text-dot-muted">{briefing.watchLabel}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        />
      </DotAssemblyReveal>

      <DotAssemblyReveal delay={100} duration={680}>
        <div className="min-w-0">
          <OnchainGuideCard />
        </div>
      </DotAssemblyReveal>

      {briefing ? (
        <DotAssemblyReveal delay={130} duration={700}>
          <div className="min-w-0">
            <OnchainBriefingCard briefing={briefing} />
          </div>
        </DotAssemblyReveal>
      ) : null}

      {regime || whaleSummary ? (
        <DotAssemblyReveal delay={170} duration={700}>
          <div className="grid grid-cols-2 gap-6">
            <div className="min-w-0">{regime ? <OnchainRegimeCard regime={regime} /> : null}</div>
            <div className="min-w-0">{whaleSummary ? <OnchainWhaleSummaryCard summary={whaleSummary} /> : null}</div>
          </div>
        </DotAssemblyReveal>
      ) : null}

      {dormancyPulse || flowPressure ? (
        <DotAssemblyReveal delay={210} duration={740}>
          <div className="grid grid-cols-2 gap-6">
            <div className="min-w-0">{dormancyPulse ? <OnchainDormancyPulseCard data={dormancyPulse} /> : null}</div>
            <div className="min-w-0">{flowPressure ? <OnchainFlowPressureCard data={flowPressure} /> : null}</div>
          </div>
        </DotAssemblyReveal>
      ) : null}

      {ageBands || supportResistance ? (
        <DotAssemblyReveal delay={250} duration={750}>
          <div className="grid grid-cols-2 gap-6">
            <div className="min-w-0">{ageBands ? <OnchainAgeBandCard data={ageBands} /> : null}</div>
            <div className="min-w-0">{supportResistance ? <OnchainSupportResistanceCard data={supportResistance} /> : null}</div>
          </div>
        </DotAssemblyReveal>
      ) : null}

      <DotAssemblyReveal delay={290} duration={760}>
        <DesktopSurface className="p-6">
          <DesktopSectionHeader
            eyebrow="Network Pulse"
            title="프로토콜 진행 상황"
            description="반감기, 수수료 압력, 블록 템포를 고정 그리드에서 함께 읽습니다."
          />
          <div className="mt-6 grid grid-cols-2 gap-6">
            <div className="min-w-0">
              <HalvingCountdown />
            </div>
            <div className="min-w-0">
              {networkPulse ? <OnchainFeePressureCard data={networkPulse.feePressure} /> : null}
            </div>
            <div className="min-w-0">
              {feeHistory ? <OnchainFeeRegimeHistoryCard data={feeHistory} /> : null}
            </div>
            <div className="min-w-0">
              {networkPulse ? <OnchainBlockTempoCard data={networkPulse.blockTempo} /> : null}
            </div>
          </div>
        </DesktopSurface>
      </DotAssemblyReveal>

      {visibleMetrics.length > 0 ? (
        <DotAssemblyReveal delay={330} duration={800}>
          <DesktopSurface className="p-6">
            <DesktopSectionHeader
              eyebrow="Metric Grid"
              title="핵심 온체인 지표"
              description="PC 화면에서는 개별 지표를 3열로 정렬해 비교 속도를 높였습니다."
            />
            <div className="mt-6 grid grid-cols-3 gap-5">
              {visibleMetrics.map((metric) => (
                <div key={metric.id} className="min-w-0">
                  <OnchainMetricCard metric={metric} />
                </div>
              ))}
            </div>
          </DesktopSurface>
        </DotAssemblyReveal>
      ) : null}

      {hasFlows ? (
        <DotAssemblyReveal delay={370} duration={840}>
          <DesktopSurface className="p-6">
            <DesktopSectionHeader
              eyebrow="Entity Flow"
              title="주요 엔티티 흐름"
              description="거래소·보유 기관 중심 흐름을 데스크톱 너비 기준으로 넓게 배치했습니다."
            />
            <div className="mt-6 min-w-0">
              <OnchainEntityFlowCard flows={visibleEntityFlows} />
            </div>
          </DesktopSurface>
        </DotAssemblyReveal>
      ) : null}
    </div>
  );
}
