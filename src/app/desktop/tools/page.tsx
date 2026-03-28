import type { ReactNode } from 'react';
import Link from 'next/link';
import BitcoinFeeCalculator from '@/components/bitcoin-fee-calculator';
import BitcoinStuckTxRescue from '@/components/bitcoin-stuck-tx-rescue';
import BitcoinTxStatusTracker from '@/components/bitcoin-tx-status-tracker';
import BitcoinTxSizeEstimator from '@/components/bitcoin-tx-size-estimator';
import BitcoinUnitConverter from '@/components/bitcoin-unit-converter';
import BitcoinUtxoConsolidationPlanner from '@/components/bitcoin-utxo-consolidation-planner';
import DotAssemblyReveal from '@/components/motion/transitions/DotAssemblyReveal';
import ToolsArbitrageSection from '@/components/tools-arbitrage-section';
import { DesktopHero, DesktopSectionHeader, DesktopSurface } from '@/components/desktop/desktop-ui';
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
    <DesktopSurface className="p-6">
      <DesktopSectionHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
      />
      <div className="mt-6 space-y-5">{children}</div>
    </DesktopSurface>
  );
}

function ToolsGuideContent() {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
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
    </div>
  );
}

export default async function DesktopToolsPage() {
  const [networkPulse, usdKrw] = await Promise.all([
    fetchOnchainNetworkPulse(),
    fetchUsdKrw().catch(() => null),
  ]);

  return (
    <div className="magazine-content pt-20 pb-16">
      <Link href="/desktop" className="mb-6 inline-flex text-[10px] uppercase tracking-[0.14em] text-dot-muted hover:text-dot-accent">개요</Link>
    <div className="space-y-6">
      <DotAssemblyReveal delay={0} duration={520} density="low">
        <DesktopHero
          eyebrow="Bitcoin Utility Deck"
          title="도구"
          description={(
            <>
              BTC 전송 준비, 막힌 거래 복구, 상태 확인, 단위 계산, UTXO 정리, 재정거래 판단을 데스크톱 작업 흐름으로 다시 묶었습니다.
              상단에서 준비 단계를 보고, 중간에서 복구를 확인한 뒤, 마지막에 시장 판단으로 넘어가면 됩니다.
            </>
          )}
          action={<ToolsGuideContent />}
          sidebar={(
            <div className="space-y-3">
              <a href="#prepare" className="block border border-dot-border/35 bg-white/40 p-4 space-y-1 transition hover:border-dot-accent/20">
                <p className="desktop-kicker">Prepare</p>
                <p className="text-[13px] font-semibold text-dot-accent">전송 준비</p>
                <p className="text-[11px] leading-relaxed text-dot-sub">실제 vbytes를 추정하고 현재 mempool 기준 fee를 바로 계산합니다.</p>
              </a>
              <a href="#recover" className="block border border-dot-border/35 bg-white/40 p-4 space-y-1 transition hover:border-dot-accent/20">
                <p className="desktop-kicker">Recover</p>
                <p className="text-[13px] font-semibold text-dot-accent">막힌 거래 대응</p>
                <p className="text-[11px] leading-relaxed text-dot-sub">stage를 추적하고 필요하면 RBF 또는 CPFP로 구조를 바꿉니다.</p>
              </a>
              <a href="#market" className="block border border-dot-border/35 bg-white/40 p-4 space-y-1 transition hover:border-dot-accent/20">
                <p className="desktop-kicker">Market</p>
                <p className="text-[13px] font-semibold text-dot-accent">시장 판단</p>
                <p className="text-[11px] leading-relaxed text-dot-sub">BTC 재정거래가 의미 있는지 총비용 기준으로 검토합니다.</p>
              </a>
            </div>
          )}
        />
      </DotAssemblyReveal>

      {networkPulse ? (
        <DotAssemblyReveal delay={100} duration={700}>
          <div id="prepare">
          <ToolSection
            eyebrow="Prepare"
            title="전송 준비"
            description="전송 전에 필요한 계산을 한 번에 배치했습니다. 거래 크기와 fee를 먼저 잡고, 단위와 UTXO 계획까지 연결합니다."
          >
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] gap-6">
              <div className="min-w-0">
                <BitcoinTxSizeEstimator
                  feePressure={networkPulse.feePressure}
                  btcPriceUsd={networkPulse.marketContext.currentPriceUsd}
                />
              </div>
              <div className="min-w-0">
                <BitcoinFeeCalculator
                  feePressure={networkPulse.feePressure}
                  blockTempo={networkPulse.blockTempo}
                  btcPriceUsd={networkPulse.marketContext.currentPriceUsd}
                />
              </div>
            </div>
            <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-6">
              <div className="min-w-0">
                <BitcoinUnitConverter
                  btcPriceUsd={networkPulse.marketContext.currentPriceUsd}
                  btcPriceKrw={
                    usdKrw !== null ? networkPulse.marketContext.currentPriceUsd * usdKrw : null
                  }
                />
              </div>
              <div className="min-w-0">
                <BitcoinUtxoConsolidationPlanner
                  feePressure={networkPulse.feePressure}
                  btcPriceUsd={networkPulse.marketContext.currentPriceUsd}
                />
              </div>
            </div>
          </ToolSection>
          </div>
        </DotAssemblyReveal>
      ) : null}

      <DotAssemblyReveal delay={200} duration={720}>
        <div id="recover">
        <ToolSection
          eyebrow="Recover"
          title="막힌 거래 대응"
          description="이미 보낸 거래가 늦어졌다면 먼저 현재 stage를 확인하고, 이어서 필요한 추가 수수료를 계산하는 흐름이 가장 빠릅니다."
        >
          <div className={`grid gap-6 ${networkPulse ? 'grid-cols-[minmax(0,1fr)_minmax(0,1.06fr)]' : 'grid-cols-1'}`}>
            {networkPulse ? (
              <div className="min-w-0">
                <BitcoinStuckTxRescue feePressure={networkPulse.feePressure} />
              </div>
            ) : null}
            <div className="min-w-0">
              <BitcoinTxStatusTracker />
            </div>
          </div>
        </ToolSection>
        </div>
      </DotAssemblyReveal>

      <DotAssemblyReveal delay={300} duration={740}>
        <div id="market">
        <ToolSection
          eyebrow="Market"
          title="시장 판단"
          description="비용과 체결 시간까지 고려해 BTC 재정거래가 실제로 의미 있는지 마지막에 판단하는 영역입니다."
        >
          <div className="min-w-0">
            <ToolsArbitrageSection />
          </div>
        </ToolSection>
        </div>
      </DotAssemblyReveal>

    </div>
    </div>
  );
}
