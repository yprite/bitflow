'use client';

import { useState, useMemo } from 'react';
import type { CoinPremium, MultiCoinKimpData, ArbitrageResult } from '@/lib/types';
import { calculateArbitrage } from '@/lib/kimp';

interface ArbitrageCalculatorProps {
  data: MultiCoinKimpData;
  selectedCoin?: CoinPremium | null;
}

const PRESET_AMOUNTS = [1_000_000, 5_000_000, 10_000_000, 50_000_000];

export default function ArbitrageCalculator({ data, selectedCoin }: ArbitrageCalculatorProps) {
  const [coinSymbol, setCoinSymbol] = useState(selectedCoin?.symbol || 'BTC');
  const [amountInput, setAmountInput] = useState('10000000');
  const [direction, setDirection] = useState<'buy-kr-sell-global' | 'buy-global-sell-kr'>('buy-global-sell-kr');

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

  return (
    <div className="dot-card p-6">
      <div className="dot-card-inner">
        <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider mb-4">차익거래 계산기</h2>

        {/* Input form */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
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
                className={`text-xs px-3 py-1.5 transition font-mono border-2 ${
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
                className={`text-xs px-3 py-1.5 transition font-mono border-2 ${
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
          <div className={`p-4 border-2 ${result.viable ? 'border-dot-green bg-emerald-50/50' : 'border-dot-red bg-red-50/50'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 font-mono font-medium border ${
                  result.viable ? 'border-dot-green text-dot-green' : 'border-dot-red text-dot-red'
                }`}>
                  {result.viable ? '수익 가능' : '손실 예상'}
                </span>
                <span className="text-xs text-dot-muted font-mono">{result.estimatedTime}</span>
              </div>
              <p className={`text-2xl font-bold font-mono ${result.netProfit >= 0 ? 'text-dot-green' : 'text-dot-red'}`}>
                {result.netProfit >= 0 ? '+' : ''}{result.netProfit.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
              </p>
            </div>

            <div className="text-xs text-dot-muted font-mono mb-2">{result.direction}</div>

            {/* Dot profit bar */}
            <div className="flex gap-[3px] mb-3">
              {[...Array(20)].map((_, i) => {
                const filled = i < Math.min(Math.abs(result.netProfitRate) * 4, 20);
                return (
                  <div
                    key={i}
                    className="w-full h-2 rounded-sm transition-all"
                    style={{
                      backgroundColor: filled
                        ? result.netProfit >= 0 ? '#00c853' : '#e53935'
                        : '#e5e7eb',
                    }}
                  />
                );
              })}
            </div>

            {/* Detail breakdown */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-dot-muted">투자금액</span>
                <span className="text-dot-text font-mono">{result.investmentKrw.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dot-muted">현재 김프</span>
                <span className="text-dot-text font-mono">{result.premium >= 0 ? '+' : ''}{result.premium.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dot-muted">총 수익 (수수료 전)</span>
                <span className="text-dot-text font-mono">{result.grossProfit.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dot-muted">순수익률</span>
                <span className={`font-mono font-medium ${result.netProfitRate >= 0 ? 'text-dot-green' : 'text-dot-red'}`}>
                  {result.netProfitRate >= 0 ? '+' : ''}{result.netProfitRate.toFixed(3)}%
                </span>
              </div>

              <div className="col-span-2 dot-border-t my-1" />

              <div className="flex justify-between text-dot-muted">
                <span>한국 거래소 수수료</span>
                <span className="font-mono">-{result.exchangeFeeKr.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원</span>
              </div>
              <div className="flex justify-between text-dot-muted">
                <span>해외 거래소 수수료</span>
                <span className="font-mono">-{result.exchangeFeeGlobal.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원</span>
              </div>
              <div className="flex justify-between text-dot-muted">
                <span>네트워크 수수료</span>
                <span className="font-mono">-{result.networkFee.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원</span>
              </div>
              <div className="flex justify-between text-dot-muted">
                <span>예상 슬리피지</span>
                <span className="font-mono">-{result.slippage.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원</span>
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
