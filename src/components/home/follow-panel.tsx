'use client';

import { RECOMMENDED_TAG_COUNT } from '@/lib/home-preferences';
import { useMemo } from 'react';

export function FollowPanel({
  tags,
  selected,
  onChange,
}: {
  tags: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const selectedCount = selected.length;

  const helperText = useMemo(() => {
    if (selectedCount === 0) {
      return '관심 테마를 3개만 골라두면 장중 급등, 거래량 폭증, 일정 D-1 같은 알림 기준으로 바로 연결하기 좋습니다.';
    }

    return `${selectedCount}개 테마를 저장했습니다. 이 선택을 기준으로 관심 종목 우선 정렬과 장중 알림 큐를 붙일 예정입니다.`;
  }, [selectedCount]);

  function toggleTag(tag: string) {
    onChange(selected.includes(tag) ? selected.filter((item) => item !== tag) : [...selected, tag]);
  }

  return (
    <>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">{helperText}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isSelected = selected.includes(tag);

          return (
            <button
              key={tag}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggleTag(tag)}
              className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                isSelected
                  ? 'border border-slate-900 bg-slate-900 text-white shadow-[0_10px_30px_rgba(15,23,42,0.18)]'
                  : 'border border-slate-900/10 bg-white/80 text-slate-800 hover:bg-white'
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          {selectedCount > 0 ? `${selectedCount}개 테마 알림 준비` : '알림 받을 테마 고르기'}
        </button>
        <button
          type="button"
          onClick={() => onChange(tags.slice(0, RECOMMENDED_TAG_COUNT))}
          className="rounded-full border border-slate-900/10 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-white"
        >
          추천 3개 담기
        </button>
      </div>
    </>
  );
}
