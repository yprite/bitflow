'use client';

import { useState } from 'react';
import type { CompositeSignal, SignalFactor, SignalLevel, TrendDirection } from '@/lib/types';
import InsightBloom from './motion/indicators/InsightBloom';
import SignalField from './motion/indicators/SignalField';
import DotMorphTransition from './motion/transitions/DotMorphTransition';
import LivePulse from './motion/indicators/LivePulse';
import BtcSparkline from './btc-sparkline';

interface SignalBadgeProps {
  signal: CompositeSignal;
}

export function getSignalColor(level: SignalLevel): string {
  switch (level) {
    case '극과열': return '#c62828';
    case '과열': return '#e53935';
    case '침체': return '#1e88e5';
    case '극침체': return '#1565c0';
    default: return '#9ca3af';
  }
}

function getTrendIcon(trend: TrendDirection): string {
  switch (trend) {
    case '급상승': return '⬆';
    case '상승': return '↗';
    case '하락': return '↘';
    case '급하락': return '⬇';
    default: return '→';
  }
}

function getTrendColor(trend: TrendDirection): string {
  switch (trend) {
    case '급상승': return '#c62828';
    case '상승': return '#e53935';
    case '하락': return '#1e88e5';
    case '급하락': return '#1565c0';
    default: return '#6b7280';
  }
}

function getSignalFieldLevel(level: SignalLevel): '과열' | '중립' | '침체' {
  if (level === '극과열' || level === '과열') return '과열';
  if (level === '극침체' || level === '침체') return '침체';
  return '중립';
}

function getFactorColor(direction: string): string {
  switch (direction) {
    case '과열': return '#e53935';
    case '침체': return '#1e88e5';
    default: return '#6b7280';
  }
}

function getFactorArrow(direction: string): string {
  switch (direction) {
    case '과열': return '▲';
    case '침체': return '▼';
    default: return '—';
  }
}

function ScoreGauge({ score, level }: { score: number; level: SignalLevel }) {
  const pct = Math.max(0, Math.min(100, ((score + 100) / 200) * 100));
  const color = getSignalColor(level);

  return (
    <div className="w-full mt-2 mb-1">
      <div className="relative h-1.5 rounded-full bg-dot-border/30 overflow-hidden">
        <div className="absolute left-[20%] top-0 bottom-0 w-px bg-dot-border/20" />
        <div className="absolute left-[35%] top-0 bottom-0 w-px bg-dot-border/20" />
        <div className="absolute left-[65%] top-0 bottom-0 w-px bg-dot-border/20" />
        <div className="absolute left-[80%] top-0 bottom-0 w-px bg-dot-border/20" />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full transition-all duration-700 ease-out"
          style={{
            left: `calc(${pct}% - 5px)`,
            backgroundColor: color,
            boxShadow: `0 0 6px ${color}60`,
          }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[8px] text-blue-500/60 font-mono">극침체</span>
        <span className="text-[8px] text-blue-400/50 font-mono">침체</span>
        <span className="text-[8px] text-dot-muted/40 font-mono">중립</span>
        <span className="text-[8px] text-red-400/50 font-mono">과열</span>
        <span className="text-[8px] text-red-500/60 font-mono">극과열</span>
      </div>
    </div>
  );
}

function TrendBadge({ trend, scoreChange }: { trend: TrendDirection; scoreChange: number }) {
  const icon = getTrendIcon(trend);
  const color = getTrendColor(trend);
  const changeText = scoreChange > 0 ? `+${scoreChange}` : `${scoreChange}`;

  if (trend === '보합' && scoreChange === 0) return null;

  return (
    <div
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono"
      style={{ backgroundColor: `${color}15`, color }}
    >
      <span>{icon}</span>
      <span>{trend}</span>
      {scoreChange !== 0 && <span className="opacity-70">({changeText})</span>}
    </div>
  );
}

function WeightBar({ weight }: { weight: number }) {
  const widthPct = Math.round((weight / 2.0) * 100);
  return (
    <div className="w-6 h-1 rounded-full bg-dot-border/20 overflow-hidden">
      <div
        className="h-full rounded-full bg-dot-muted/40"
        style={{ width: `${widthPct}%` }}
      />
    </div>
  );
}

function FactorRow({ factor, isKeyDriver }: { factor: SignalFactor; isKeyDriver?: boolean }) {
  const color = getFactorColor(factor.direction);
  const arrow = getFactorArrow(factor.direction);

  return (
    <div
      className={`flex items-center justify-between py-0.5 px-1 -mx-1 rounded-sm transition-colors ${
        isKeyDriver ? 'bg-dot-accent/[0.04]' : ''
      }`}
    >
      <div className="flex items-center gap-1">
        {isKeyDriver && (
          <span className="w-1 h-1 rounded-full bg-dot-accent/60 flex-shrink-0" />
        )}
        <span className={`text-[10px] ${isKeyDriver ? 'text-dot-text font-medium' : 'text-dot-muted'}`}>
          {factor.label}
        </span>
        <WeightBar weight={factor.weight} />
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`text-[10px] font-mono ${isKeyDriver ? 'text-dot-text font-semibold' : 'text-dot-sub'}`}>
          {factor.value}
        </span>
        <span className="text-[9px]" style={{ color }}>{arrow}</span>
      </div>
    </div>
  );
}

