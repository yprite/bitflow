'use client';

import { useState, useEffect } from 'react';

// Bitcoin halving constants
const HALVING_BLOCK_INTERVAL = 210_000;
const LAST_HALVING_BLOCK = 840_000;       // 4th halving (April 2024)
const NEXT_HALVING_BLOCK = 1_050_000;     // 5th halving (~2028)
const AVG_BLOCK_TIME_MINUTES = 10;

interface HalvingData {
  currentBlock: number;
  blocksRemaining: number;
  progress: number;           // 0–100%
  estimatedDate: Date;
  daysRemaining: number;
}

async function fetchBlockHeight(): Promise<number> {
  const res = await fetch('https://mempool.space/api/blocks/tip/height');
  if (!res.ok) throw new Error('블록 높이 조회 실패');
  const height = await res.json();
  return height as number;
}

function calculateHalvingData(currentBlock: number): HalvingData {
  const blocksRemaining = NEXT_HALVING_BLOCK - currentBlock;
  const progress = ((currentBlock - LAST_HALVING_BLOCK) / HALVING_BLOCK_INTERVAL) * 100;
  const minutesRemaining = blocksRemaining * AVG_BLOCK_TIME_MINUTES;
  const estimatedDate = new Date(Date.now() + minutesRemaining * 60 * 1000);
  const daysRemaining = Math.floor(minutesRemaining / (60 * 24));

  return { currentBlock, blocksRemaining, progress, estimatedDate, daysRemaining };
}

function formatEstimatedDate(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

function formatNumber(n: number): string {
  return n.toLocaleString('ko-KR');
}

export default function HalvingCountdown() {
  const [halving, setHalving] = useState<HalvingData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const height = await fetchBlockHeight();
        if (!cancelled) {
          setHalving(calculateHalvingData(height));
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }

    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  if (error || !halving) {
    return null;
  }

  const progressClamped = Math.min(Math.max(halving.progress, 0), 100);

  const insight =
    halving.daysRemaining <= 365
      ? '반감기까지 1년 이내 — 역사적으로 강세장 진입 구간'
      : halving.daysRemaining <= 730
        ? `반감기 약 ${Math.round(halving.daysRemaining / 30)}개월 전 — 축적기 구간`
        : `다음 반감기: ${formatEstimatedDate(halving.estimatedDate)} 예상`;

  return (
    <article className="dot-card p-4 sm:p-5">
      <div className="dot-card-inner space-y-3">
        {/* Header — same layout as OnchainMetricCard */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">
              반감기 카운트다운
            </p>
            <h2 className="text-lg font-semibold text-dot-accent tracking-tight">
              D-{formatNumber(halving.daysRemaining)}
            </h2>
          </div>
          <span className="text-[10px] font-mono text-dot-muted">
            ~{formatEstimatedDate(halving.estimatedDate)}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-dot-sub leading-relaxed">{insight}</p>

        {/* Progress visualisation — replaces sparkline area */}
        <div className="space-y-2">
          <div className="h-20 rounded-sm border border-dot-border/30 bg-white/70 p-3 flex flex-col justify-between">
            {/* Progress bar */}
            <div>
              <div className="h-2 rounded-full bg-dot-border/20 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${progressClamped}%`,
                    backgroundColor: '#275649',
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px] font-mono text-dot-muted">
                  {formatNumber(LAST_HALVING_BLOCK)}
                </span>
                <span className="text-[9px] font-mono text-dot-accent tabular-nums">
                  {progressClamped.toFixed(1)}%
                </span>
                <span className="text-[9px] font-mono text-dot-muted">
                  {formatNumber(NEXT_HALVING_BLOCK)}
                </span>
              </div>
            </div>
            {/* Block stats */}
            <div className="flex items-center justify-between text-[10px] font-mono text-dot-sub">
              <span>현재 #{formatNumber(halving.currentBlock)}</span>
              <span>남은 블록 {formatNumber(halving.blocksRemaining)}</span>
            </div>
          </div>
        </div>

        {/* Footer delta — same layout as OnchainMetricCard */}
        <div className="flex items-center justify-between gap-3 text-[11px] font-mono">
          <span className="text-dot-muted">5th Halving · 블록 {formatNumber(NEXT_HALVING_BLOCK)}</span>
          <span className="text-dot-muted">~{Math.round(halving.daysRemaining / 30)}개월</span>
        </div>
      </div>
    </article>
  );
}
