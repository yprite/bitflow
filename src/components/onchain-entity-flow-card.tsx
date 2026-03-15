import type { OnchainEntityFlowEntry } from '@/lib/types';

interface OnchainEntityFlowCardProps {
  flows: OnchainEntityFlowEntry[];
}

function formatBtcFromSats(value: number): string {
  return `${(value / 100_000_000).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} BTC`;
}

function formatDate(value: string | null): string {
  if (!value) return 'N/A';

  return new Date(`${value}T00:00:00Z`).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export default function OnchainEntityFlowCard({
  flows,
}: OnchainEntityFlowCardProps) {
  const latestDay = flows[0]?.day ?? null;

  return (
    <section className="dot-card p-4 sm:p-5">
      <div className="dot-card-inner space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">
              Entity Flow
            </p>
            <h2 className="text-sm font-semibold text-dot-accent tracking-tight">
              라벨 엔티티 순유입
            </h2>
          </div>
          <span className="text-[10px] font-mono text-dot-muted">
            {formatDate(latestDay)}
          </span>
        </div>

        {flows.length === 0 ? (
          <p className="text-sm text-dot-muted leading-relaxed">
            `btc_entity_labels`가 비어 있거나 아직 일별 집계가 생성되지 않았습니다.
          </p>
        ) : (
          <div className="space-y-2">
            {flows.map((flow) => {
              const netPositive = flow.netflowSats >= 0;

              return (
                <div
                  key={`${flow.day}-${flow.entitySlug}`}
                  className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-dot-text">{flow.entitySlug}</p>
                      <p className="text-[10px] font-mono text-dot-muted">
                        유입 {formatBtcFromSats(flow.receivedSats)} / 유출 {formatBtcFromSats(flow.sentSats)} / tx {flow.txCount}
                      </p>
                    </div>
                    <p className={`text-sm font-semibold font-mono ${netPositive ? 'text-dot-green' : 'text-dot-red'}`}>
                      {netPositive ? '+' : ''}
                      {formatBtcFromSats(flow.netflowSats)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="dot-insight">
          엔티티 라벨이 늘어날수록 거래소/커스터디 순유입 해석력이 좋아집니다.
        </p>
      </div>
    </section>
  );
}
