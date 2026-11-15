'use client';

import { useEffect, useState } from 'react';
import { loadProgress, PROGRESS_EVENT, type ProgressState } from './progress';

/**
 * Reads local progress on mount and keeps every tab in sync. Returns null until
 * the first client read so callers can render a stable loading state.
 */
export function useProgress(): ProgressState | null {
  const [progress, setProgress] = useState<ProgressState | null>(null);

  useEffect(() => {
    setProgress(loadProgress());

    const onCustom = (event: Event) => {
      const detail = (event as CustomEvent<ProgressState>).detail;
      setProgress(detail ?? loadProgress());
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key.startsWith('speeko.progress')) {
        setProgress(loadProgress());
      }
    };

    window.addEventListener(PROGRESS_EVENT, onCustom);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, onCustom);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return progress;
}
