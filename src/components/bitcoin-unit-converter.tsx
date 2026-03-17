'use client';

import { useState } from 'react';

interface BitcoinUnitConverterProps {
  btcPriceUsd: number;
  btcPriceKrw: number | null;
}

type InputMode = 'krw' | 'usd' | 'btc' | 'sats';

function formatKrw(value: number): string {
  return `${value.toLocaleString('ko-KR', {
    minimumFractionDigits: value < 10_000 ? 0 : 0,
    maximumFractionDigits: 0,
  })}원`;
}

function formatUsd(value: number): string {
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: value < 10 ? 2 : 0,
    maximumFractionDigits: value < 10 ? 2 : 2,
  })}`;
}

function formatBtc(value: number): string {
  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: value < 0.001 ? 6 : 4,
    maximumFractionDigits: value < 0.001 ? 6 : 6,
  })} BTC`;
}

function formatSats(value: number): string {
  return `${Math.round(value).toLocaleString('ko-KR')} sats`;
}

function parseAmount(raw: string): number {
  const parsed = Number(raw.replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function BitcoinUnitConverter({
  btcPriceUsd,
  btcPriceKrw,
}: BitcoinUnitConverterProps) {
  const [mode, setMode] = useState<InputMode>('krw');
  const [amountInput, setAmountInput] = useState('100000');

  const amount = parseAmount(amountInput);
  const btc =
    mode === 'btc'
      ? amount
      : mode === 'sats'
        ? amount / 100_000_000
        : mode === 'krw'
          ? btcPriceKrw && btcPriceKrw > 0
            ? amount / btcPriceKrw
            : 0
        : btcPriceUsd > 0
          ? amount / btcPriceUsd
          : 0;
  const sats = btc * 100_000_000;
  const usd = btc * btcPriceUsd;
  const krw = btcPriceKrw && btcPriceKrw > 0 ? btc * btcPriceKrw : 0;

  const modeOptions: Array<{ key: InputMode; label: string; suffix: string }> = [
    { key: 'krw', label: 'KRW 입력', suffix: 'KRW' },
    { key: 'usd', label: 'USD 입력', suffix: 'USD' },
    { key: 'btc', label: 'BTC 입력', suffix: 'BTC' },
    { key: 'sats', label: 'sats 입력', suffix: 'sats' },
  ];

  return (
    <article className="dot-card h-full p-4 sm:p-5">
      <div className="dot-card-inner space-y-4">
        <div className="space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">
            BTC / sats Converter
          </p>
          <h2 className="text-lg font-semibold tracking-tight text-dot-accent">
            {formatSats(sats)}
          </h2>
          <p className="text-xs leading-relaxed text-dot-sub">
            KRW, 달러, BTC, sats 중 하나를 기준으로 비트코인 단위를 빠르게 환산합니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {modeOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setMode(option.key)}
              className={`rounded-sm border px-2 py-1 text-[10px] font-mono uppercase tracking-[0.12em] transition ${
                mode === option.key
                  ? 'border-dot-accent bg-dot-accent text-white'
                  : 'border-dot-border/50 text-dot-sub hover:border-dot-accent hover:text-dot-accent'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3 space-y-2">
          <label className="block space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-dot-muted">
              Input
            </span>
            <div className="flex items-center gap-2">
              <input
                inputMode="decimal"
                value={amountInput}
                onChange={(event) => setAmountInput(event.target.value)}
                className="w-full border border-dot-border bg-white px-3 py-2 text-sm font-mono text-dot-accent outline-none transition focus:border-dot-accent"
                placeholder="100"
              />
              <span className="text-xs font-mono text-dot-muted">
                {modeOptions.find((option) => option.key === mode)?.suffix}
              </span>
            </div>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div className="min-w-0 rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-dot-muted">KRW</p>
            <p className="mt-2 break-all text-xs font-semibold leading-snug text-dot-accent sm:text-sm">
              {formatKrw(krw)}
            </p>
          </div>
          <div className="min-w-0 rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-dot-muted">USD</p>
            <p className="mt-2 break-all text-xs font-semibold leading-snug text-dot-accent sm:text-sm">
              {formatUsd(usd)}
            </p>
          </div>
          <div className="min-w-0 rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-dot-muted">BTC</p>
            <p className="mt-2 break-all text-xs font-semibold leading-snug text-dot-accent sm:text-sm">
              {formatBtc(btc)}
            </p>
          </div>
          <div className="min-w-0 rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-dot-muted">sats</p>
            <p className="mt-2 break-all text-xs font-semibold leading-snug text-dot-accent sm:text-sm">
              {formatSats(sats)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-dot-muted sm:grid-cols-4">
          <div className="rounded-sm border border-dot-border/20 bg-white/50 px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.14em]">1 BTC</p>
          </div>
          <div className="min-w-0 rounded-sm border border-dot-border/20 bg-white/50 px-3 py-2">
            <p className="break-all leading-snug">{btcPriceKrw ? formatKrw(btcPriceKrw) : 'KRW n/a'}</p>
          </div>
          <div className="min-w-0 rounded-sm border border-dot-border/20 bg-white/50 px-3 py-2">
            <p className="break-all leading-snug">{formatUsd(btcPriceUsd)}</p>
          </div>
          <div className="rounded-sm border border-dot-border/20 bg-white/50 px-3 py-2">
            <p className="leading-snug">100,000,000 sats</p>
          </div>
        </div>
      </div>
    </article>
  );
}
