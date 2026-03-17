import BitcoinFeeCalculator from '@/components/bitcoin-fee-calculator';
import BitcoinStuckTxRescue from '@/components/bitcoin-stuck-tx-rescue';
import BitcoinTxStatusTracker from '@/components/bitcoin-tx-status-tracker';
import BitcoinTxSizeEstimator from '@/components/bitcoin-tx-size-estimator';
import BitcoinUnitConverter from '@/components/bitcoin-unit-converter';
import BitcoinUtxoConsolidationPlanner from '@/components/bitcoin-utxo-consolidation-planner';
import GuideCard from '@/components/guide-card';
import PageHeader from '@/components/page-header';
import ToolsArbitrageSection from '@/components/tools-arbitrage-section';
import DotAssemblyReveal from '@/components/motion/transitions/DotAssemblyReveal';
import { fetchOnchainNetworkPulse } from '@/lib/onchain-monitor';

const GUIDE_STORAGE_KEY = 'bitflow:tools-guide-seen';

export default async function ToolsPage() {
  const networkPulse = await fetchOnchainNetworkPulse();

  return (
    <div className="space-y-3 sm:space-y-5">
      <DotAssemblyReveal delay={0} duration={520} density="low">
        <PageHeader
          eyebrow="Bitcoin Utility Deck"
          title="도구"
          description="비트코인 전송 수수료 계산, stuck tx 추적·복구, UTXO 정리, 단위 환산, 재정거래 판단까지 실전에 바로 쓰는 도구만 모았습니다."
          action={(
            <div className="rounded-sm border border-dot-border/50 bg-white/70 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.16em] text-dot-sub">
              BTC ops toolkit
            </div>
          )}
        />
      </DotAssemblyReveal>

      <DotAssemblyReveal delay={70} duration={660}>
        <GuideCard
          title="도구 안내"
          storageKey={GUIDE_STORAGE_KEY}
          maxHeight={340}
          intro={(
            <>
              이 화면은 비트코인 실무 도구 위주로 다시 묶었습니다.
              전송 크기를 추정하고, fee를 잡고, 막힌 거래를 복구하고, UTXO를 정리하고, 마지막으로 재정거래 계산까지 이어지는 흐름입니다.
            </>
          )}
        >
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="border border-dot-border/60 p-3 dot-grid-sparse">
              <p className="text-[10px] text-dot-muted uppercase tracking-wider">Size + Fee</p>
              <p className="mt-1 text-[11px] leading-relaxed text-dot-sub">
                먼저 예상 vbytes를 잡고, 그 크기 기준으로 즉시, 30분, 1시간 수수료를 바로 계산합니다.
              </p>
            </div>
            <div className="border border-dot-border/60 p-3 dot-grid-sparse">
              <p className="text-[10px] text-dot-muted uppercase tracking-wider">Rescue + UTXO</p>
              <p className="mt-1 text-[11px] leading-relaxed text-dot-sub">
                stuck tx를 RBF/CPFP로 살릴 때 얼마를 더 붙여야 하는지, 지금이 UTXO를 정리하기 좋은지 계산합니다.
              </p>
            </div>
            <div className="border border-dot-border/60 p-3 dot-grid-sparse">
              <p className="text-[10px] text-dot-muted uppercase tracking-wider">Tracker + Market</p>
              <p className="mt-1 text-[11px] leading-relaxed text-dot-sub">
                txid로 mempool과 confirmations를 확인하고, BTC·sats 체감치를 맞춘 뒤 재정거래 계산까지 이어집니다.
              </p>
            </div>
          </div>
        </GuideCard>
      </DotAssemblyReveal>

      {networkPulse ? (
        <DotAssemblyReveal delay={140} duration={700}>
          <section className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <BitcoinFeeCalculator
              feePressure={networkPulse.feePressure}
              blockTempo={networkPulse.blockTempo}
              btcPriceUsd={networkPulse.marketContext.currentPriceUsd}
            />
            <BitcoinUnitConverter btcPriceUsd={networkPulse.marketContext.currentPriceUsd} />
          </section>
        </DotAssemblyReveal>
      ) : null}

      <DotAssemblyReveal delay={220} duration={720}>
        {networkPulse ? (
          <section className="grid gap-3 xl:grid-cols-2">
            <BitcoinTxSizeEstimator
              feePressure={networkPulse.feePressure}
              btcPriceUsd={networkPulse.marketContext.currentPriceUsd}
            />
            <BitcoinStuckTxRescue feePressure={networkPulse.feePressure} />
          </section>
        ) : null}
      </DotAssemblyReveal>

      <DotAssemblyReveal delay={300} duration={740}>
        <section className={`grid gap-3 ${networkPulse ? 'xl:grid-cols-2' : 'xl:grid-cols-1'}`}>
          <BitcoinTxStatusTracker />
          {networkPulse ? (
            <BitcoinUtxoConsolidationPlanner
              feePressure={networkPulse.feePressure}
              btcPriceUsd={networkPulse.marketContext.currentPriceUsd}
            />
          ) : null}
        </section>
      </DotAssemblyReveal>

      <DotAssemblyReveal delay={360} duration={740}>
        <ToolsArbitrageSection />
      </DotAssemblyReveal>

      <DotAssemblyReveal delay={420} duration={620} density="low">
        <section className="dot-card p-5 sm:p-6 space-y-3">
          <h2 className="text-xs font-semibold text-dot-accent uppercase tracking-wider">
            비트코인 도구 사용 순서
          </h2>
          <ul className="space-y-2 text-xs text-dot-sub leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-dot-muted/50 font-mono">01</span>
              <span>먼저 Transaction Size Estimator로 예상 vbytes를 잡고, 바로 Fee Calculator에서 실제 송금 비용을 확인하세요.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-dot-muted/50 font-mono">02</span>
              <span>거래가 이미 막혔다면 Stuck TX Rescue에서 RBF와 CPFP 기준 추가 sats를 먼저 계산하는 편이 빠릅니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-dot-muted/50 font-mono">03</span>
              <span>보낸 거래가 있다면 TX Status Tracker에서 mempool 대기인지, 이미 블록에 들어갔는지, confirmations가 몇 개인지 먼저 확인하세요.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-dot-muted/50 font-mono">04</span>
              <span>UTXO Consolidation Planner로 현재 fee 구간이 정리하기 좋은지 보고, 금액 감이 애매하면 BTC / sats Converter로 단위 체감치를 맞추세요.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-dot-muted/50 font-mono">05</span>
              <span>재정거래는 마지막 단계입니다. 호가 괴리보다 총비용과 예상 체결 시간을 먼저 확인한 뒤 실행 여부를 판단하세요.</span>
            </li>
          </ul>
        </section>
      </DotAssemblyReveal>
    </div>
  );
}
