'use client';

import { useState, useMemo } from 'react';
import type { CoinPremium, MultiCoinKimpData, ArbitrageResult } from '@/lib/types';
import { calculateArbitrage } from '@/lib/kimp';
import DotKPIValue from './motion/typography/DotKPIValue';
import DotValueRefresh, { refreshStyle, residueStyle } from './motion/transitions/DotValueRefresh';
import { useFieldTransition } from './motion/transitions/useFieldTransition';
import { useReducedMotion } from './motion/core/useReducedMotion';
import LivePulse from './motion/indicators/LivePulse';

interface ArbitrageCalculatorProps {
  data: MultiCoinKimpData;
  selectedCoin?: CoinPremium | null;
}

const PRESET_AMOUNTS = [1_000_000, 5_000_000, 10_000_000, 50_000_000];

/** Animated number row for the detail breakdown table. */
function AnimatedRow({
  label,
  value,
  prefix = '',
  suffix = '원',
  className = 'text-dot-text',
  reducedMotion,
  fractionDigits = 0,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  reducedMotion: boolean;
  fractionDigits?: number;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-dot-muted">{label}</span>
      <DotValueRefresh value={value}>
        {({ current, previous, showResidue, residueOpacity, pulseScale }) => (
          <span className={`font-mono relative ${className}`}>
            {showResidue && previous !== null && (
              <span
                className="absolute right-0 whitespace-nowrap"
                style={residueStyle(residueOpacity, reducedMotion)}
              >
                {prefix}{Number(previous).toLocaleString('ko-KR', { maximumFractionDigits: fractionDigits })}{suffix}
              </span>
            )}
            <span style={refreshStyle(pulseScale, reducedMotion)}>
              {prefix}{Number(current).toLocaleString('ko-KR', { maximumFractionDigits: fractionDigits })}{suffix}
            </span>
          </span>
        )}
      </DotValueRefresh>
    </div>
  );
}

