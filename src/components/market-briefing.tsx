'use client';

import type { DashboardData } from '@/lib/types';
import { generateInsights, type MarketInsight, type MarketScenario } from '@/lib/market-insights';
import LivePulse from './motion/indicators/LivePulse';

interface MarketBriefingProps {
  data: DashboardData;
}

const SEVERITY_STYLES: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  warning: { border: 'border-red-200', bg: 'bg-red-50/60', text: 'text-dot-red', dot: '#e53935' },
  caution: { border: 'border-dot-border/40', bg: 'bg-white/40', text: 'text-dot-sub', dot: '#6b7280' },
  neutral: { border: 'border-gray-200', bg: 'bg-gray-50/60', text: 'text-dot-sub', dot: '#6b7280' },
  opportunity: { border: 'border-blue-200', bg: 'bg-blue-50/50', text: 'text-dot-blue', dot: '#1e88e5' },
};

function ScenarioAlert({ scenario }: { scenario: MarketScenario }) {
  const style = SEVERITY_STYLES[scenario.severity] || SEVERITY_STYLES.neutral;

  return (
    <div className={`p-3 border ${style.border} ${style.bg} mb-3`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: style.dot }} />
        <span className={`text-[11px] font-semibold ${style.text}`}>{scenario.name}</span>
      </div>
      <p className="text-[11px] text-dot-sub leading-relaxed">{scenario.description}</p>
    </div>
  );
}

function DriverRow({ label, value, direction, impact }: {
  label: string;
  value: string;
  direction: '과열' | '중립' | '침체';
  impact: 'high' | 'medium' | 'low';
}) {
  const dirColor = direction === '과열' ? '#e53935' : direction === '침체' ? '#1e88e5' : '#6b7280';
  const dirArrow = direction === '과열' ? '▲' : direction === '침체' ? '▼' : '—';
  const impactDots = impact === 'high' ? 3 : impact === 'medium' ? 2 : 1;

  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-1.5">
        <div className="flex gap-px">
          {Array.from({ length: 3 }).map((_, i) => (
            <span
              key={i}
              className="w-1 h-1 rounded-full"
              style={{
                backgroundColor: i < impactDots ? dirColor : '#e5e7eb',
              }}
            />
          ))}
        </div>
        <span className="text-[11px] text-dot-text">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-mono text-dot-sub">{value}</span>
        <span className="text-[9px]" style={{ color: dirColor }}>{dirArrow}</span>
      </div>
    </div>
  );
}

export default function MarketBriefing({ data }: MarketBriefingProps) {
  const insight = generateInsights(data);

  return (
    <div className="dot-card p-4 sm:p-5">
      <div className="dot-card-inner">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <LivePulse size={4} />
          시장 브리핑
        </h2>

        {/* Cross-indicator scenario alert */}
        {insight.scenario && <ScenarioAlert scenario={insight.scenario} />}

        {/* Action guide */}
        <div className="p-2.5 bg-dot-accent/[0.03] border border-dot-border/30 mb-3">
          <span className="text-[9px] text-dot-muted uppercase tracking-wider">행동 가이드</span>
          <p className="text-[11px] text-dot-text font-medium mt-0.5 leading-relaxed">
            {insight.actionGuide}
          </p>
        </div>

        {/* Top 3 drivers */}
        <div className="mb-3">
          <span className="text-[9px] text-dot-muted uppercase tracking-wider">온도 주도 요인 TOP 3</span>
          <div className="mt-1">
            {insight.topDrivers.map((d) => (
              <DriverRow key={d.label} {...d} />
            ))}
          </div>
        </div>

        {/* Risk & Relief */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {insight.keyRisk && (
            <div className="p-2 border border-red-100 bg-red-50/30">
              <span className="text-[9px] text-dot-red uppercase tracking-wider font-semibold">리스크</span>
              <p className="text-[10px] text-dot-sub mt-0.5 leading-relaxed">{insight.keyRisk.description}</p>
            </div>
          )}
          {insight.keyRelief && (
            <div className="p-2 border border-blue-100 bg-blue-50/30">
              <span className="text-[9px] text-dot-blue uppercase tracking-wider font-semibold">완화</span>
              <p className="text-[10px] text-dot-sub mt-0.5 leading-relaxed">{insight.keyRelief.description}</p>
            </div>
          )}
        </div>

        {/* Observation points */}
        <div className="border-t border-dashed border-dot-border/20 pt-2.5">
          <span className="text-[9px] text-dot-muted uppercase tracking-wider">관찰 포인트</span>
          <ul className="mt-1.5 space-y-1">
            {insight.observationPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-dot-muted/40 text-[10px] mt-px flex-shrink-0 font-mono">{i + 1}.</span>
                <span className="text-[10px] text-dot-sub leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
