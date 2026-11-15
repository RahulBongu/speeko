'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchManifest,
  LOCALE_META,
  type CourseManifestEntry,
} from '@/lib/courses';
import { saveProgress } from '@/lib/progress';
import { useProgress } from '@/lib/use-progress';

/**
 * In-path course switcher. Changing the select updates the learner's last
 * course and routes to that path; browser Back returns to the previous one.
 */
export function CourseSwitcher({ courseId }: { courseId: string }) {
  const router = useRouter();
  const progress = useProgress();
  const [manifest, setManifest] = useState<CourseManifestEntry[] | null>(null);

  useEffect(() => {
    let active = true;
    fetchManifest()
      .then((entries) => {
        if (active) setManifest(entries);
      })
      .catch(() => {
        if (active) setManifest(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const currentId = manifest?.find((entry) => entry.id === courseId)?.id ?? courseId;

  function choose(nextId: string) {
    if (nextId === currentId) return;
    if (progress) {
      saveProgress({ ...progress, lastCourseId: nextId });
    }
    router.push(`/learn/${nextId}`);
  }

  return (
    <div className="relative flex min-w-0 items-center gap-2">
      {manifest ? (
        <select
          value={currentId}
          disabled={!progress}
          onChange={(event) => choose(event.target.value)}
          aria-label="Switch course"
          className="focus-ring max-w-[12rem] truncate rounded-xl border-2 border-transparent bg-transparent py-1.5 pl-1 pr-7 font-display text-sm font-extrabold text-bark-700 outline-none transition hover:border-cream-200 hover:bg-white disabled:opacity-70"
        >
          {manifest.map((entry) => {
            const meta = LOCALE_META[entry.locale];
            return (
              <option key={entry.id} value={entry.id}>
                {meta.native} · {meta.english}
              </option>
            );
          })}
        </select>
      ) : (
        <span className="truncate font-display text-sm font-extrabold text-bark-700">
          {LOCALE_META[currentId.replace(/-starter$/, '') as keyof typeof LOCALE_META]?.english ??
            'Courses'}
        </span>
      )}
    </div>
  );
}
