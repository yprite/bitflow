'use client';

import { useRef, useState } from 'react';
import type { OnchainFeePressureData } from '@/lib/types';
import { trackEvent } from '@/lib/event-tracker';
import {
  clampCount,
  clampFeeRate,
  estimateCpfpPackage,
  estimateRbfReplacement,
} from '@/lib/bitcoin-tools';

interface BitcoinStuckTxRescueProps {
  feePressure: OnchainFeePressureData;
}

function formatSats(value: number): string {
  return `${Math.round(value).toLocaleString('ko-KR')} sats`;
}

function formatFeeRate(value: number): string {
  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: value < 1 ? 2 : 1,
    maximumFractionDigits: value < 1 ? 2 : 1,
  })} sat/vB`;
}

type TargetTier = 'fastest' | 'halfHour' | 'hour';

export default function BitcoinStuckTxRescue({
  feePressure,
}: BitcoinStuckTxRescueProps) {
  const trackedEngagement = useRef(false);
  const [parentSizeInput, setParentSizeInput] = useState('180');
  const [currentFeeRateInput, setCurrentFeeRateInput] = useState('2');
  const [childSizeInput, setChildSizeInput] = useState('140');
  const [targetTier, setTargetTier] = useState<TargetTier>('halfHour');

  const parentVbytes = clampCount(parentSizeInput, 180, 60, 100_000);
  const childVbytes = clampCount(childSizeInput, 140, 60, 100_000);
  const currentFeeRate = clampFeeRate(currentFeeRateInput, 2, 0, 1_000);
  const targetFeeRate =
    targetTier === 'fastest'
      ? feePressure.fastestFee
      : targetTier === 'halfHour'
        ? feePressure.halfHourFee
        : feePressure.hourFee;

  const rbf = estimateRbfReplacement({
    vbytes: parentVbytes,
    currentFeeRate,
    targetFeeRate,
  });
  const cpfp = estimateCpfpPackage({
    parentVbytes,
    parentFeeRate: currentFeeRate,
    childVbytes,
    targetPackageFeeRate: targetFeeRate,
  });

  const tierButtons: Array<{ key: TargetTier; label: string; feeRate: number }> = [
    { key: 'fastest', label: '즉시', feeRate: feePressure.fastestFee },
    { key: 'halfHour', label: '30분', feeRate: feePressure.halfHourFee },
    { key: 'hour', label: '1시간', feeRate: feePressure.hourFee },
  ];

  const trackEngagement = () => {
    if (trackedEngagement.current) return;
    trackedEngagement.current = true;
    trackEvent('tools_stuck_tx_rescue_used', '/tools', {
      targetTier,
    });
  };

  return (
    <article className="dot-card h-full p-4 sm:p-5">
      <div className="dot-card-inner space-y-4">
        <div className="space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">
            Stuck TX Rescue
          </p>
          <h2 className="text-lg font-semibold tracking-tight text-dot-accent">
            {formatFeeRate(targetFeeRate)}
          </h2>
          <p className="text-xs leading-relaxed text-dot-sub">
            이미 보낸 거래가 느릴 때, RBF 또는 CPFP로 현재 mempool 기준 얼마를 더 붙여야 하는지 계산합니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {tierButtons.map((tier) => (
            <button
              key={tier.key}
              type="button"
              onClick={() => {
                setTargetTier(tier.key);
                trackEngagement();
              }}
              className={`rounded-sm border px-2 py-1 text-[10px] font-mono uppercase tracking-[0.12em] transition ${
                targetTier === tier.key
                  ? 'border-dot-accent bg-dot-accent text-white'
                  : 'border-dot-border/50 text-dot-sub hover:border-dot-accent hover:text-dot-accent'
              }`}
            >
              {tier.label} · {formatFeeRate(tier.feeRate)}
            </button>
          ))}
        </div>

        <div className="grid gap-3 rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3 sm:grid-cols-3">
          <label className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-dot-muted">
              Parent Size
            </span>
            <input
              inputMode="numeric"
              value={parentSizeInput}
              onChange={(event) => {
                setParentSizeInput(event.target.value);
                trackEngagement();
              }}
              className="w-full border border-dot-border bg-white px-3 py-2 text-sm font-mono text-dot-accent outline-none transition focus:border-dot-accent"
            />
          </label>

          <label className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-dot-muted">
              Paid Fee
            </span>
            <input
              inputMode="decimal"
              value={currentFeeRateInput}
              onChange={(event) => {
                setCurrentFeeRateInput(event.target.value);
                trackEngagement();
              }}
              className="w-full border border-dot-border bg-white px-3 py-2 text-sm font-mono text-dot-accent outline-none transition focus:border-dot-accent"
            />
          </label>

          <label className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-dot-muted">
              Child Size
            </span>
            <input
              inputMode="numeric"
              value={childSizeInput}
              onChange={(event) => {
                setChildSizeInput(event.target.value);
                trackEngagement();
              }}
              className="w-full border border-dot-border bg-white px-3 py-2 text-sm font-mono text-dot-accent outline-none transition focus:border-dot-accent"
            />
          </label>
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-dot-muted">RBF</p>
              <span className="text-[10px] font-mono text-dot-muted">{parentVbytes} vB</span>
            </div>
            <p className="text-sm font-semibold text-dot-accent">
              {formatSats(rbf.additionalFeeSats)}
            </p>
            <p className="text-[11px] text-dot-sub">
              교체 거래 기준 총 수수료는 {formatSats(rbf.replacementFeeSats)}입니다.
            </p>
            <p className="text-[11px] text-dot-muted">
              {rbf.additionalFeeSats === 0
                ? '현재 지불한 fee rate가 이미 목표 tier 이상입니다.'
                : '동일한 parent tx를 더 높은 수수료로 교체하는 기준입니다.'}
            </p>
          </div>

          <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-dot-muted">CPFP</p>
              <span className="text-[10px] font-mono text-dot-muted">{childVbytes} vB child</span>
            </div>
            <p className="text-sm font-semibold text-dot-accent">
              {formatFeeRate(cpfp.childFeeRate)}
            </p>
            <p className="text-[11px] text-dot-sub">
              child tx에 최소 {formatSats(cpfp.childFeeSats)}를 붙여 package 평균을 끌어올리는 기준입니다.
            </p>
            <p className="text-[11px] text-dot-muted">
              parent + child 묶음 전체가 목표 fee rate를 넘도록 계산합니다.
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
