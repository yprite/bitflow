'use client';

import { useState, type CSSProperties } from 'react';
import LivePulse from '@/components/motion/indicators/LivePulse';
import type {
  BtcReturnsHistory,
  BtcReturnsPeriod,
  BtcReturnsRow,
  BtcReturnsSection,
} from '@/lib/types';

interface Props {
  data: BtcReturnsHistory | null;
}

const VIEW_OPTIONS: Array<{ key: BtcReturnsPeriod; label: string }> = [
  { key: 'monthly', label: '월간' },
  { key: 'quarterly', label: '분기' },
];

function formatReturn(value: number | null, compact = false): string {
  if (value == null) return '·';

  const digits = compact ? 1 : 2;
  return `${value > 0 ? '+' : ''}${value.toFixed(digits)}%`;
}

function getCellStyle(value: number | null): CSSProperties {
  if (value == null) {
    return {
      backgroundColor: 'rgba(15, 23, 42, 0.03)',
      backgroundImage:
        'radial-gradient(circle at 1px 1px, rgba(15, 23, 42, 0.08) 0.7px, transparent 0.7px)',
      backgroundSize: '10px 10px',
      borderColor: 'rgba(15, 23, 42, 0.06)',
      color: 'rgba(15, 23, 42, 0.35)',
    };
  }

  const intensity = Math.min(Math.abs(value) / 40, 1);
  const color = value >= 0 ? '22, 163, 74' : '220, 38, 38';
  const ink = value >= 0 ? '#14532d' : '#7f1d1d';
  const alpha = 0.14 + intensity * 0.42;
  const lineAlpha = 0.12 + intensity * 0.22;
  const textColor = intensity > 0.38 ? '#ffffff' : ink;

  return {
    backgroundColor: `rgba(${color}, ${alpha})`,
    backgroundImage: [
      `linear-gradient(135deg, rgba(${color}, ${alpha + 0.08}) 0%, rgba(${color}, ${Math.max(alpha - 0.08, 0.08)}) 100%)`,
      `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, ${0.1 + intensity * 0.14}) 0.8px, transparent 0.8px)`,
    ].join(','),
    backgroundSize: 'auto, 10px 10px',
    borderColor: `rgba(${color}, ${lineAlpha + 0.12})`,
    color: textColor,
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.18)',
  };
}

function findSummaryCell(row: BtcReturnsRow | undefined, columns: string[], mode: 'max' | 'min') {
  if (!row) return null;

  return row.values.reduce<{ label: string; value: number } | null>((picked, value, index) => {
    if (value == null) return picked;
    if (!picked) return { label: columns[index], value };
    if (mode === 'max' ? value > picked.value : value < picked.value) {
      return { label: columns[index], value };
    }
    return picked;
  }, null);
}

function findLatestFilledCell(row: BtcReturnsRow | undefined, columns: string[]) {
  if (!row) return null;

  for (let index = row.values.length - 1; index >= 0; index -= 1) {
    const value = row.values[index];
    if (value != null) {
      return { label: columns[index], value };
    }
  }

  return null;
}

function SummaryCard({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'positive' | 'negative';
}) {
  const toneClass =
    tone === 'positive'
      ? 'text-emerald-700 border-emerald-200/70 bg-emerald-50/80'
      : tone === 'negative'
        ? 'text-rose-700 border-rose-200/70 bg-rose-50/80'
        : 'text-dot-sub border-dot-border/70 bg-gray-50/80';

  return (
    <div className={`border p-3 ${toneClass}`}>
      <p className="text-[10px] uppercase tracking-[0.18em] text-dot-muted">{label}</p>
      <p className="mt-1 text-sm font-mono">{value}</p>
    </div>
  );
}

