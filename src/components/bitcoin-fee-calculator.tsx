'use client';

import { useRef, useState } from 'react';
import type { OnchainBlockTempoData, OnchainFeePressureData } from '@/lib/types';
import { trackEvent } from '@/lib/event-tracker';

const VBYTES_PRESETS = [140, 220, 400, 900] as const;

interface BitcoinFeeCalculatorProps {
  feePressure: OnchainFeePressureData;
  blockTempo: OnchainBlockTempoData;
  btcPriceUsd: number;
}

function formatFeeRate(value: number): string {
  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: value < 1 ? 2 : 1,
    maximumFractionDigits: value < 1 ? 2 : 1,
  })} sat/vB`;
}

function formatSats(value: number): string {
  return `${Math.round(value).toLocaleString('ko-KR')} sats`;
}

function formatBtc(value: number): string {
  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: value < 0.001 ? 6 : 4,
    maximumFractionDigits: value < 0.001 ? 6 : 4,
  })} BTC`;
}

function formatUsd(value: number): string {
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: value < 10 ? 2 : 0,
    maximumFractionDigits: value < 10 ? 2 : 0,
  })}`;
}

function sanitizeVbytes(raw: string): number {
  const parsed = Number(raw.replace(/,/g, '').trim());
  if (!Number.isFinite(parsed)) return 140;
  return Math.min(Math.max(parsed, 60), 100_000);
}

export default function BitcoinFeeCalculator({
  feePressure,
  blockTempo,
  btcPriceUsd,
}: BitcoinFeeCalculatorProps) {
  const [vbytesInput, setVbytesInput] = useState('140');
  const trackedEngagement = useRef(false);
  const vbytes = sanitizeVbytes(vbytesInput);
  const averageBlockMinutes = Math.max(Math.round(blockTempo.averageBlockMinutes), 8);
  const tiers = [
    {
      label: '다음 블록',
      hint: `약 ${averageBlockMinutes}분`,
      feeRate: feePressure.fastestFee,
    },
    {
      label: '30분',
      hint: `약 ${averageBlockMinutes * 3}분`,
      feeRate: feePressure.halfHourFee,
    },
    {
      label: '1시간',
      hint: `약 ${averageBlockMinutes * 6}분`,
      feeRate: feePressure.hourFee,
    },
    {
      label: '절약',
      hint: '여유 있을 때',
      feeRate: feePressure.economyFee,
    },
  ];

  const trackEngagement = (action: 'input' | 'preset') => {
    if (trackedEngagement.current) return;
    trackedEngagement.current = true;
    trackEvent('tools_fee_calculator_used', '/tools', {
      action,
      vbytes,
    });
  };

  return (
    <article className="dot-card h-full p-4 sm:p-5">
      <div className="dot-card-inner space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">
              Bitcoin Fee Calculator
            </p>
            <h2 className="text-lg font-semibold tracking-tight text-dot-accent">
              {formatSats(vbytes)}
            </h2>
          </div>
          <span className="rounded-sm border border-dot-border/40 bg-white/70 px-2 py-1 text-[10px] font-mono uppercase tracking-[0.14em] text-dot-sub">
            {feePressure.pressure}
          </span>
        </div>

        <p className="text-xs leading-relaxed text-dot-sub">
          예상 거래 크기를 넣으면 현재 mempool 기준으로 수수료 tier별 총 비용을 바로 계산합니다.
        </p>

        <div className="space-y-3 rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3">
          <label className="block space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-dot-muted">
              Transaction Size
            </span>
            <div className="flex items-center gap-2">
              <input
                inputMode="numeric"
                value={vbytesInput}
                onChange={(event) => {
                  setVbytesInput(event.target.value);
                  trackEngagement('input');
                }}
                className="w-full border border-dot-border bg-white px-3 py-2 text-sm font-mono text-dot-accent outline-none transition focus:border-dot-accent"
                placeholder="140"
              />
              <span className="text-xs font-mono text-dot-muted">vB</span>
            </div>
          </label>

          <div className="flex flex-wrap gap-2">
            {VBYTES_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setVbytesInput(String(preset));
                  trackEngagement('preset');
                }}
                className={`rounded-sm border px-2 py-1 text-[10px] font-mono uppercase tracking-[0.12em] transition ${
                  vbytes === preset
                    ? 'border-dot-accent bg-dot-accent text-white'
                    : 'border-dot-border/50 text-dot-sub hover:border-dot-accent hover:text-dot-accent'
                }`}
              >
                {preset} vB
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {tiers.map((tier) => {
            const totalSats = Math.ceil(vbytes * tier.feeRate);
            const totalBtc = totalSats / 100_000_000;
            const totalUsd = totalBtc * btcPriceUsd;

            return (
              <div
                key={tier.label}
                className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3"
              >
                <div className="space-y-1">
                  <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-dot-muted">
                    {tier.label}
                  </p>
                  <p className="text-sm font-semibold text-dot-accent">{formatFeeRate(tier.feeRate)}</p>
                  <p className="text-[11px] text-dot-muted">{tier.hint}</p>
                </div>
                <div className="text-right font-mono text-[11px] text-dot-sub">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-dot-muted">Cost</p>
                  <p className="mt-1 text-dot-accent">{formatSats(totalSats)}</p>
                  <p>{formatBtc(totalBtc)}</p>
                </div>
                <div className="text-right font-mono text-[11px] text-dot-sub">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-dot-muted">USD</p>
                  <p className="mt-1 text-dot-accent">{formatUsd(totalUsd)}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 text-[11px] font-mono text-dot-muted">
          <span>{feePressure.mempoolTxCount.toLocaleString('ko-KR')} tx 대기</span>
          <span>{(feePressure.mempoolVsize / 1_000_000).toFixed(1)} vMB</span>
          <span>BTC ${btcPriceUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
        </div>
      </div>
    </article>
  );
}
