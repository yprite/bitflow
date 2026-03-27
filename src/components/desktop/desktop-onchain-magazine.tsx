import { Masthead } from '@/components/desktop/magazine/masthead';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { LightSection } from '@/components/desktop/magazine/light-section';
import { DarkSection } from '@/components/desktop/magazine/dark-section';
import { MagazineFooter } from '@/components/desktop/magazine/magazine-footer';
import { FloatingProgress } from '@/components/desktop/magazine/floating-progress';
import { ParallaxDots, DARK_PARALLAX_LAYERS } from '@/components/motion/parallax-dots';
import OnchainRegimeCard from '@/components/onchain-regime-card';
import OnchainWhaleSummaryCard from '@/components/onchain-whale-summary-card';
import OnchainDormancyPulseCard from '@/components/onchain-dormancy-pulse-card';
import OnchainFlowPressureCard from '@/components/onchain-flow-pressure-card';
import OnchainAgeBandCard from '@/components/onchain-age-band-card';
import OnchainSupportResistanceCard from '@/components/onchain-support-resistance-card';
import OnchainMetricCard from '@/components/onchain-metric-card';
import OnchainEntityFlowCard from '@/components/onchain-entity-flow-card';
import HalvingCountdown from '@/components/halving-countdown';
import OnchainFeePressureCard from '@/components/onchain-fee-pressure-card';
import OnchainFeeRegimeHistoryCard from '@/components/onchain-fee-regime-history-card';
import OnchainBlockTempoCard from '@/components/onchain-block-tempo-card';
import type { OnchainSummaryData, OnchainNetworkPulseData } from '@/lib/types';
import {
  deriveOnchainAgeBands,
  deriveOnchainBriefing,
  deriveOnchainDormancyPulse,
  deriveOnchainFlowPressure,
  deriveOnchainRegime,
  deriveOnchainSupportResistance,
  deriveOnchainWhaleSummary,
} from '@/lib/onchain-monitor';

const ONCHAIN_SECTIONS = [
  { id: 'onchain-masthead', label: '마스트헤드' },
  { id: 'onchain-regime', label: '레짐' },
  { id: 'onchain-metrics', label: '지표' },
  { id: 'onchain-entity', label: '엔티티 흐름' },
];

interface Props {
  summary: OnchainSummaryData;
  networkPulse: OnchainNetworkPulseData | null;
}

