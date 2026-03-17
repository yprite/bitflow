'use client';

import { useState } from 'react';
import type { BitcoinTxStatusSnapshot } from '@/lib/bitcoin-tx-status';

interface BitcoinTxStatusTrackerProps {
  initialTxid?: string;
}

interface TxStatusSuccessPayload {
  status: 'ok';
  snapshot: BitcoinTxStatusSnapshot;
  tipHeight: number | null;
}

interface TxStatusNotFoundPayload {
  status: 'not_found';
  txid: string;
  message: string;
}

type TxStatusPayload = TxStatusSuccessPayload | TxStatusNotFoundPayload;

function formatDateTime(value: string | null): string {
  if (!value) return '해당 없음';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul',
  });
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

function formatBtc(value: number): string {
  return `${(value / 100_000_000).toLocaleString('en-US', {
    minimumFractionDigits: value < 100_000 ? 6 : 4,
    maximumFractionDigits: value < 100_000 ? 6 : 4,
  })} BTC`;
}

function summarizeStage(snapshot: BitcoinTxStatusSnapshot): string {
  if (snapshot.stage === 'confirmed') {
    return snapshot.confirmations !== null && snapshot.confirmations >= 6
      ? '이 거래는 충분한 confirmations를 확보해 일반적인 상거래 기준에선 최종 확정 구간으로 볼 수 있습니다.'
      : '이 거래는 블록에 포함됐고, 추가 confirmations가 쌓이는 중입니다.';
  }

  if (snapshot.targetSummary) {
    return snapshot.targetSummary;
  }

  return snapshot.stageSummary;
}

export default function BitcoinTxStatusTracker({
  initialTxid = '',
}: BitcoinTxStatusTrackerProps) {
  const [txidInput, setTxidInput] = useState(initialTxid);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<TxStatusPayload | null>(null);

  async function handleLookup() {
    const normalized = txidInput.trim().toLowerCase();
    if (!normalized) {
      setError('txid를 입력해 주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/tools/tx-status?txid=${encodeURIComponent(normalized)}`);
      const payload = (await response.json()) as Record<string, unknown>;

      if (!response.ok) {
        setResult(null);
        setError(
          typeof payload.error === 'string'
            ? payload.error
            : 'TX 상태를 조회하지 못했습니다.'
        );
        return;
      }

      setResult(payload as unknown as TxStatusPayload);
    } catch {
      setResult(null);
      setError('TX 상태를 조회하지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="dot-card h-full p-4 sm:p-5">
      <div className="dot-card-inner space-y-4">
        <div className="space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">
            TX Status Tracker
          </p>
          <h2 className="text-lg font-semibold tracking-tight text-dot-accent">
            mempool / confirmation
          </h2>
          <p className="text-xs leading-relaxed text-dot-sub">
            txid 하나로 현재 mempool 대기 상태인지, 이미 블록에 포함됐는지, confirmations가 얼마나 쌓였는지 바로 확인합니다.
          </p>
        </div>

        <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3 space-y-3">
          <label className="block space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-dot-muted">
              Transaction ID
            </span>
            <input
              inputMode="text"
              value={txidInput}
              onChange={(event) => setTxidInput(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleLookup()}
              placeholder="64자리 txid"
              className="w-full border border-dot-border bg-white px-3 py-2 text-sm font-mono text-dot-accent outline-none transition focus:border-dot-accent"
            />
          </label>

          <button
            type="button"
            onClick={handleLookup}
            disabled={loading}
            className="w-full border border-dot-accent bg-dot-accent px-3 py-2 text-xs font-mono uppercase tracking-[0.14em] text-white transition hover:bg-dot-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? '조회 중...' : '상태 조회'}
          </button>
        </div>

        {error ? <p className="text-xs text-dot-red">{error}</p> : null}

        {result?.status === 'not_found' ? (
          <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-dot-muted">Status</p>
              <span className="rounded-sm border border-dot-red/30 bg-dot-red/10 px-2 py-1 text-[10px] font-mono uppercase tracking-[0.14em] text-dot-red">
                미발견
              </span>
            </div>
            <p className="text-[11px] break-all font-mono text-dot-sub">{result.txid}</p>
            <p className="text-xs leading-relaxed text-dot-sub">{result.message}</p>
          </div>
        ) : null}

        {result?.status === 'ok' ? (
          <div className="space-y-3">
            <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-dot-muted">Current Stage</p>
                <span
                  className={`rounded-sm border px-2 py-1 text-[10px] font-mono uppercase tracking-[0.14em] ${
                    result.snapshot.stage === 'confirmed'
                      ? 'border-dot-green/30 bg-dot-green/10 text-dot-green'
                      : 'border-dot-yellow/30 bg-dot-yellow/10 text-dot-yellow'
                  }`}
                >
                  {result.snapshot.stageLabel}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-dot-sub">{result.snapshot.stageSummary}</p>
              <p className="text-[11px] leading-relaxed text-dot-muted">{summarizeStage(result.snapshot)}</p>
            </div>

            <div className="grid gap-2 text-[11px] font-mono sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-dot-muted">Fee</p>
                <p className="mt-2 text-sm font-semibold text-dot-accent">{formatSats(result.snapshot.feeSats)}</p>
                <p className="mt-1 text-dot-muted">{formatFeeRate(result.snapshot.feeRate)}</p>
              </div>
              <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-dot-muted">Size</p>
                <p className="mt-2 text-sm font-semibold text-dot-accent">
                  {result.snapshot.vsize.toLocaleString('ko-KR')} vB
                </p>
                <p className="mt-1 text-dot-muted">{formatBtc(result.snapshot.totalOutputSats)}</p>
              </div>
              <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-dot-muted">Block</p>
                <p className="mt-2 text-sm font-semibold text-dot-accent">
                  {result.snapshot.blockHeight !== null
                    ? `#${result.snapshot.blockHeight.toLocaleString('ko-KR')}`
                    : '미포함'}
                </p>
                <p className="mt-1 text-dot-muted">{formatDateTime(result.snapshot.blockTime)}</p>
              </div>
              <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-dot-muted">Confirmations</p>
                <p className="mt-2 text-sm font-semibold text-dot-accent">
                  {result.snapshot.confirmations !== null
                    ? result.snapshot.confirmations.toLocaleString('ko-KR')
                    : '0'}
                </p>
                <p className="mt-1 text-dot-muted">
                  {result.snapshot.targetLabel ?? '블록 포함 후 카운트 시작'}
                </p>
              </div>
            </div>

            <div className="rounded-sm border border-dot-border/30 bg-white/70 px-3 py-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-dot-muted">Interpretation</p>
                <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-dot-muted">
                  tip {result.tipHeight !== null ? `#${result.tipHeight.toLocaleString('ko-KR')}` : 'n/a'}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-dot-sub">
                {result.snapshot.stage === 'mempool'
                  ? result.snapshot.targetSummary
                  : result.snapshot.confirmations !== null && result.snapshot.confirmations >= 6
                    ? '일반적인 사용자 입장에선 충분한 confirmations를 확보한 상태로 읽을 수 있습니다.'
                    : '블록에는 들어갔지만 추가 confirmations가 더 쌓여야 하는 상태입니다.'}
              </p>
              <p className="text-[11px] break-all font-mono text-dot-muted">
                {result.snapshot.txid}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}
