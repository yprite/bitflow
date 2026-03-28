import type { ReactNode } from 'react';
import BitcoinFeeCalculator from '@/components/bitcoin-fee-calculator';
import BitcoinStuckTxRescue from '@/components/bitcoin-stuck-tx-rescue';
import BitcoinTxStatusTracker from '@/components/bitcoin-tx-status-tracker';
import BitcoinTxSizeEstimator from '@/components/bitcoin-tx-size-estimator';
import BitcoinUnitConverter from '@/components/bitcoin-unit-converter';
import BitcoinUtxoConsolidationPlanner from '@/components/bitcoin-utxo-consolidation-planner';
import GuideModal from '@/components/guide-modal';
import PageHeader from '@/components/page-header';
import ToolsArbitrageSection from '@/components/tools-arbitrage-section';
import ChromeExtensionCard from '@/components/chrome-extension-card';
import DotAssemblyReveal from '@/components/motion/transitions/DotAssemblyReveal';
import { fetchUsdKrw } from '@/lib/kimp';
import { fetchOnchainNetworkPulse } from '@/lib/onchain-monitor';

function ToolSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 rounded-sm border border-dot-border/45 bg-white/65 px-4 py-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">{eyebrow}</p>
          <h2 className="text-sm font-semibold tracking-tight text-dot-accent sm:text-base">{title}</h2>
        </div>
        <p className="max-w-2xl text-xs leading-relaxed text-dot-sub sm:text-right">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function ToolsGuideContent() {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <div className="border border-dot-border/60 p-3 dot-grid-sparse">
        <p className="text-[10px] text-dot-muted uppercase tracking-wider">Prepare</p>
        <p className="mt-1 text-[11px] leading-relaxed text-dot-sub">
          전송 크기를 먼저 추정하고, 그 크기 기준으로 즉시, 30분, 1시간 fee를 바로 계산합니다.
        </p>
      </div>
      <div className="border border-dot-border/60 p-3 dot-grid-sparse">
        <p className="text-[10px] text-dot-muted uppercase tracking-wider">Rescue + Track</p>
        <p className="mt-1 text-[11px] leading-relaxed text-dot-sub">
          stuck tx를 RBF/CPFP로 살릴 때 얼마를 더 붙여야 하는지 계산하고, txid로 현재 stage를 추적합니다.
        </p>
      </div>
      <div className="border border-dot-border/60 p-3 dot-grid-sparse">
        <p className="text-[10px] text-dot-muted uppercase tracking-wider">Operations + Market</p>
        <p className="mt-1 text-[11px] leading-relaxed text-dot-sub">
          단위 감각을 맞추고 UTXO 정리 타이밍을 본 뒤, 마지막에 BTC 재정거래 계산으로 이어집니다.
        </p>
      </div>
      <div className="border border-dot-border/60 p-3 dot-grid-sparse">
        <p className="text-[10px] text-dot-muted uppercase tracking-wider">Extension</p>
        <p className="mt-1 text-[11px] leading-relaxed text-dot-sub">
          브라우저에서 sats→원화 변환을 바로 해주는 크롬 익스텐션을 설치할 수 있습니다.
        </p>
      </div>
    </div>
  );
}

