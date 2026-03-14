'use client';

import { useEffect, useState } from 'react';
import PremiumHeatmap from '@/components/premium-heatmap';
import ArbitrageCalculator from '@/components/arbitrage-calculator';
import OrbitalSilence from '@/components/motion/storytelling/OrbitalSilence';
import { useData } from '@/components/data-provider';
import type { CoinPremium } from '@/lib/types';

const GUIDE_STORAGE_KEY = 'bitflow:tools-guide-seen';

export default function ToolsPage() {
  const { multiCoinData, error, loading, fetchData } = useData();
  const [selectedCoin, setSelectedCoin] = useState<CoinPremium | null>(null);
  const [guideExpanded, setGuideExpanded] = useState(false);
  const [guideReady, setGuideReady] = useState(false);

  useEffect(() => {
    const hasSeenGuide = window.localStorage.getItem(GUIDE_STORAGE_KEY) === '1';
    setGuideExpanded(!hasSeenGuide);
    setGuideReady(true);

    if (!hasSeenGuide) {
      window.localStorage.setItem(GUIDE_STORAGE_KEY, '1');
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <OrbitalSilence />
      </div>
    );
  }

  if (error || !multiCoinData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-dot-red text-lg mb-2">{error ?? '멀티코인 데이터를 불러올 수 없습니다.'}</p>
          <button
            onClick={fetchData}
            className="text-sm text-dot-sub hover:text-dot-accent transition px-4 py-2 border-2 border-dot-border hover:border-dot-accent"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-5">
      <div className="flex items-center gap-3">
        <a href="/" className="text-dot-muted hover:text-dot-accent transition text-sm font-mono">← 홈</a>
        <h1 className="text-sm font-semibold text-dot-sub uppercase tracking-wider">도구</h1>
      </div>

      <section className="dot-card p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xs font-semibold text-dot-accent uppercase tracking-wider">도구 안내</h2>
          <button
            type="button"
            onClick={() => setGuideExpanded((prev) => !prev)}
            aria-expanded={guideExpanded}
            className="inline-flex items-center gap-1 text-[10px] text-dot-muted hover:text-dot-accent transition font-mono"
          >
            <span>{guideExpanded ? '접기' : '펼치기'}</span>
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-200"
              style={{ transform: guideExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              ▾
            </span>
          </button>
        </div>
        <div
          className="overflow-hidden transition-all duration-300 ease-out"
          style={{
            maxHeight: guideReady && guideExpanded ? '280px' : '0px',
            opacity: guideReady && guideExpanded ? 1 : 0,
          }}
        >
          <div className="pt-3 space-y-3">
            <p className="text-xs text-dot-sub leading-relaxed">
              히트맵은 멀티코인 김프의 상대적인 과열 구간을 빠르게 찾기 위한 화면이고,
              계산기는 실제 진입 전에 수수료와 프리미엄 차이를 감안한 기대 수익률을 가늠하기 위한 보조 도구입니다.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="border border-dot-border/60 p-3 dot-grid-sparse">
                <p className="text-[10px] text-dot-muted uppercase tracking-wider">히트맵</p>
                <p className="text-[11px] text-dot-sub mt-1 leading-relaxed">코인별 김프를 한눈에 비교하고, 거래대금 또는 시가총액 순으로 정렬해 상대적인 괴리를 찾을 수 있습니다.</p>
              </div>
              <div className="border border-dot-border/60 p-3 dot-grid-sparse">
                <p className="text-[10px] text-dot-muted uppercase tracking-wider">계산기</p>
                <p className="text-[11px] text-dot-sub mt-1 leading-relaxed">표시 수익률은 참고치입니다. 실제 체결 슬리피지, 송금 지연, 세금과 출금 제한은 별도로 반영해야 합니다.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PremiumHeatmap data={multiCoinData} onSelectCoin={setSelectedCoin} />
      <ArbitrageCalculator data={multiCoinData} selectedCoin={selectedCoin} />

      <section className="dot-card p-5 sm:p-6 space-y-3">
        <h2 className="text-xs font-semibold text-dot-accent uppercase tracking-wider">재정거래 계산 전 체크리스트</h2>
        <ul className="space-y-2 text-xs text-dot-sub leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-dot-muted/50 font-mono">01</span>
            <span>국내 거래소 원화 호가와 글로벌 달러 호가 차이가 실제 체결 가능 물량 기준으로 유지되는지 확인하세요.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-dot-muted/50 font-mono">02</span>
            <span>입출금 지연, 네트워크 수수료, 체인 선택 오류는 계산기보다 훨씬 큰 손실 요인이 될 수 있습니다.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-dot-muted/50 font-mono">03</span>
            <span>한국 거래소의 상장 프리미엄은 유동성 이벤트에 따라 급변하므로 과거 평균만 믿고 접근하면 안 됩니다.</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
