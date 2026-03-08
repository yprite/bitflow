'use client';

import type { MarketDirection, RankingItem, RankingTab } from '@/lib/market-home-content';
import Link from 'next/link';
import { useState } from 'react';

function directionStyles(direction: MarketDirection): { value: string; dot: string } {
  switch (direction) {
    case 'up':
      return {
        value: 'text-[#F97316]',
        dot: 'bg-[#F97316]',
      };
    case 'down':
      return {
        value: 'text-[#60A5FA]',
        dot: 'bg-[#60A5FA]',
      };
    default:
      return {
        value: 'text-slate-400',
        dot: 'bg-slate-500',
      };
  }
}

function RankingRow({ item }: { item: RankingItem }) {
  const styles = directionStyles(item.direction);
  const content = (
    <>
      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#FFF3D5] text-sm font-semibold text-slate-900">
        {item.rank}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-white">{item.name}</p>
          <span className="truncate text-xs text-slate-500">{item.price}</span>
        </div>
        <p className="mt-1 truncate text-xs text-slate-400">{item.reason}</p>
      </div>
      <div className="text-right">
        <p className={`text-sm font-semibold ${styles.value}`}>{item.change}</p>
        <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-slate-400">
          <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
          <span>{item.signal}</span>
        </div>
      </div>
    </>
  );

  return item.href ? (
    <li>
      <Link
        href={item.href}
        className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[24px] border border-white/8 bg-white/5 px-4 py-3 transition hover:border-white/20 hover:bg-white/10"
      >
        {content}
      </Link>
    </li>
  ) : (
    <li className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[24px] border border-white/8 bg-white/5 px-4 py-3">
      {content}
    </li>
  );
}

export function LiveRankingBoard({
  tabs,
  note,
}: {
  tabs: RankingTab[];
  note?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeTab = tabs[activeIndex] ?? tabs[0];

  return (
    <div>
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="실시간 랭킹 분류">
        {tabs.map((tab, index) => {
          const isActive = index === activeIndex;

          return (
            <button
              key={tab.label}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`ranking-panel-${index}`}
              id={`ranking-tab-${index}`}
              onClick={() => setActiveIndex(index)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-[#FFF3D5] text-slate-900'
                  : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-[24px] border border-white/8 bg-black/10 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{activeTab.label}</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">{activeTab.summary}</p>
        {note ? <p className="mt-2 text-xs leading-5 text-slate-500">{note}</p> : null}
      </div>

      <div
        role="tabpanel"
        id={`ranking-panel-${activeIndex}`}
        aria-labelledby={`ranking-tab-${activeIndex}`}
      >
        <ol className="mt-5 space-y-3">
          {activeTab.items.map((item) => (
            <RankingRow key={`${activeTab.label}-${item.rank}-${item.name}`} item={item} />
          ))}
        </ol>
      </div>
    </div>
  );
}
