import type { Metadata } from 'next';
import DotAssemblyReveal from '@/components/motion/transitions/DotAssemblyReveal';
import HalvingCountdown from '@/components/halving-countdown';
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
import OnchainWhaleSummaryCard from '@/components/onchain-whale-summary-card';
import PageHeader from '@/components/page-header';
import { fetchOnchainSummary } from '@/lib/onchain';
import {
  deriveOnchainBriefing,
  deriveOnchainDormancyPulse,
  deriveOnchainFlowPressure,
  deriveOnchainRegime,
  deriveOnchainWhaleSummary,
  fetchOnchainNetworkPulse,
} from '@/lib/onchain-monitor';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '온체인',
  description:
    '비트코인 네트워크의 일별 온체인 지표와 프로토콜 진행 상황을 확인합니다.',
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

export default async function OnchainPage() {
  const [summary, networkPulse] = await Promise.all([
    fetchOnchainSummary({
      metricLookbackDays: 30,
      alertLimit: 60,
      entityLimit: 6,
    }),
    fetchOnchainNetworkPulse(),
  ]);
  const visibleMetrics = summary.metrics.filter((metric) => metric.latestValue !== null);
  const hasFlows = summary.entityFlows.length > 0;
  const regime = deriveOnchainRegime(summary.metrics, summary.alertStats);
  const whaleSummary = summary.status === 'available' ? deriveOnchainWhaleSummary(summary.alerts) : null;
  const dormancyPulse = deriveOnchainDormancyPulse(summary.metrics);
  const flowPressure = deriveOnchainFlowPressure(summary.entityFlows);
  const briefing = deriveOnchainBriefing({
    regime,
    whaleSummary,
    feePressure: networkPulse?.feePressure ?? null,
    dormancyPulse,
    flowPressure,
  });
  const feeHistory = networkPulse?.feeHistory ?? null;
  const hasNarrativeCards = Boolean(regime || whaleSummary);
  const freshnessLabel = summary.latestDay
    ? new Date(`${summary.latestDay}T00:00:00Z`).toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      })
    : formatTimestamp(summary.updatedAt);

  return (
    <div className="space-y-3 sm:space-y-4">
      <DotAssemblyReveal delay={0} duration={500} density="low">
        <PageHeader
          eyebrow="Bitcoin On-chain"
          title="온체인 모니터"
          description={(
            <span>
              비트코인 네트워크의 일별 지표와 프로토콜 진행 상황을 한 화면에서 확인합니다.
            </span>
          )}
          action={(
            <span className="text-[10px] font-mono text-dot-muted">
              기준일 {freshnessLabel}
            </span>
          )}
          variant="card"
        />
      </DotAssemblyReveal>

      <DotAssemblyReveal delay={70} duration={660}>
        <OnchainGuideCard />
      </DotAssemblyReveal>

      {briefing ? (
        <DotAssemblyReveal delay={100} duration={680}>
          <OnchainBriefingCard briefing={briefing} />
        </DotAssemblyReveal>
      ) : null}

      {hasNarrativeCards ? (
        <DotAssemblyReveal delay={130} duration={700}>
          <div className="grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
            {regime ? <OnchainRegimeCard regime={regime} /> : null}
            {whaleSummary ? <OnchainWhaleSummaryCard summary={whaleSummary} /> : null}
          </div>
        </DotAssemblyReveal>
      ) : null}

      {dormancyPulse || flowPressure ? (
        <DotAssemblyReveal delay={170} duration={740}>
          <div className="grid gap-3 xl:grid-cols-2">
            {dormancyPulse ? <OnchainDormancyPulseCard data={dormancyPulse} /> : null}
            {flowPressure ? <OnchainFlowPressureCard data={flowPressure} /> : null}
          </div>
        </DotAssemblyReveal>
      ) : null}

      <DotAssemblyReveal delay={210} duration={760}>
        <div className={`grid gap-3 ${networkPulse ? 'md:grid-cols-2 2xl:grid-cols-4' : 'xl:grid-cols-1'}`}>
          <HalvingCountdown />
          {networkPulse ? <OnchainFeePressureCard data={networkPulse.feePressure} /> : null}
          {feeHistory ? <OnchainFeeRegimeHistoryCard data={feeHistory} /> : null}
          {networkPulse ? <OnchainBlockTempoCard data={networkPulse.blockTempo} /> : null}
        </div>
      </DotAssemblyReveal>

      {visibleMetrics.length > 0 ? (
        <DotAssemblyReveal delay={250} duration={800}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleMetrics.map((metric) => (
              <OnchainMetricCard key={metric.id} metric={metric} />
            ))}
          </div>
        </DotAssemblyReveal>
      ) : null}

      {hasFlows && (
        <DotAssemblyReveal delay={290} duration={840}>
          <div className="grid gap-3">
            <OnchainEntityFlowCard flows={summary.entityFlows} />
          </div>
        </DotAssemblyReveal>
      )}
    </div>
  );
}
