'use client';

import { useState, useEffect } from 'react';
import LivePulse from './motion/indicators/LivePulse';

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
    // Refresh every 5 minutes
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  if (error || !halving) {
    return null; // Silently hide if unavailable
  }

  const progressClamped = Math.min(Math.max(halving.progress, 0), 100);

  return (
    <div className="dot-card p-4 sm:p-5">
      <div className="dot-card-inner">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider flex items-center gap-1.5">
            <LivePulse size={4} color="#f59e0b" />
            비트코인 반감기
          </h2>
          <span className="text-[10px] font-mono text-dot-muted">
            5th Halving
          </span>
        </div>

        {/* Countdown */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl sm:text-3xl font-mono font-bold text-dot-text tabular-nums tracking-tight">
            D-{formatNumber(halving.daysRemaining)}
          </span>
          <span className="text-xs text-dot-muted font-mono">
            ~{formatEstimatedDate(halving.estimatedDate)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressClamped}%`,
                background: 'linear-gradient(90deg, #f59e0b, #f97316)',
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] font-mono text-dot-muted">
              {formatNumber(LAST_HALVING_BLOCK)}
            </span>
            <span className="text-[10px] font-mono text-dot-accent tabular-nums">
              {progressClamped.toFixed(1)}%
            </span>
            <span className="text-[10px] font-mono text-dot-muted">
              {formatNumber(NEXT_HALVING_BLOCK)}
            </span>
          </div>
        </div>

        {/* Block details */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] text-dot-muted block">현재 블록</span>
            <span className="text-xs font-mono text-dot-text tabular-nums">
              #{formatNumber(halving.currentBlock)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-dot-muted block">남은 블록</span>
            <span className="text-xs font-mono text-dot-text tabular-nums">
              {formatNumber(halving.blocksRemaining)}
            </span>
          </div>
        </div>

        {/* Insight */}
        <p className="dot-insight">
          {halving.daysRemaining <= 365
            ? `반감기까지 1년 이내 — 역사적으로 강세장 진입 구간`
            : halving.daysRemaining <= 730
              ? `반감기 약 ${Math.round(halving.daysRemaining / 30)}개월 전 — 축적기 구간`
              : `다음 반감기: ${formatEstimatedDate(halving.estimatedDate)} 예상 (블록 ${formatNumber(NEXT_HALVING_BLOCK)})`}
        </p>
      </div>
    </div>
  );
}
