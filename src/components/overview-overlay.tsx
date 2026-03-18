'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'bitflow:overview-dismissed';

const overviewCards = [
  {
    title: '실시간 시장 체온',
    body: '김치프리미엄, 펀딩비, 공포탐욕, 거래량 변화를 함께 묶어 지금 시장이 과열인지 경계 국면인지 빠르게 읽도록 구성했습니다.',
    href: '/realtime',
    label: '실시간 지표 보기',
  },
  {
    title: '온체인과 흐름 해석',
    body: '가격만 보지 않고 수수료 혼잡도, 고래 이동, 거래소 순유입, 활동 공급 비중까지 같이 확인할 수 있습니다.',
    href: '/onchain',
    label: '온체인 보기',
  },
  {
    title: '주간 리포트와 도구',
    body: '이번 주 핵심 리포트, BTC 전송 실무 도구, 차익 계산기까지 한국 사용자 기준으로 이어서 탐색할 수 있습니다.',
    href: '/weekly',
    label: '주간 리포트 보기',
  },
] as const;

export default function OverviewOverlay() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const dismissed = window.localStorage.getItem(STORAGE_KEY) === '1';
    const sessionClosed = window.sessionStorage.getItem(STORAGE_KEY) === '1';
    if (!dismissed && !sessionClosed) {
      setVisible(true);
    }
  }, []);

  function close() {
    setClosing(true);
    window.sessionStorage.setItem(STORAGE_KEY, '1');
    setTimeout(() => setVisible(false), 300);
  }

  function dismissForever() {
    setClosing(true);
    window.localStorage.setItem(STORAGE_KEY, '1');
    setTimeout(() => setVisible(false), 300);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        animation: closing
          ? 'overlayFadeOut 0.3s ease-out forwards'
          : 'overlayFadeIn 0.3s ease-out forwards',
      }}
    >
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
        onClick={close}
      />

      {/* panel */}
      <div
        className="relative w-full max-w-lg dot-card p-5 sm:p-6 space-y-4"
        style={{
          animation: closing
            ? 'panelSlideOut 0.3s ease-out forwards'
            : 'panelSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        <div className="space-y-1">
          <h2 className="text-xs font-semibold text-dot-accent uppercase tracking-wider">
            비트코인 기상청에서 바로 할 수 있는 것
          </h2>
          <p className="text-xs leading-relaxed text-dot-sub">
            실시간 데이터 확인에 그치지 않고, 해석 가능한 신호와 주간 정리 콘텐츠까지 함께 제공합니다.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {overviewCards.map((card) => (
            <article key={card.title} className="border border-dot-border/60 p-4 dot-grid-sparse">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-dot-sub">{card.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-dot-sub">{card.body}</p>
              <Link
                href={card.href}
                onClick={close}
                className="mt-3 inline-flex text-[11px] font-medium text-dot-accent hover:underline"
              >
                {card.label}
              </Link>
            </article>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={dismissForever}
            className="text-[11px] text-dot-muted hover:text-dot-sub transition font-mono"
          >
            다시 보지 않기
          </button>
          <button
            type="button"
            onClick={close}
            className="inline-flex items-center gap-1 rounded-sm border border-dot-border/60 bg-white px-3 py-1.5 text-[11px] font-medium text-dot-accent hover:border-dot-accent/50 transition"
          >
            닫기
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes overlayFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes overlayFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes panelSlideIn {
          from {
            opacity: 0;
            filter: blur(6px);
            transform: translateY(20px) scale(0.96);
          }
          to {
            opacity: 1;
            filter: blur(0px);
            transform: translateY(0) scale(1);
          }
        }
        @keyframes panelSlideOut {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(12px) scale(0.97);
          }
        }
      `}</style>
    </div>
  );
}
