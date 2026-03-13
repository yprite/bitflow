'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { RESIZE_DEBOUNCE_MS } from './constants';

interface Size {
  width: number;
  height: number;
}

/**
 * Observes element size changes with debouncing.
 * Returns current dimensions and a callback ref to attach to the container.
 */
export function useResizeObserver<T extends HTMLElement>(): {
  ref: (node: T | null) => void;
  size: Size;
} {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const nodeRef = useRef<T | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const ref = useCallback((node: T | null) => {
    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    clearTimeout(timeoutRef.current);

    nodeRef.current = node;

    if (node) {
      setSize({ width: node.clientWidth, height: node.clientHeight });

      observerRef.current = new ResizeObserver((entries) => {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          const entry = entries[0];
          if (entry) {
            setSize({
              width: entry.contentRect.width,
              height: entry.contentRect.height,
            });
          }
        }, RESIZE_DEBOUNCE_MS);
      });

      observerRef.current.observe(node);
    }
  }, []);

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
      clearTimeout(timeoutRef.current);
    };
  }, []);

  return { ref, size };
}
