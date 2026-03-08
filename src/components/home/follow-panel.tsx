'use client';

import {
  ALERT_MODE_LABEL,
  RECOMMENDED_TAG_COUNT,
  type AlertMode,
} from '@/lib/home-preferences';
import { useMemo } from 'react';

interface AlertPreviewItem {
  title: string;
  summary: string;
}

export function FollowPanel({
  tags,
  selected,
  onChange,
  alertMode,
  onAlertModeChange,
  previews,
}: {
  tags: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  alertMode: AlertMode;
  onAlertModeChange: (mode: AlertMode) => void;
  previews: AlertPreviewItem[];
}) {
  const selectedCount = selected.length;

  const helperText = useMemo(() => {
    if (selectedCount === 0) {
      return '관심 테마를 3개만 골라두면 장중 급등, 거래량 폭증, 일정 D-1 같은 알림 기준으로 바로 연결하기 좋습니다.';
    }

    return `${selectedCount}개 테마를 저장했습니다. 이 선택을 기준으로 관심 종목 우선 정렬과 장중 알림 큐를 붙일 예정입니다.`;
  }, [selectedCount]);

  const alertHelperText = useMemo(() => {
    if (alertMode === 'off') {
      return '알림을 끄면 관심 시장 우선 정렬만 유지됩니다.';
    }

    if (alertMode === 'close') {
      return '장중 푸시는 줄이고, 장마감에 한 번만 정리해서 받는 방식입니다.';
    }

    return '관심 테마가 붙는 순간 바로 반응하도록 가장 공격적인 모드입니다.';
  }, [alertMode]);

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
          {selectedCount > 0 ? `${selectedCount}개 테마 ${ALERT_MODE_LABEL[alertMode]}` : '알림 받을 테마 고르기'}
        </button>
        <button
          type="button"
          onClick={() => onChange(tags.slice(0, RECOMMENDED_TAG_COUNT))}
          className="rounded-full border border-slate-900/10 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-white"
        >
          추천 3개 담기
        </button>
      </div>
      <div className="mt-6 rounded-[28px] border border-slate-900/10 bg-white/70 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Alert Mode</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(['instant', 'close', 'off'] as AlertMode[]).map((mode) => {
            const isActive = mode === alertMode;

            return (
              <button
                key={mode}
                type="button"
                onClick={() => onAlertModeChange(mode)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-900/10 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {ALERT_MODE_LABEL[mode]}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-700">{alertHelperText}</p>
      </div>
      <div className="mt-5 rounded-[28px] border border-slate-900/10 bg-white/70 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Preview</p>
            <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-900">내가 받게 될 알림 미리보기</h3>
          </div>
          <span className="rounded-full border border-slate-900/10 bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-700">
            {ALERT_MODE_LABEL[alertMode]}
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {previews.map((preview, index) => (
            <div key={`${preview.title}-${index}`} className="rounded-[22px] border border-slate-900/10 bg-white px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">{preview.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{preview.summary}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-500">
          현재는 설정과 미리보기까지 연결했습니다. 실제 Telegram 연결은 다음 단계에서 붙입니다.
        </p>
      </div>
    </>
  );
}
