import type { Metadata } from 'next';
import DotAssemblyReveal from '@/components/motion/transitions/DotAssemblyReveal';
import HalvingCountdown from '@/components/halving-countdown';
import OnchainAlertFeed from '@/components/onchain-alert-feed';
import OnchainEntityFlowCard from '@/components/onchain-entity-flow-card';
import OnchainMetricCard from '@/components/onchain-metric-card';
import PageHeader from '@/components/page-header';
import { fetchOnchainSummary } from '@/lib/onchain';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '온체인',
  description:
    '비트코인 네트워크의 일별 온체인 지표, 자금 흐름, 주요 이벤트를 확인합니다.',
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
  const hasMetricData = summary.metrics.some((metric) => metric.latestValue !== null);
  const hasFlows = summary.entityFlows.length > 0;
  const hasAlerts = summary.alerts.length > 0;

  return (
    <div className="space-y-3 sm:space-y-4">
      <DotAssemblyReveal delay={0} duration={500} density="low">
        <PageHeader
          eyebrow="Bitcoin On-chain"
          title="온체인 모니터"
          description={(
            <span>
              비트코인 네트워크의 일별 지표, 자금 흐름, 주요 이벤트를 실시간으로 확인합니다.
            </span>
          )}
          action={(
            <span className="text-[10px] font-mono text-dot-muted">
              업데이트 {formatTimestamp(summary.updatedAt)}
            </span>
          )}
          variant="card"
        />
      </DotAssemblyReveal>

      {summary.message ? (
        <DotAssemblyReveal delay={70} duration={650}>
          <section className="dot-card p-4 sm:p-5">
            <div className="dot-card-inner space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">
                    Status
                  </p>
                  <h2 className="text-sm font-semibold text-dot-accent tracking-tight">
                    {summary.status === 'available' ? '일부 지표 준비 중' : '데이터 준비 중'}
                  </h2>
                </div>
                {summary.source === 'fallback' ? (
                  <span className="text-[10px] font-mono text-dot-muted">
                    최근 스냅샷 기준
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-dot-sub leading-relaxed">{summary.message}</p>
              {summary.status === 'unavailable' ? (
                <p className="dot-insight">
                  온체인 데이터는 블록 동기화 완료 후 자동으로 업데이트됩니다.
                </p>
              ) : null}
            </div>
          </section>
        </DotAssemblyReveal>
      ) : null}

      {/* 반감기 카운트다운 */}
      <DotAssemblyReveal delay={90} duration={650}>
        <HalvingCountdown />
      </DotAssemblyReveal>

      {hasMetricData ? (
        <DotAssemblyReveal delay={120} duration={700}>
          <div className="grid gap-3 sm:grid-cols-2">
            {summary.metrics.map((metric) => (
              <OnchainMetricCard key={metric.id} metric={metric} />
            ))}
          </div>
        </DotAssemblyReveal>
      ) : null}

      {(hasFlows || hasAlerts) && (
        <DotAssemblyReveal delay={180} duration={750}>
          <div className="grid gap-3 lg:grid-cols-[1.05fr_0.95fr]">
            <OnchainEntityFlowCard flows={summary.entityFlows} />
            <OnchainAlertFeed alerts={summary.alerts} stats={summary.alertStats} />
          </div>
        </DotAssemblyReveal>
      )}
    </div>
  );
}
