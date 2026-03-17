import type { Metadata } from 'next';
import DotAssemblyReveal from '@/components/motion/transitions/DotAssemblyReveal';
import HalvingCountdown from '@/components/halving-countdown';
import OnchainEntityFlowCard from '@/components/onchain-entity-flow-card';
import OnchainMetricCard from '@/components/onchain-metric-card';
import PageHeader from '@/components/page-header';
import { fetchOnchainSummary } from '@/lib/onchain';

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
  const summary = await fetchOnchainSummary({
    metricLookbackDays: 30,
    alertLimit: 8,
    entityLimit: 6,
  });
  const visibleMetrics = summary.metrics.filter((metric) => metric.latestValue !== null);
  const hasFlows = summary.entityFlows.length > 0;
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

      <DotAssemblyReveal delay={120} duration={700}>
        <div className="grid gap-3 sm:grid-cols-2">
          <HalvingCountdown />
          {visibleMetrics.length > 0
            ? visibleMetrics.map((metric) => (
                <OnchainMetricCard key={metric.id} metric={metric} />
              ))
            : null}
        </div>
      </DotAssemblyReveal>

      {hasFlows && (
        <DotAssemblyReveal delay={180} duration={750}>
          <div className="grid gap-3">
            <OnchainEntityFlowCard flows={summary.entityFlows} />
          </div>
        </DotAssemblyReveal>
      )}
    </div>
  );
}
