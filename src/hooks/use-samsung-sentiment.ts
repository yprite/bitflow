'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { SentimentData } from '@/lib/samsung/types';

const POLL_INTERVAL_MS = 30_000;

interface UseSamsungSentimentReturn {
  readonly sentiment: SentimentData | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly refresh: () => Promise<void>;
}

async function fetchSentiment(): Promise<SentimentData> {
  const response = await fetch('/api/samsung/sentiment');

  if (!response.ok) {
    throw new Error(`Sentiment fetch failed: ${response.status}`);
  }

  return response.json();
}

export function useSamsungSentiment(): UseSamsungSentimentReturn {
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchSentiment();
      setSentiment(data);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '데이터를 불러올 수 없습니다';
      setError(message);
    }
  }, []);

  const initialLoad = useCallback(async () => {
    setIsLoading(true);
    await refresh();
    setIsLoading(false);
  }, [refresh]);

  useEffect(() => {
    initialLoad();
    intervalRef.current = setInterval(refresh, POLL_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        refresh();
        intervalRef.current = setInterval(refresh, POLL_INTERVAL_MS);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [initialLoad, refresh]);

  return { sentiment, isLoading, error, refresh };
}
