'use client';

import ArbitrageCalculator from '@/components/arbitrage-calculator';
import { useData } from '@/components/data-provider';

export default function ToolsArbitrageSection() {
  const { multiCoinData, error, loading, fetchData } = useData();

  if (loading) {
    return (
      <section className="dot-card p-5 sm:p-6">
        <div className="space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">
            Arbitrage
          </p>
          <p className="text-sm font-semibold text-dot-accent">재정거래 계산 준비 중</p>
          <p className="text-xs leading-relaxed text-dot-sub">
            멀티마켓 호가를 불러오는 동안 계산기를 준비하고 있습니다.
          </p>
        </div>
      </section>
    );
  }

  if (error || !multiCoinData) {
    return (
      <section className="dot-card p-5 sm:p-6 space-y-3">
        <div className="space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">
            Arbitrage
          </p>
          <p className="text-sm font-semibold text-dot-red">재정거래 데이터를 불러올 수 없습니다.</p>
        </div>
        <button
          type="button"
          onClick={fetchData}
          className="border-2 border-dot-border px-3 py-2 text-xs font-mono text-dot-sub transition hover:border-dot-accent hover:text-dot-accent"
        >
          다시 시도
        </button>
      </section>
    );
  }

  return <ArbitrageCalculator data={multiCoinData} />;
}
