import BitcoinFeeCalculator from '@/components/bitcoin-fee-calculator';
import BitcoinUnitConverter from '@/components/bitcoin-unit-converter';
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
          description="비트코인 전송 비용 계산, 단위 환산, 그리고 재정거래 판단에 필요한 최소 도구만 남겼습니다."
          action={(
            <div className="rounded-sm border border-dot-border/50 bg-white/70 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.16em] text-dot-sub">
              3 tools only
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
              이 화면은 세 가지 용도만 남겼습니다.
              비트코인 전송 수수료를 잡고, 단위를 빠르게 환산하고, 마지막으로 시장 간 괴리를 재정거래 관점에서 계산하는 흐름입니다.
            </>
          )}
        >
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="border border-dot-border/60 p-3 dot-grid-sparse">
              <p className="text-[10px] text-dot-muted uppercase tracking-wider">Fee</p>
              <p className="mt-1 text-[11px] leading-relaxed text-dot-sub">
                전송 크기(vB)를 넣어 즉시, 30분, 1시간 tier별 총 수수료를 바로 계산합니다.
              </p>
            </div>
            <div className="border border-dot-border/60 p-3 dot-grid-sparse">
              <p className="text-[10px] text-dot-muted uppercase tracking-wider">Converter</p>
              <p className="mt-1 text-[11px] leading-relaxed text-dot-sub">
                달러, BTC, sats 중 하나를 기준으로 다른 단위 체감치를 바로 확인할 수 있습니다.
              </p>
            </div>
            <div className="border border-dot-border/60 p-3 dot-grid-sparse">
              <p className="text-[10px] text-dot-muted uppercase tracking-wider">Arbitrage</p>
              <p className="mt-1 text-[11px] leading-relaxed text-dot-sub">
                국내외 호가 차이와 수수료를 반영해 실제로 수익이 남는지 계산기로 바로 점검합니다.
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
        <ToolsArbitrageSection />
      </DotAssemblyReveal>

      <DotAssemblyReveal delay={300} duration={620} density="low">
        <section className="dot-card p-5 sm:p-6 space-y-3">
          <h2 className="text-xs font-semibold text-dot-accent uppercase tracking-wider">
            비트코인 도구 사용 순서
          </h2>
          <ul className="space-y-2 text-xs text-dot-sub leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-dot-muted/50 font-mono">01</span>
              <span>먼저 Fee Calculator에서 거래 크기 기준 수수료 tier를 보고, 지금 허용 가능한 전송 비용 범위를 정하세요.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-dot-muted/50 font-mono">02</span>
              <span>금액 감이 애매하면 BTC / sats Converter로 달러와 sats 기준 체감치를 먼저 맞추는 편이 빠릅니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-dot-muted/50 font-mono">03</span>
              <span>재정거래는 마지막 단계입니다. 국내외 호가 괴리보다 총비용과 예상 체결 시간을 먼저 확인한 뒤 진입 여부를 판단하세요.</span>
            </li>
          </ul>
        </section>
      </DotAssemblyReveal>
    </div>
  );
}