export default function ArbitrageCalculator({ data, selectedCoin }: ArbitrageCalculatorProps) {
  const [coinSymbol, setCoinSymbol] = useState(selectedCoin?.symbol || 'BTC');
  const [amountInput, setAmountInput] = useState('10000000');
  const [direction, setDirection] = useState<'buy-kr-sell-global' | 'buy-global-sell-kr'>('buy-global-sell-kr');
  const reducedMotion = useReducedMotion();

  const coin = data.coins.find(c => c.symbol === coinSymbol);
  const amount = parseInt(amountInput.replace(/,/g, ''), 10) || 0;

  if (selectedCoin && selectedCoin.symbol !== coinSymbol) {
    setCoinSymbol(selectedCoin.symbol);
  }

  const result: ArbitrageResult | null = useMemo(() => {
    if (!coin || amount <= 0) return null;
    return calculateArbitrage(coin, amount, data.usdKrw, direction);
  }, [coin, amount, data.usdKrw, direction]);

  const recommendedDirection = coin
    ? coin.premium > 0 ? 'buy-global-sell-kr' : 'buy-kr-sell-global'
    : 'buy-global-sell-kr';

  // Field transition on direction change for the result container
  const fieldTransition = useFieldTransition(direction, {
    duration: 350,
    fadeStrength: 0.1,
    blurStrength: 0.6,
    scaleStrength: 0.01,
  });

  return (
    <div className="dot-card p-4 sm:p-6">
      <div className="dot-card-inner">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-1.5">
          <LivePulse size={4} />
          차익거래 계산기
        </h2>

        {/* Input form */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 sm:mb-4">
          <div>
            <label className="text-xs text-dot-muted block mb-1 font-mono">코인</label>
            <select
              value={coinSymbol}
              onChange={e => setCoinSymbol(e.target.value)}
              className="w-full bg-white border-2 border-dot-border px-3 py-2 text-sm text-dot-text font-mono focus:outline-none focus:border-dot-accent"
            >
              {data.coins.map(c => (
                <option key={c.symbol} value={c.symbol}>
                  {c.symbol} ({c.premium >= 0 ? '+' : ''}{c.premium.toFixed(2)}%)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-dot-muted block mb-1 font-mono">투자 금액 (원)</label>
            <input
              type="text"
              value={Number(amountInput).toLocaleString()}
              onChange={e => setAmountInput(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full bg-white border-2 border-dot-border px-3 py-2 text-sm text-dot-text font-mono focus:outline-none focus:border-dot-accent"
            />
            <div className="flex gap-1 mt-1">
              {PRESET_AMOUNTS.map(a => (
                <button
                  key={a}
                  onClick={() => setAmountInput(String(a))}
                  className="text-[10px] px-1.5 py-0.5 border border-dot-border text-dot-muted hover:text-dot-accent hover:border-dot-accent transition font-mono"
                >
                  {(a / 10000).toFixed(0)}만
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-dot-muted block mb-1 font-mono">거래 방향</label>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setDirection('buy-global-sell-kr')}
                className={`text-xs px-3 py-1.5 font-mono border-2 transition-all duration-300 ${
                  direction === 'buy-global-sell-kr'
                    ? 'border-dot-red text-dot-red bg-red-50'
                    : 'border-dot-border text-dot-muted hover:text-dot-accent'
                }`}
              >
                해외 매수 → 한국 매도
                {recommendedDirection === 'buy-global-sell-kr' && ' ★'}
              </button>
              <button
                onClick={() => setDirection('buy-kr-sell-global')}
                className={`text-xs px-3 py-1.5 font-mono border-2 transition-all duration-300 ${
                  direction === 'buy-kr-sell-global'
                    ? 'border-dot-blue text-dot-blue bg-blue-50'
                    : 'border-dot-border text-dot-muted hover:text-dot-accent'
                }`}
              >
                한국 매수 → 해외 매도
                {recommendedDirection === 'buy-kr-sell-global' && ' ★'}
              </button>
            </div>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div
            className="p-3 sm:p-4 border-2 transition-colors duration-500"
            style={{
              borderColor: result.viable ? '#00c853' : '#e53935',
              backgroundColor: result.viable ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
            }}
          >
            <div style={fieldTransition.style}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <DotValueRefresh value={result.viable ? 1 : 0}>
                    {({ pulseScale }) => (
                      <span
                        className={`text-xs px-2 py-0.5 font-mono font-medium border transition-colors duration-400 ${
                          result.viable ? 'border-dot-green text-dot-green' : 'border-dot-red text-dot-red'
                        }`}
                        style={refreshStyle(pulseScale, reducedMotion)}
                      >
                        {result.viable ? '수익 가능' : '손실 예상'}
                      </span>
                    )}
                  </DotValueRefresh>
                  <span className="text-xs text-dot-muted font-mono">{result.estimatedTime}</span>
                </div>
                <DotKPIValue
                  value={result.netProfit}
                  decimals={0}
                  suffix=""
                  showSign
                  fontScale={5}
                  morphMode="reconfigure"
                  morphDuration={500}
                />
              </div>

              <div className="text-xs text-dot-muted font-mono mb-2">{result.direction}</div>

              {/* Dot profit bar — staggered color transition */}
              <div className="flex gap-[3px] mb-3">
                {[...Array(20)].map((_, i) => {
                  const filled = i < Math.min(Math.abs(result.netProfitRate) * 4, 20);
                  return (
                    <div
                      key={i}
                      className="w-full h-2 rounded-sm"
                      style={{
                        backgroundColor: filled
                          ? result.netProfit >= 0 ? '#00c853' : '#e53935'
                          : '#e5e7eb',
                        transition: reducedMotion
                          ? 'none'
                          : `background-color 400ms cubic-bezier(0.16, 1, 0.3, 1) ${i * 25}ms`,
                      }}
                    />
                  );
                })}
              </div>

              {/* Detail breakdown — animated values */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <AnimatedRow
                  label="투자금액"
                  value={result.investmentKrw}
                  reducedMotion={reducedMotion}
                />
                <AnimatedRow
                  label="현재 김프"
                  value={result.premium}
                  prefix={result.premium >= 0 ? '+' : ''}
                  suffix="%"
                  fractionDigits={2}
                  reducedMotion={reducedMotion}
                />
                <AnimatedRow
                  label="총 수익 (수수료 전)"
                  value={result.grossProfit}
                  reducedMotion={reducedMotion}
                />
                <AnimatedRow
                  label="순수익률"
                  value={result.netProfitRate}
                  prefix={result.netProfitRate >= 0 ? '+' : ''}
                  suffix="%"
                  fractionDigits={3}
                  className={`font-medium ${result.netProfitRate >= 0 ? 'text-dot-green' : 'text-dot-red'}`}
                  reducedMotion={reducedMotion}
                />

                <div className="col-span-1 sm:col-span-2 dot-border-t my-1" />

                <AnimatedRow
                  label="한국 거래소 수수료"
                  value={result.exchangeFeeKr}
                  prefix="-"
                  className="text-dot-muted"
                  reducedMotion={reducedMotion}
                />
                <AnimatedRow
                  label="해외 거래소 수수료"
                  value={result.exchangeFeeGlobal}
                  prefix="-"
                  className="text-dot-muted"
                  reducedMotion={reducedMotion}
                />
                <AnimatedRow
                  label="네트워크 수수료"
                  value={result.networkFee}
                  prefix="-"
                  className="text-dot-muted"
                  reducedMotion={reducedMotion}
                />
                <AnimatedRow
                  label="예상 슬리피지"
                  value={result.slippage}
                  prefix="-"
                  className="text-dot-muted"
                  reducedMotion={reducedMotion}
                />
              </div>
            </div>
          </div>
        )}

        {!coin && (
          <p className="text-sm text-dot-muted text-center py-4">코인을 선택해주세요.</p>
        )}
      </div>
    </div>
  );
}
