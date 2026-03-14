'use client';

import { useEffect, useRef } from 'react';
import { trackPageView } from '@/lib/event-tracker';

export default function EventTracker() {
  const tracked = useRef<string | null>(null);

  useEffect(() => {
    const page = window.location.pathname;
    if (tracked.current !== page) {
      tracked.current = page;
      trackPageView(page);
    }
  }, []);

  return null;
}
