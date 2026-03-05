'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'bitflow_cookie_consent';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--card)]/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-400">
          본 사이트는 광고 제공을 위해 쿠키를 사용합니다.{' '}
          <Link href="/privacy" className="text-blue-400 underline underline-offset-4 hover:text-blue-300">
            개인정보처리방침
          </Link>
        </p>
        <button
          type="button"
          onClick={accept}
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-blue-500"
        >
          동의
        </button>
      </div>
    </div>
  );
}
