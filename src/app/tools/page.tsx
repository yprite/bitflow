import BitcoinFeeCalculator from '@/components/bitcoin-fee-calculator';
import BitcoinUnitConverter from '@/components/bitcoin-unit-converter';
import GuideCard from '@/components/guide-card';
import HalvingCountdown from '@/components/halving-countdown';
import OnchainBlockTempoCard from '@/components/onchain-block-tempo-card';
import OnchainFeePressureCard from '@/components/onchain-fee-pressure-card';
import OnchainFeeRegimeHistoryCard from '@/components/onchain-fee-regime-history-card';
import PageHeader from '@/components/page-header';
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
          description="멀티코인 비교 대신, 비트코인 네트워크를 바로 읽고 실행에 옮길 수 있는 mempool · fee · block 도구만 모았습니다."
          action={(
            <div className="rounded-sm border border-dot-border/50 bg-white/70 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.16em] text-dot-sub">
              BTC only toolkit
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
              이 화면은 비트코인 트랜잭션 실행 전후에 바로 참고하는 실전형 툴킷입니다.
              먼저 수수료와 전송 단위를 계산하고, 그 다음 mempool 혼잡도와 블록 템포를 같이 보는 흐름을 권장합니다.
            </>
          )}
        >
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="border border-dot-border/60 p-3 dot-grid-sparse">
              <p className="text-[10px] text-dot-muted uppercase tracking-wider">Fee</p>
              <p className="mt-1 text-[11px] leading-relaxed text-dot-sub">
                전송 크기(vB)를 넣어 tier별 총 수수료를 바로 계산합니다. 급한 송금인지, 여유 있는 정산인지 먼저 결정하세요.
              </p>
            </div>
            <div className="border border-dot-border/60 p-3 dot-grid-sparse">
              <p className="text-[10px] text-dot-muted uppercase tracking-wider">Mempool</p>
              <p className="mt-1 text-[11px] leading-relaxed text-dot-sub">
                빠른 수수료 숫자 하나보다 대기 tx 수, projected block fee, 최근 블록 템포를 함께 봐야 현재 혼잡도를 정확히 읽을 수 있습니다.
              </p>
            </div>
            <div className="border border-dot-border/60 p-3 dot-grid-sparse">
              <p className="text-[10px] text-dot-muted uppercase tracking-wider">Cycle</p>
              <p className="mt-1 text-[11px] leading-relaxed text-dot-sub">
                반감기와 difficulty epoch은 장기 타이밍용입니다. 단기 실행은 mempool, 장기 문맥은 반감기로 나눠서 보세요.
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
        <section className="grid gap-3 lg:grid-cols-3">
          <HalvingCountdown />
          {networkPulse ? <OnchainFeePressureCard data={networkPulse.feePressure} /> : null}
          {networkPulse ? <OnchainBlockTempoCard data={networkPulse.blockTempo} /> : null}
        </section>
      </DotAssemblyReveal>

      {networkPulse ? (
        <DotAssemblyReveal delay={300} duration={760}>
          <OnchainFeeRegimeHistoryCard data={networkPulse.feeHistory} />
        </DotAssemblyReveal>
      ) : null}

      <DotAssemblyReveal delay={360} duration={620} density="low">
        <section className="dot-card p-5 sm:p-6 space-y-3">
          <h2 className="text-xs font-semibold text-dot-accent uppercase tracking-wider">
            비트코인 도구 사용 순서
          </h2>
          <ul className="space-y-2 text-xs text-dot-sub leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-dot-muted/50 font-mono">01</span>
              <span>먼저 전송 크기를 대략 잡고 Fee Calculator에서 즉시/30분/1시간 tier 비용 차이를 확인하세요.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-dot-muted/50 font-mono">02</span>
              <span>Mempool / Fee Pressure와 Block Tempo를 같이 보고, 지금이 혼잡 급등 구간인지 단순 일시 정체인지 구분하세요.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-dot-muted/50 font-mono">03</span>
              <span>금액 감이 잘 안 오면 BTC / sats Converter로 달러 기준 체감 비용을 먼저 맞춘 뒤 전송 결정을 내리는 편이 안전합니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-dot-muted/50 font-mono">04</span>
              <span>Halving Countdown은 장기 문맥용입니다. 단기 체결 판단은 반감기보다 mempool과 최근 블록 템포가 더 중요합니다.</span>
            </li>
          </ul>
        </section>
      </DotAssemblyReveal>
    </div>
  );
}
