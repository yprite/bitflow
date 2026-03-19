'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SITE_NAME, SITE_REPO_URL } from '@/lib/site';

interface OverviewCard {
  title: string;
  body: string;
  href: string;
  label: string;
}

export default function HomeIntroModal({
  overviewCards,
  baseUrl,
  contactEmail,
}: {
  overviewCards: readonly OverviewCard[];
  baseUrl: string;
  contactEmail: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex rounded-sm border border-dot-border/60 bg-white/75 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.16em] text-dot-sub transition hover:border-dot-accent/50 hover:text-dot-accent"
      >
        서비스 안내
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center overflow-y-auto bg-black/45 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-[calc(env(safe-area-inset-top)+0.5rem)] backdrop-blur-[2px] sm:items-center sm:px-3 sm:py-5"
          onClick={handleClose}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${SITE_NAME} 소개`}
            className="dot-card relative flex w-full max-w-2xl flex-col overflow-hidden max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1rem)] sm:max-h-[calc(100dvh-2.5rem)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 border-b border-dot-border/60 bg-white/95 px-4 py-3 sm:px-5 sm:py-4">
              <div className="space-y-1">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-dot-muted">
                  Bitcoin Weather Station
                </p>
                <h2 className="text-sm font-semibold tracking-tight text-dot-accent">
                  {SITE_NAME}
                </h2>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
              <div className="space-y-5">
                <div className="space-y-2">
                  <p className="text-sm leading-relaxed text-dot-sub">
                    비트코인 기상청(BitFlow)은 한국 투자자가 실제로 체감하는 국내 프리미엄,
                    파생 포지셔닝, 온체인 흐름을 한 화면에서 읽기 쉽게 정리한 비트코인 데이터 사이트입니다.
                  </p>
                  <p className="text-xs leading-relaxed text-dot-sub">
                    실시간 데이터 확인에 그치지 않고, 해석 가능한 신호와 주간 정리 콘텐츠까지 함께 제공합니다.
                    브랜드 검색어인 비트코인 기상청으로 유입된 사용자가 사이트 목적을 즉시 이해할 수 있도록 핵심 화면을 아래에 묶었습니다.
                  </p>
                </div>

                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-dot-accent">
                    비트코인 기상청에서 바로 할 수 있는 것
                  </h3>
                  <div className="grid gap-3">
                    {overviewCards.map((card) => (
                      <article key={card.title} className="border border-dot-border/60 p-4 dot-grid-sparse">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-dot-sub">{card.title}</h4>
                        <p className="mt-2 text-xs leading-relaxed text-dot-sub">{card.body}</p>
                        <Link
                          href={card.href}
                          className="mt-3 inline-flex text-[11px] font-medium text-dot-accent hover:underline"
                          onClick={() => setOpen(false)}
                        >
                          {card.label}
                        </Link>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="space-y-3">
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-dot-sub">
                    <Link href="/weekly" className="hover:text-dot-accent transition" onClick={handleClose}>주간 리포트</Link>
                    <Link href="/privacy" className="hover:text-dot-accent transition" onClick={handleClose}>개인정보처리방침</Link>
                    <Link href="/contact" className="hover:text-dot-accent transition" onClick={handleClose}>문의</Link>
                    <Link href="/disclaimer" className="hover:text-dot-accent transition" onClick={handleClose}>면책 및 이용안내</Link>
                  </div>
                  <p className="text-[11px] leading-relaxed text-dot-sub">
                    공식 사이트:
                    {' '}
                    <a href={baseUrl} className="text-dot-accent hover:underline">
                      {SITE_NAME}
                    </a>
                    {' · '}
                    공개 저장소:
                    {' '}
                    <a href={SITE_REPO_URL} target="_blank" rel="noreferrer" className="text-dot-accent hover:underline">
                      GitHub
                    </a>
                    {contactEmail ? (
                      <>
                        {' · '}
                        문의:
                        {' '}
                        <a href={`mailto:${contactEmail}`} className="text-dot-accent hover:underline">
                          {contactEmail}
                        </a>
                      </>
                    ) : null}
                  </p>
                </section>
              </div>
            </div>

            <div className="border-t border-dot-border/60 bg-white/92 px-4 py-3 sm:px-5 sm:py-4">
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex rounded-sm border border-dot-accent bg-dot-accent px-3 py-2 text-[11px] font-mono text-white transition hover:opacity-90"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
