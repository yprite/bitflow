'use client';

import type { CompositeSignal, SignalFactor, SignalLevel } from '@/lib/types';
import { getSignalColor } from './signal-badge';

interface SignalFactorsProps {
  signal: CompositeSignal;
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

export default function SignalFactors({ signal }: SignalFactorsProps) {
  const color = getSignalColor(signal.level);
  const keyDriverIdx = signal.factors.reduce(
    (maxIdx, f, i, arr) =>
      Math.abs(f.weightedScore) > Math.abs(arr[maxIdx].weightedScore) ? i : maxIdx,
    0
  );

  return (
    <div className="dot-card p-4 sm:p-5">
      <div className="dot-card-inner">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-dot-sub uppercase tracking-wider">팩터 분석</span>
            <span className="text-[9px] font-mono px-1 py-px bg-dot-accent/[0.06] text-dot-sub rounded-sm">
              핵심: {signal.factors[keyDriverIdx]?.label}
            </span>
          </div>
          <span className="text-sm font-mono font-semibold" style={{ color }}>
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
  );
}