export default function BtcReturnHeatmap({ data }: Props) {
  const [view, setView] = useState<BtcReturnsPeriod>('monthly');

  if (!data) {
    return (
      <div className="dot-card p-5 sm:p-6">
        <div className="dot-card-inner space-y-2">
          <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider flex items-center gap-1.5">
            <LivePulse size={4} />
            비트코인 월간/분기 수익률
          </h2>
          <p className="text-sm text-dot-muted">Coinglass 수익률 데이터를 가져오지 못했습니다.</p>
        </div>
      </div>
    );
  }

  const section: BtcReturnsSection = data[view];
  const latestYearRow = section.rows.find((row) => /^\d{4}$/.test(row.label));
  const averageRow = section.rows.find((row) => row.label === '평균');
  const bestAverage = findSummaryCell(averageRow, section.columns, 'max');
  const worstAverage = findSummaryCell(averageRow, section.columns, 'min');
  const latestFilled = findLatestFilledCell(latestYearRow, section.columns);
  const fetchedAt = new Date(data.fetchedAt).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="dot-card p-4 sm:p-6">
      <div className="dot-card-inner space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h2 className="text-xs font-semibold text-dot-sub uppercase tracking-wider flex items-center gap-1.5">
              <LivePulse size={4} />
              비트코인 월간/분기 수익률
            </h2>
            <p className="text-xs text-dot-sub leading-relaxed">
              Coinglass의 BTC 수익률 히스토리를 월간과 분기 기준으로 다시 정렬했습니다.
              현재 연도는 진행 중인 기간만 채워집니다.
            </p>
          </div>

          <div className="inline-flex border border-dot-border/80 p-1 bg-white">
            {VIEW_OPTIONS.map((option) => {
              const active = view === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setView(option.key)}
                  className={`px-3 py-1.5 text-[11px] font-mono transition ${
                    active
                      ? 'bg-dot-text text-white'
                      : 'text-dot-sub hover:text-dot-accent'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <SummaryCard
            label={latestYearRow ? `${latestYearRow.label} 최근` : '최근'}
            value={latestFilled ? `${latestFilled.label} ${formatReturn(latestFilled.value, true)}` : '데이터 없음'}
          />
          <SummaryCard
            label="평균 최고"
            value={bestAverage ? `${bestAverage.label} ${formatReturn(bestAverage.value, true)}` : '데이터 없음'}
            tone="positive"
          />
          <SummaryCard
            label="평균 최저"
            value={worstAverage ? `${worstAverage.label} ${formatReturn(worstAverage.value, true)}` : '데이터 없음'}
            tone="negative"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate border-spacing-1 text-[11px]">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 min-w-[78px] bg-white/95 px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-dot-muted backdrop-blur">
                  연도
                </th>
                {section.columns.map((column) => (
                  <th
                    key={column}
                    className="min-w-[74px] px-1 py-2 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-dot-muted"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {section.rows.map((row) => {
                const isMetaRow = !/^\d{4}$/.test(row.label);
                const isLatestYear = row.label === latestYearRow?.label;

                return (
                  <tr key={row.label}>
                    <th
                      className={`sticky left-0 z-10 px-3 py-2 text-left font-mono text-[11px] backdrop-blur ${
                        isLatestYear
                          ? 'bg-amber-50/95 text-amber-800'
                          : isMetaRow
                            ? 'bg-gray-50/95 text-dot-sub'
                            : 'bg-white/95 text-dot-text'
                      }`}
                    >
                      {row.label}
                    </th>
                    {row.values.map((value, index) => (
                      <td key={`${row.label}-${section.columns[index]}`} className="p-0">
                        <div
                          className="flex h-11 items-center justify-center border px-1 text-center font-mono leading-none"
                          style={getCellStyle(value)}
                          title={`${row.label} ${section.columns[index]} ${formatReturn(value)}`}
                        >
                          {formatReturn(value)}
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2 border-t border-dashed border-dot-border/70 pt-3 text-[11px] text-dot-muted sm:flex-row sm:items-center sm:justify-between">
          <p>데이터 출처: <a href={data.sourceUrl} target="_blank" rel="noreferrer" className="underline decoration-dotted underline-offset-4 hover:text-dot-accent">CoinGlass / Today</a></p>
          <p>최근 동기화: {fetchedAt}</p>
        </div>
      </div>
    </div>
  );
}
