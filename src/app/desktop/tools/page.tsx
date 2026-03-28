import type { ReactNode } from 'react';
import Link from 'next/link';
import BitcoinFeeCalculator from '@/components/bitcoin-fee-calculator';
import BitcoinStuckTxRescue from '@/components/bitcoin-stuck-tx-rescue';
import BitcoinTxStatusTracker from '@/components/bitcoin-tx-status-tracker';
import BitcoinTxSizeEstimator from '@/components/bitcoin-tx-size-estimator';
import BitcoinUnitConverter from '@/components/bitcoin-unit-converter';
import BitcoinUtxoConsolidationPlanner from '@/components/bitcoin-utxo-consolidation-planner';
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
      <div className="mt-6 space-y-6">{children}</div>
    </DesktopSurface>
  );
}


export default async function DesktopToolsPage() {
  const [networkPulse, usdKrw] = await Promise.all([
    fetchOnchainNetworkPulse(),
    fetchUsdKrw().catch(() => null),
  ]);

  return (
    <div className="magazine-content pt-20 pb-16">
      <Link href="/desktop" className="mb-6 inline-flex text-[10px] uppercase tracking-[0.02em] text-dot-muted hover:text-dot-accent">개요</Link>
    <div className="space-y-6">
      <DesktopHero
        eyebrow="Bitcoin Utility Deck"
        title="도구"
        description="BTC 전송 준비, 막힌 거래 복구, 상태 확인, 단위 계산, UTXO 정리, 재정거래 판단을 데스크톱 작업 흐름으로 묶었습니다."
      />

      {networkPulse ? (
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
      ) : null}

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

    </div>
    </div>
  );
}
