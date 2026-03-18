import type { ReactNode } from 'react';
import BitcoinFeeCalculator from '@/components/bitcoin-fee-calculator';
import BitcoinStuckTxRescue from '@/components/bitcoin-stuck-tx-rescue';
import BitcoinTxStatusTracker from '@/components/bitcoin-tx-status-tracker';
import BitcoinTxSizeEstimator from '@/components/bitcoin-tx-size-estimator';
import BitcoinUnitConverter from '@/components/bitcoin-unit-converter';
import BitcoinUtxoConsolidationPlanner from '@/components/bitcoin-utxo-consolidation-planner';
import ToolsArbitrageSection from '@/components/tools-arbitrage-section';
import { DesktopBulletList, DesktopHero, DesktopSectionHeader, DesktopStatCard, DesktopSurface } from '@/components/desktop/desktop-ui';
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

export default async function DesktopToolsPage() {
  const [networkPulse, usdKrw] = await Promise.all([
    fetchOnchainNetworkPulse(),
    fetchUsdKrw().catch(() => null),
  ]);

  return (
    <div className="space-y-6">
      <DesktopHero
        eyebrow="Bitcoin Utility Deck Desktop"
        title="도구 Desktop"
        description={(
          <>
            BTC 전송 준비, 막힌 거래 복구, 상태 확인, 단위 계산, UTXO 정리, 재정거래 판단을 데스크톱 작업 흐름으로 다시 묶었습니다.
            상단에서 준비 단계를 보고, 중간에서 복구를 확인한 뒤, 마지막에 시장 판단으로 넘어가면 됩니다.
          </>
        )}
        sidebar={(
          <div className="space-y-4">
            <DesktopStatCard label="준비" value="Size + Fee" tone="neutral" />
            <DesktopStatCard label="복구" value="RBF / CPFP" tone="neutral" />
            <DesktopStatCard label="운영" value="UTXO + Unit" tone="neutral" />
            <DesktopStatCard label="판단" value="Arbitrage" tone="neutral" />
          </div>
        )}
      />

      <div className="grid grid-cols-3 gap-4">
        <DesktopStatCard
          label="Prepare"
          value="전송 준비"
          detail="실제 vbytes를 추정하고 현재 mempool 기준 fee를 바로 계산합니다."
        />
        <DesktopStatCard
          label="Recover"
          value="막힌 거래 대응"
          detail="stage를 추적하고 필요하면 RBF 또는 CPFP로 구조를 바꿉니다."
        />
        <DesktopStatCard
          label="Market"
          value="시장 판단"
          detail="최종적으로 BTC 재정거래가 의미 있는지 총비용 기준으로 검토합니다."
        />
      </div>

      {networkPulse ? (
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
      ) : null}

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

      <ToolSection
        eyebrow="Market"
        title="시장 판단"
        description="비용과 체결 시간까지 고려해 BTC 재정거래가 실제로 의미 있는지 마지막에 판단하는 영역입니다."
      >
        <div className="min-w-0">
          <ToolsArbitrageSection />
        </div>
      </ToolSection>

      <DesktopSurface className="p-6">
        <DesktopSectionHeader
          eyebrow="Workflow"
          title="도구 사용 순서"
          description="데스크톱 버전에서도 실제 운영 순서는 동일합니다."
        />
        <div className="mt-6">
          <DesktopBulletList
            numbered
            items={[
              '먼저 Transaction Size Estimator로 예상 vbytes를 잡고, 바로 Fee Calculator에서 실제 송금 비용을 확인합니다.',
              '금액 체감이 애매하면 Unit Converter로 단위를 맞추고, 여러 입력을 합칠 계획이면 UTXO Consolidation Planner까지 같이 봅니다.',
              '거래가 막혔다면 TX Status Tracker에서 현재 stage를 확인한 뒤, Stuck TX Rescue에서 RBF와 CPFP 기준 추가 sats를 계산합니다.',
              'confirmations가 쌓이는 중인지, 아직 mempool 대기인지에 따라 단순 대기와 구조 변경을 구분해서 판단합니다.',
              '재정거래는 마지막 단계입니다. 호가 괴리보다 총비용과 예상 체결 시간을 먼저 확인한 뒤 실행 여부를 결정합니다.',
            ]}
          />
        </div>
      </DesktopSurface>
    </div>
  );
}
