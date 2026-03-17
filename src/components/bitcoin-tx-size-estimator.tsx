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

interface BitcoinTxSizeEstimatorProps {
  feePressure: OnchainFeePressureData;
  btcPriceUsd: number;
}

function formatUsd(value: number): string {
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: value < 10 ? 2 : 0,
    maximumFractionDigits: value < 10 ? 2 : 0,
  })}`;
}

function formatSats(value: number): string {
  return `${value.toLocaleString('ko-KR')} sats`;
}

function formatFeeRate(value: number): string {
  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: value < 1 ? 2 : 1,
    maximumFractionDigits: value < 1 ? 2 : 1,
  })} sat/vB`;
}

const SCRIPT_PROFILE_OPTIONS = Object.entries(BITCOIN_SCRIPT_PROFILES) as Array<
  [BitcoinScriptProfile, (typeof BITCOIN_SCRIPT_PROFILES)[BitcoinScriptProfile]]
>;

export default function BitcoinTxSizeEstimator({
  feePressure,
  btcPriceUsd,
}: BitcoinTxSizeEstimatorProps) {
  const trackedEngagement = useRef(false);
  const [inputProfile, setInputProfile] = useState<BitcoinScriptProfile>('p2wpkh');
  const [outputProfile, setOutputProfile] = useState<BitcoinScriptProfile>('p2wpkh');
  const [inputCountInput, setInputCountInput] = useState('1');
  const [outputCountInput, setOutputCountInput] = useState('2');

  const inputCount = clampCount(inputCountInput, 1, 1, 200);
  const outputCount = clampCount(outputCountInput, 2, 1, 50);
  const vbytes = estimateTransactionVbytes({
    inputCount,
    outputCount,
    inputProfile,
    outputProfile,
  });
  const tiers = [
    { label: '즉시', feeRate: feePressure.fastestFee },
    { label: '30분', feeRate: feePressure.halfHourFee },
    { label: '1시간', feeRate: feePressure.hourFee },
    { label: '절약', feeRate: feePressure.economyFee },
  ];

  const trackEngagement = () => {
    if (trackedEngagement.current) return;
    trackedEngagement.current = true;
    trackEvent('tools_tx_size_estimator_used', '/tools', {
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
              Transaction Size Estimator
            </p>
            <h2 className="text-lg font-semibold tracking-tight text-dot-accent">
              {vbytes.toLocaleString('ko-KR')} vB
            </h2>
          </div>
          <span className="rounded-sm border border-dot-border/40 bg-white/70 px-2 py-1 text-[10px] font-mono uppercase tracking-[0.14em] text-dot-sub">
            {inputCount} in / {outputCount} out
          </span>
        </div>

        <p className="text-xs leading-relaxed text-dot-sub">
          입력/출력 수와 주소 타입을 넣어 예상 가상 바이트를 계산합니다. 바로 아래 fee tier 비용까지 이어서 볼 수 있습니다.
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
              Inputs
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
              Outputs
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

        <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3 text-[11px] font-mono text-dot-sub">
          {BITCOIN_SCRIPT_PROFILES[inputProfile].shortLabel} input {inputCount}개,{' '}
          {BITCOIN_SCRIPT_PROFILES[outputProfile].shortLabel} output {outputCount}개 기준 추정치입니다.
        </div>

        <div className="grid gap-2 text-[11px] font-mono sm:grid-cols-2">
          {tiers.map((tier) => {
            const sats = satsForFeeRate(vbytes, tier.feeRate);
            const usd = (sats / 100_000_000) * btcPriceUsd;

            return (
              <div
                key={tier.label}
                className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3"
              >
                <p className="text-[10px] uppercase tracking-[0.14em] text-dot-muted">{tier.label}</p>
                <p className="mt-2 text-sm font-semibold text-dot-accent">{formatSats(sats)}</p>
                <p className="mt-1 text-dot-sub">{formatFeeRate(tier.feeRate)}</p>
                <p className="mt-1 text-dot-muted">{formatUsd(usd)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}
