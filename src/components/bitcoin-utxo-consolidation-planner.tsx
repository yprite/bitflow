'use client';

import { useRef, useState } from 'react';
import type { OnchainFeePressureData } from '@/lib/types';
import { trackEvent } from '@/lib/event-tracker';
import {
  BITCOIN_SCRIPT_PROFILES,
  type BitcoinScriptProfile,
  clampCount,
  estimateTransactionVbytes,
  satsForFeeRate,
} from '@/lib/bitcoin-tools';

interface BitcoinUtxoConsolidationPlannerProps {
  feePressure: OnchainFeePressureData;
  btcPriceUsd: number;
}

const SCRIPT_PROFILE_OPTIONS = Object.entries(BITCOIN_SCRIPT_PROFILES) as Array<
  [BitcoinScriptProfile, (typeof BITCOIN_SCRIPT_PROFILES)[BitcoinScriptProfile]]
>;

function formatSats(value: number): string {
  return `${value.toLocaleString('ko-KR')} sats`;
}

function formatUsd(value: number): string {
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: value < 10 ? 2 : 0,
    maximumFractionDigits: value < 10 ? 2 : 0,
  })}`;
}

function consolidationWindowLabel(
  feePressure: OnchainFeePressureData
): { label: string; tone: string; summary: string } {
  if (feePressure.economyFee <= 2 && feePressure.pressure === '완화') {
    return {
      label: '좋음',
      tone: 'text-dot-green',
      summary: '낮은 수수료 구간이라 UTXO 정리 비용이 비교적 작습니다.',
    };
  }

  if (feePressure.economyFee <= 5) {
    return {
      label: '무난',
      tone: 'text-dot-yellow',
      summary: '정리할 수는 있지만, 급하지 않다면 더 낮은 구간을 기다릴 여지도 있습니다.',
    };
  }

  return {
    label: '비효율',
    tone: 'text-dot-red',
    summary: '수수료가 비싼 편이라 큰 정리는 미루는 쪽이 유리할 수 있습니다.',
  };
}

export default function BitcoinUtxoConsolidationPlanner({
  feePressure,
  btcPriceUsd,
}: BitcoinUtxoConsolidationPlannerProps) {
  const trackedEngagement = useRef(false);
  const [inputProfile, setInputProfile] = useState<BitcoinScriptProfile>('p2wpkh');
  const [outputProfile, setOutputProfile] = useState<BitcoinScriptProfile>('p2wpkh');
  const [inputCountInput, setInputCountInput] = useState('6');
  const [outputCountInput, setOutputCountInput] = useState('1');

  const inputCount = clampCount(inputCountInput, 6, 1, 500);
  const outputCount = clampCount(outputCountInput, 1, 1, 20);
  const vbytes = estimateTransactionVbytes({
    inputCount,
    outputCount,
    inputProfile,
    outputProfile,
  });
  const economySats = satsForFeeRate(vbytes, feePressure.economyFee);
  const hourSats = satsForFeeRate(vbytes, feePressure.hourFee);
  const fastestSats = satsForFeeRate(vbytes, feePressure.fastestFee);
  const window = consolidationWindowLabel(feePressure);

  const trackEngagement = () => {
    if (trackedEngagement.current) return;
    trackedEngagement.current = true;
    trackEvent('tools_utxo_planner_used', '/tools', {
      inputProfile,
      outputProfile,
    });
  };

  return (
    <article className="dot-card h-full p-4 sm:p-5">
      <div className="dot-card-inner space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">
              UTXO Consolidation Planner
            </p>
            <h2 className="text-lg font-semibold tracking-tight text-dot-accent">
              {vbytes.toLocaleString('ko-KR')} vB
            </h2>
          </div>
          <span className={`rounded-sm border border-dot-border/40 bg-white/70 px-2 py-1 text-[10px] font-mono uppercase tracking-[0.14em] ${window.tone}`}>
            {window.label}
          </span>
        </div>

        <p className="text-xs leading-relaxed text-dot-sub">
          여러 개의 작은 UTXO를 한 번에 합칠 때 현재 네트워크 환경에서 얼마가 드는지 계산합니다.
        </p>

        <div className="grid gap-3 rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-dot-muted">
              Input Type
            </span>
            <select
              value={inputProfile}
              onChange={(event) => {
                setInputProfile(event.target.value as BitcoinScriptProfile);
                trackEngagement();
              }}
              className="w-full border border-dot-border bg-white px-3 py-2 text-sm font-mono text-dot-accent outline-none transition focus:border-dot-accent"
            >
              {SCRIPT_PROFILE_OPTIONS.map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-dot-muted">
              Output Type
            </span>
            <select
              value={outputProfile}
              onChange={(event) => {
                setOutputProfile(event.target.value as BitcoinScriptProfile);
                trackEngagement();
              }}
              className="w-full border border-dot-border bg-white px-3 py-2 text-sm font-mono text-dot-accent outline-none transition focus:border-dot-accent"
            >
              {SCRIPT_PROFILE_OPTIONS.map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-dot-muted">
              UTXO Count
            </span>
            <input
              inputMode="numeric"
              value={inputCountInput}
              onChange={(event) => {
                setInputCountInput(event.target.value);
                trackEngagement();
              }}
              className="w-full border border-dot-border bg-white px-3 py-2 text-sm font-mono text-dot-accent outline-none transition focus:border-dot-accent"
            />
          </label>

          <label className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-dot-muted">
              Target Outputs
            </span>
            <input
              inputMode="numeric"
              value={outputCountInput}
              onChange={(event) => {
                setOutputCountInput(event.target.value);
                trackEngagement();
              }}
              className="w-full border border-dot-border bg-white px-3 py-2 text-sm font-mono text-dot-accent outline-none transition focus:border-dot-accent"
            />
          </label>
        </div>

        <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3 text-[11px] leading-relaxed text-dot-sub">
          <p className={window.tone}>{window.summary}</p>
          <p className="mt-2 text-dot-muted">
            {BITCOIN_SCRIPT_PROFILES[inputProfile].shortLabel} UTXO {inputCount}개를{' '}
            {BITCOIN_SCRIPT_PROFILES[outputProfile].shortLabel} output {outputCount}개로 합치는 시나리오입니다.
          </p>
        </div>

        <div className="grid gap-2 text-[11px] font-mono sm:grid-cols-3">
          <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-dot-muted">절약</p>
            <p className="mt-2 text-sm font-semibold text-dot-accent">{formatSats(economySats)}</p>
            <p className="mt-1 text-dot-muted">{formatUsd((economySats / 100_000_000) * btcPriceUsd)}</p>
          </div>
          <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-dot-muted">1시간</p>
            <p className="mt-2 text-sm font-semibold text-dot-accent">{formatSats(hourSats)}</p>
            <p className="mt-1 text-dot-muted">{formatUsd((hourSats / 100_000_000) * btcPriceUsd)}</p>
          </div>
          <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-dot-muted">즉시</p>
            <p className="mt-2 text-sm font-semibold text-dot-accent">{formatSats(fastestSats)}</p>
            <p className="mt-1 text-dot-muted">{formatUsd((fastestSats / 100_000_000) * btcPriceUsd)}</p>
          </div>
        </div>
      </div>
    </article>
  );
}
