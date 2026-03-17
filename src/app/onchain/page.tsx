import type { Metadata } from 'next';
import DotAssemblyReveal from '@/components/motion/transitions/DotAssemblyReveal';
import HalvingCountdown from '@/components/halving-countdown';
import OnchainBlockTempoCard from '@/components/onchain-block-tempo-card';
import OnchainEntityFlowCard from '@/components/onchain-entity-flow-card';
import OnchainFeePressureCard from '@/components/onchain-fee-pressure-card';
import OnchainMetricCard from '@/components/onchain-metric-card';
import OnchainRegimeCard from '@/components/onchain-regime-card';
import OnchainWhaleSummaryCard from '@/components/onchain-whale-summary-card';
import PageHeader from '@/components/page-header';
import { fetchOnchainSummary } from '@/lib/onchain';
import {
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

      {hasNarrativeCards ? (
        <DotAssemblyReveal delay={120} duration={700}>
          <div className="grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
            {regime ? <OnchainRegimeCard regime={regime} /> : null}
            {whaleSummary ? <OnchainWhaleSummaryCard summary={whaleSummary} /> : null}
          </div>
        </DotAssemblyReveal>
      ) : null}

      <DotAssemblyReveal delay={160} duration={720}>
        <div className={`grid gap-3 ${networkPulse ? 'xl:grid-cols-3' : 'xl:grid-cols-1'}`}>
          <HalvingCountdown />
          {networkPulse ? (
            <>
              <OnchainFeePressureCard data={networkPulse.feePressure} />
              <OnchainBlockTempoCard data={networkPulse.blockTempo} />
            </>
          ) : null}
        </div>
      </DotAssemblyReveal>

      {visibleMetrics.length > 0 ? (
        <DotAssemblyReveal delay={200} duration={760}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleMetrics.map((metric) => (
              <OnchainMetricCard key={metric.id} metric={metric} />
            ))}
          </div>
        </DotAssemblyReveal>
      ) : null}

      {hasFlows && (
        <DotAssemblyReveal delay={240} duration={800}>
          <div className="grid gap-3">
            <OnchainEntityFlowCard flows={summary.entityFlows} />
          </div>
        </DotAssemblyReveal>
      )}
    </div>
  );
}
