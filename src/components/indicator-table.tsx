'use client';

import type { ReactNode } from 'react';
import type { SignalFactor } from '@/lib/types';
import LivePulse from './motion/indicators/LivePulse';

const INDICATOR_ORDER = [
  { factorLabel: '김프', displayLabel: '김치프리미엄' },
  { factorLabel: '펀딩비', displayLabel: '펀딩비' },
  { factorLabel: '공포탐욕', displayLabel: '공포탐욕지수' },
  { factorLabel: 'USDT프리미엄', displayLabel: 'USDT 프리미엄' },
  { factorLabel: 'BTC도미넌스', displayLabel: 'BTC 도미넌스' },
  { factorLabel: '롱비율', displayLabel: '롱숏 비율' },
  { factorLabel: '미결제약정', displayLabel: '미결제약정' },
  { factorLabel: '청산비율', displayLabel: '청산 비율' },
  { factorLabel: '스테이블', displayLabel: '스테이블코인' },
  { factorLabel: '거래량', displayLabel: 'BTC 거래량' },
  { factorLabel: 'MSTR매입', displayLabel: 'Strategy BTC' },
];

function getDirColor(direction: string): string {
  if (direction === '과열') return '#e53935';
  if (direction === '침체') return '#1e88e5';
  return '#6b7280';
}

function getDirArrow(direction: string): string {
  if (direction === '과열') return '▲';
  if (direction === '침체') return '▼';
  return '—';
}

interface IndicatorTableProps {
  factors: SignalFactor[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  renderDetail?: (index: number) => ReactNode;
}

export default function IndicatorTable({ factors, selectedIndex, onSelect, renderDetail }: IndicatorTableProps) {
  const factorMap = new Map(factors.map(f => [f.label, f]));

  const overheated = factors.filter(f => f.direction === '과열').length;
  const cooled = factors.filter(f => f.direction === '침체').length;
  const neutral = factors.length - overheated - cooled;

  return (
    <div className="dot-card p-4 sm:p-5">
      <div className="dot-card-inner">
        {/* Header with status summary */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider flex items-center gap-1.5">
            <LivePulse size={4} />
            지표 총람
          </h2>
          <div className="flex items-center gap-2">
            {overheated > 0 && (
              <span className="text-[10px] font-mono text-dot-red">{overheated} 과열</span>
            )}
            {neutral > 0 && (
              <span className="text-[10px] font-mono text-dot-muted">{neutral} 중립</span>
            )}
            {cooled > 0 && (
              <span className="text-[10px] font-mono text-dot-blue">{cooled} 침체</span>
            )}
          </div>
        </div>

        {/* Indicator rows with inline detail expansion */}
        <div>
          {INDICATOR_ORDER.map((def, i) => {
            const factor = factorMap.get(def.factorLabel);
            if (!factor) return null;

            const isSelected = selectedIndex === i;
            const color = getDirColor(factor.direction);
            const arrow = getDirArrow(factor.direction);

            return (
              <div key={def.factorLabel}>
                {/* Row button */}
                <button
                  onClick={() => onSelect(i)}
                  className={`dot-entrance w-full flex items-center justify-between py-2.5 px-2 -mx-2 rounded-sm transition-colors ${
                    i > 0 && !isSelected ? 'border-t border-dashed border-dot-border/15' : ''
                  } ${isSelected ? 'bg-dot-accent/[0.06]' : 'hover:bg-dot-border/[0.06]'}`}
                  style={{ '--entrance-delay': `${i * 30}ms` } as React.CSSProperties}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className={`text-[11px] ${isSelected ? 'text-dot-text font-medium' : 'text-dot-sub'}`}>
                      {def.displayLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-dot-text tabular-nums">
                      {factor.value}
                    </span>
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 min-w-[32px] text-center"
                      style={{ backgroundColor: `${color}12`, color }}
                    >
                      {factor.direction}
                    </span>
                    <span className="text-[9px] w-3 text-center" style={{ color }}>{arrow}</span>
                    <span
                      className="text-[10px] text-dot-muted/30 transition-transform duration-200 inline-block"
                      style={{ transform: isSelected ? 'rotate(90deg)' : 'rotate(0deg)' }}
                    >
                      ›
                    </span>
                  </div>
                </button>

                {/* Inline detail panel — expands below the tapped row */}
                {renderDetail && (
                  <div
                    className="overflow-hidden transition-all ease-out"
                    style={{
                      maxHeight: isSelected ? '800px' : '0px',
                      opacity: isSelected ? 1 : 0,
                      transitionDuration: isSelected ? '0.4s' : '0.2s',
                    }}
                  >
                    {isSelected && (
                      <div className="pt-2 pb-3">
                        <div className="flex justify-end mb-1">
                          <button
                            onClick={() => onSelect(i)}
                            className="text-[10px] text-dot-muted hover:text-dot-accent transition font-mono"
                          >
                            [ 접기 ]
                          </button>
                        </div>
                        {renderDetail(i)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-[9px] text-dot-muted/40 font-mono text-center mt-3">
          지표를 탭하면 상세 분석을 볼 수 있습니다
        </p>
      </div>
    </div>
  );
}