export default async function ToolsPage() {
  const [networkPulse, usdKrw] = await Promise.all([
    fetchOnchainNetworkPulse(),
    fetchUsdKrw().catch(() => null),
  ]);

  return (
    <div className="space-y-3 sm:space-y-5">
      <DotAssemblyReveal delay={0} duration={520} density="low">
        <PageHeader
          eyebrow="Bitcoin Utility Deck"
          title="도구"
          description="비트코인 전송 준비, 막힌 거래 복구, 상태 확인, UTXO 정리, 재정거래 판단까지 실제 순서대로 배치한 BTC 전용 도구 모음입니다."
          action={(
            <div className="flex flex-col items-end gap-2">
              <div className="rounded-sm border border-dot-border/50 bg-white/70 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.16em] text-dot-sub">
                BTC ops toolkit
              </div>
              <GuideModal
                title="도구 안내"
                eyebrow="Bitcoin Utility Deck"
                triggerLabel="읽는 법"
                maxWidthClassName="max-w-4xl"
                triggerClassName="inline-flex rounded-sm border border-dot-border/60 bg-white/75 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.16em] text-dot-sub transition hover:border-dot-accent/50 hover:text-dot-accent"
                intro={(
                  <>
                    이 화면은 비트코인 실무 흐름 그대로 묶었습니다. 먼저 전송 크기와 fee를 준비하고,
                    막힌 거래를 구조적으로 복구하고, 상태를 추적한 뒤,
                    <span className="font-medium text-dot-accent"> UTXO 정리와 재정거래 판단</span>
                    으로 넘어가면 됩니다.
                  </>
                )}
              >
                <ToolsGuideContent />
              </GuideModal>
            </div>
          )}
        />
      </DotAssemblyReveal>

      {networkPulse ? (
        <DotAssemblyReveal delay={140} duration={700}>
          <ToolSection
            eyebrow="Prepare"
            title="전송 준비"
            description="거래를 보내기 전에 필요한 계산을 먼저 모았습니다. 실제 vbytes를 잡고, 현재 mempool 기준 fee를 정한 뒤, 금액 감을 단위로 맞추는 순서입니다."
          >
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]">
              <BitcoinTxSizeEstimator
                feePressure={networkPulse.feePressure}
                btcPriceUsd={networkPulse.marketContext.currentPriceUsd}
              />
              <BitcoinFeeCalculator
                feePressure={networkPulse.feePressure}
                blockTempo={networkPulse.blockTempo}
                btcPriceUsd={networkPulse.marketContext.currentPriceUsd}
              />
            </div>
            <div className="grid gap-3 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <BitcoinUnitConverter
                btcPriceUsd={networkPulse.marketContext.currentPriceUsd}
                btcPriceKrw={
                  usdKrw !== null
                    ? networkPulse.marketContext.currentPriceUsd * usdKrw
                    : null
                }
              />
              <BitcoinUtxoConsolidationPlanner
                feePressure={networkPulse.feePressure}
                btcPriceUsd={networkPulse.marketContext.currentPriceUsd}
              />
            </div>
          </ToolSection>
        </DotAssemblyReveal>
      ) : null}

      <DotAssemblyReveal delay={220} duration={720}>
        <ToolSection
          eyebrow="Recover"
          title="막힌 거래 대응"
          description="이미 보낸 거래가 늦어졌다면, 먼저 현재 stage를 확인하고 필요한 경우 RBF 또는 CPFP 기준 추가 수수료를 계산하는 쪽이 가장 빠릅니다."
        >
          <section className={`grid gap-3 ${networkPulse ? 'xl:grid-cols-[minmax(0,1fr)_minmax(0,1.06fr)]' : 'xl:grid-cols-1'}`}>
            {networkPulse ? <BitcoinStuckTxRescue feePressure={networkPulse.feePressure} /> : null}
            <BitcoinTxStatusTracker />
          </section>
        </ToolSection>
      </DotAssemblyReveal>

      <DotAssemblyReveal delay={360} duration={740}>
        <ToolSection
          eyebrow="Market"
          title="시장 판단"
          description="단기 전송 실무와 별개로, BTC 단위 감과 호가 괴리를 함께 보고 실제 재정거래가 의미 있는지 마지막에 판단하는 영역입니다."
        >
          <ToolsArbitrageSection />
        </ToolSection>
      </DotAssemblyReveal>

      <DotAssemblyReveal delay={420} duration={720}>
        <ToolSection
          eyebrow="Extension"
          title="크롬 익스텐션"
          description="BTC 실무 흐름을 브라우저에서 바로 쓸 수 있는 크롬 익스텐션 모음입니다. 설치하면 웹 페이지를 읽으면서 금액 감각을 즉시 잡을 수 있습니다."
        >
          <ChromeExtensionCard />
        </ToolSection>
      </DotAssemblyReveal>

      <DotAssemblyReveal delay={500} duration={620} density="low">
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
              <span>금액 체감이 애매하면 BTC / sats Converter로 단위를 먼저 맞추고, 여러 작은 입력을 합칠 계획이면 UTXO Consolidation Planner까지 같이 보세요.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-dot-muted/50 font-mono">03</span>
              <span>거래가 이미 막혔다면 TX Status Tracker에서 먼저 현재 stage를 확인하고, 이어서 Stuck TX Rescue에서 RBF와 CPFP 기준 추가 sats를 계산하세요.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-dot-muted/50 font-mono">04</span>
              <span>confirmations가 쌓이는 중인지, 여전히 mempool 대기인지에 따라 대기와 구조 변경을 구분해서 판단하세요.</span>
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
