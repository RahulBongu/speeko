'use client';

import { useEffect, useRef } from 'react';
import { mergeProgress, progressEquals, type ProgressState } from '@speeko/core';
import { authClient } from '@/lib/auth-client';
import { PROGRESS_EVENT, loadProgress, saveProgress } from '@/lib/progress';
import { fetchCloudProgress, pushCloudProgress } from '@/lib/sync';

/**
 * Keeps the local progress store and the signed-in user's cloud snapshot in
 * sync. Guests keep working entirely offline; signing in merges both sides.
 */
export function ProgressSync() {
  const { data: session } = authClient.useSession();
  const userId = session?.user.id ?? null;
  const readyFor = useRef<string | null>(null);

  useEffect(() => {
    readyFor.current = null;
    if (!userId) return;

    let cancelled = false;
    (async () => {
      try {
        const remote = await fetchCloudProgress();
        if (cancelled) return;
        const local = loadProgress();
        const merged = remote ? mergeProgress(remote, local) : local;

        if (!progressEquals(merged, local)) saveProgress(merged);
        if (!remote || !progressEquals(merged, remote)) {
          await pushCloudProgress(merged);
          if (cancelled) return;
        }
        readyFor.current = userId;
      } catch {
        // The app stays usable offline; the next local save retries the sync.
        readyFor.current = userId;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const onProgress = (event: Event) => {
      if (readyFor.current !== userId) return;
      const detail = (event as CustomEvent<ProgressState>).detail;
      const progress = detail ?? loadProgress();
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void pushCloudProgress(progress).catch(() => {
          // Retried on the next progress event.
        });
      }, 300);
    };

    window.addEventListener(PROGRESS_EVENT, onProgress);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener(PROGRESS_EVENT, onProgress);
    };
  }, [userId]);

  return null;
}