function FactorSummaryStrip({ factors }: { factors: SignalFactor[] }) {
  const overheated = factors.filter((f) => f.direction === '과열').length;
  const cooled = factors.filter((f) => f.direction === '침체').length;
  const neutral = factors.length - overheated - cooled;

  return (
    <div className="flex items-center gap-2">
      {overheated > 0 && (
        <span className="text-[10px] font-mono text-dot-red">{overheated} 과열</span>
      )}
      {neutral > 0 && (
        <span className="text-[10px] font-mono text-dot-muted">{neutral} 중립</span>
      )}
      {cooled > 0 && (
        <span className="text-[10px] font-mono text-dot-blue">{cooled} 침체</span>
      )}
    </div>
  );
}

export default function SignalBadge({ signal }: SignalBadgeProps) {
  const [expanded, setExpanded] = useState(false);
  const color = getSignalColor(signal.level);
  const fieldLevel = getSignalFieldLevel(signal.level);

  const keyDriverIdx = signal.factors.reduce(
    (maxIdx, f, i, arr) =>
      Math.abs(f.weightedScore) > Math.abs(arr[maxIdx].weightedScore) ? i : maxIdx,
    0
  );

  return (
    <div className="dot-card p-4 sm:p-5 relative overflow-hidden">
      <BtcSparkline level={signal.level} />
      <SignalField level={fieldLevel} width={240} height={120} />

      <div className="dot-card-inner">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <LivePulse size={4} color={color} />
          시장 온도
        </h2>
        <div className="flex items-center gap-2 mb-3">
          <p className="text-[10px] text-dot-muted/60">11개 지표 가중 종합</p>
          <TrendBadge trend={signal.trend} scoreChange={signal.scoreChange} />
        </div>

        <div className="relative">
          <DotMorphTransition
            text={`${signal.normalizedScore > 0 ? '+' : ''}${signal.normalizedScore}°`}
            fontScale={5}
            mode="dissolve"
            morphDuration={600}
            color={color}
          />
          <InsightBloom trigger={signal.level} dotCount={5} travelDistance={18} dotSize={2} color={color} />
        </div>

        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[10px] font-mono text-dot-muted/50">점수</span>
          <span className="text-sm font-semibold" style={{ color }}>
            {signal.level}
          </span>
          <span className="text-[9px] text-dot-muted/40 font-mono">/ 100</span>
        </div>

        <ScoreGauge score={signal.normalizedScore} level={signal.level} />

        <p className="dot-insight" style={{ borderTopStyle: 'none', paddingTop: 0, marginTop: '8px' }}>
          {signal.description}
        </p>

        {/* Disclosure toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full mt-3 pt-2.5 border-t border-dashed border-dot-border/20 flex items-center justify-between group"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-dot-muted group-hover:text-dot-accent transition">
              {expanded ? '팩터 분석 접기' : '팩터 분석 보기'}
            </span>
            <FactorSummaryStrip factors={signal.factors} />
          </div>
          <span
            className="text-[10px] text-dot-muted group-hover:text-dot-accent transition font-mono inline-block"
            style={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.25s ease',
            }}
          >
            ▾
          </span>
        </button>

        {/* Expandable factor panel */}
        <div
          className="overflow-hidden transition-all ease-out"
          style={{
            maxHeight: expanded ? '400px' : '0px',
            opacity: expanded ? 1 : 0,
            transitionDuration: expanded ? '0.35s' : '0.2s',
          }}
        >
          <div className="pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-mono px-1 py-px bg-dot-accent/[0.06] text-dot-sub rounded-sm">
                핵심: {signal.factors[keyDriverIdx]?.label}
              </span>
              <span className="text-xs font-mono font-semibold" style={{ color }}>
                {signal.normalizedScore > 0 ? '+' : ''}{signal.normalizedScore}°
              </span>
            </div>
            <div className="space-y-0.5">
              {signal.factors.map((f, i) => (
                <FactorRow key={f.label} factor={f} isKeyDriver={i === keyDriverIdx} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
