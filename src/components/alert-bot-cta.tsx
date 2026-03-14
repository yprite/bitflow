'use client';

import { trackEvent } from '@/lib/event-tracker';

export default function AlertBotCta() {
  return (
    <a
      href="https://t.me/btcfloww_bot"
      target="_blank"
      rel="noreferrer"
      onClick={() => trackEvent('telegram_bot_click', '/alert')}
      className="inline-flex items-center justify-center border-2 border-dot-accent px-3 py-2 text-xs font-semibold text-dot-accent hover:bg-dot-accent hover:text-white transition font-mono uppercase tracking-wider"
    >
      텔레그램 봇 열기
    </a>
  );
}