export default function DesktopOnchainMagazine({ summary, networkPulse }: Props) {
  // Derive all analysis data (same logic as src/app/desktop/onchain/page.tsx)
  const visibleMetrics = summary.metrics.filter((m) => m.latestValue !== null);
  const regime = deriveOnchainRegime(summary.metrics, summary.alertStats);
  const whaleSummary = summary.status === 'available' ? deriveOnchainWhaleSummary(summary.alerts) : null;
  const dormancyPulse = deriveOnchainDormancyPulse(summary.metrics);
  const flowPressure = deriveOnchainFlowPressure(summary.entityFlows);
  const ageBands = deriveOnchainAgeBands(summary.metrics);
  const supportResistance = deriveOnchainSupportResistance(
    networkPulse?.marketContext ?? null, regime, whaleSummary, dormancyPulse, flowPressure,
  );
  const briefing = deriveOnchainBriefing({
    regime, whaleSummary, feePressure: networkPulse?.feePressure ?? null,
    dormancyPulse, flowPressure, ageBands, levels: supportResistance,
  });
  const feeHistory = networkPulse?.feeHistory ?? null;
  const visibleEntityFlows = summary.entityFlows.slice(0, 6);

  // Block height for masthead meta
  const latestBlock = networkPulse?.blockTempo?.currentHeight ?? '—';

  return (
    <>
      <FloatingProgress sections={ONCHAIN_SECTIONS} />

      {/* Section 1: Masthead */}
      <section id="onchain-masthead">
        <Masthead
          edition="BITFLOW ON-CHAIN"
          meta={`${new Date().toISOString().slice(0, 10).replace(/-/g, '.')} · Block #${latestBlock}`}
          headline={briefing?.headline ?? '온체인 네트워크 분석'}
          subhead={briefing?.summary}
        />
      </section>

      {/* Section 2: Regime Analysis — 2-column */}
      <LightSection id="onchain-regime" className="bg-white">
        <div className="text-[10px] text-dot-sub uppercase tracking-[3px] mb-6">
          Network Regime
        </div>
        <div className="grid grid-cols-2 gap-6">
          <ScrollReveal>
            <div className="min-w-0">
              {regime ? <OnchainRegimeCard regime={regime} /> : null}
            </div>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <div className="min-w-0">
              {whaleSummary ? <OnchainWhaleSummaryCard summary={whaleSummary} /> : null}
            </div>
          </ScrollReveal>
        </div>

        {/* Dormancy + Flow Pressure */}
        <div className="grid grid-cols-2 gap-6 mt-6">
          <ScrollReveal delay={150}>
            <div className="min-w-0">
              {dormancyPulse ? <OnchainDormancyPulseCard data={dormancyPulse} /> : null}
            </div>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <div className="min-w-0">
              {flowPressure ? <OnchainFlowPressureCard data={flowPressure} /> : null}
            </div>
          </ScrollReveal>
        </div>

        {/* Age Bands + Support/Resistance */}
        <div className="grid grid-cols-2 gap-6 mt-6">
          <ScrollReveal delay={250}>
            <div className="min-w-0">
              {ageBands ? <OnchainAgeBandCard data={ageBands} /> : null}
            </div>
          </ScrollReveal>
          <ScrollReveal delay={300}>
            <div className="min-w-0">
              {supportResistance ? <OnchainSupportResistanceCard data={supportResistance} /> : null}
            </div>
          </ScrollReveal>
        </div>

        {/* Network Pulse: Halving + Fee + Block */}
        <div className="mt-8">
          <div className="text-[10px] text-dot-sub uppercase tracking-[3px] mb-4">
            Network Pulse
          </div>
          <div className="grid grid-cols-2 gap-6">
            <ScrollReveal delay={350}><div className="min-w-0"><HalvingCountdown /></div></ScrollReveal>
            <ScrollReveal delay={400}><div className="min-w-0">{networkPulse ? <OnchainFeePressureCard data={networkPulse.feePressure} /> : null}</div></ScrollReveal>
            <ScrollReveal delay={450}><div className="min-w-0">{feeHistory ? <OnchainFeeRegimeHistoryCard data={feeHistory} /> : null}</div></ScrollReveal>
            <ScrollReveal delay={500}><div className="min-w-0">{networkPulse ? <OnchainBlockTempoCard data={networkPulse.blockTempo} /> : null}</div></ScrollReveal>
          </div>
        </div>
      </LightSection>

      {/* Section 3: Metrics Grid — 3-column */}
      {visibleMetrics.length > 0 && (
        <LightSection id="onchain-metrics">
          <div className="text-[10px] text-dot-sub uppercase tracking-[3px] mb-6">
            On-chain Metrics
          </div>
          <div className="grid grid-cols-3 gap-5">
            {visibleMetrics.map((metric, i) => (
              <ScrollReveal key={metric.id} delay={i * 40}>
                <div className="min-w-0"><OnchainMetricCard metric={metric} /></div>
              </ScrollReveal>
            ))}
          </div>
        </LightSection>
      )}

      {/* Section 4: Entity Flow — dark */}
      {visibleEntityFlows.length > 0 && (
        <DarkSection id="onchain-entity">
          <div className="relative">
            <ParallaxDots layers={DARK_PARALLAX_LAYERS} />
            <div className="relative z-10">
              <div className="text-[10px] text-dot-muted uppercase tracking-[3px] mb-6">
                Entity Flow
              </div>
              <ScrollReveal>
                <OnchainEntityFlowCard flows={visibleEntityFlows} />
              </ScrollReveal>
            </div>
          </div>
        </DarkSection>
      )}

      {/* Section 5: Footer */}
      <MagazineFooter
        links={[
          { label: '← 메인 매거진', sublabel: '오늘의 브리핑', href: '/desktop' },
          { label: '주간 아카이브 →', sublabel: '지난 이야기', href: '/desktop/weekly' },
        ]}
      />
    </>
  );
}
