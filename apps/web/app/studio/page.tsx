'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/AppHeader';
import { Fox } from '@/components/Fox';

interface ManifestEntry {
  id: string;
  locale: string;
  title: string;
  difficulty: string;
  units: number;
  lessons: number;
  exercises: number;
  reviewStatus?: string;
  file: string;
}

export default function StudioIndex() {
  const [entries, setEntries] = useState<ManifestEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setError(null);
    fetch('/courses/manifest.json')
      .then((response) => {
        if (!response.ok) throw new Error(`Manifest could not load (status ${response.status}).`);
        return response.json() as Promise<ManifestEntry[]>;
      })
      .then((data) => {
        if (active) setEntries(data);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : String(cause));
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const header = <SiteHeader active="studio" />;

  if (error) {
    return (
      <div className="min-h-screen">
        {header}
        <main className="mx-auto flex max-w-2xl flex-col items-center px-5 py-20 text-center">
          <Fox mood="sad" className="h-28 w-28" />
          <h1 className="mt-3 font-display text-3xl font-extrabold text-bark-800">
            Studio could not load
          </h1>
          <p role="alert" className="mt-2 max-w-md text-sm font-semibold text-bark-500">
            {error}
          </p>
          <button type="button" className="btn-primary mt-6" onClick={() => setReloadKey((key) => key + 1)}>
            Try again
          </button>
        </main>
      </div>
    );
  }

  if (!entries) {
    return (
      <div className="min-h-screen">
        {header}
        <main className="mx-auto flex max-w-2xl flex-col items-center px-5 py-20 text-center">
          <Fox className="h-28 w-28 animate-bob" />
          <p className="mt-3 font-display text-sm font-extrabold uppercase tracking-[0.16em] text-bark-500">
            Loading courses…
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {header}
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6">
        <div className="flex flex-col gap-2">
          <p className="eyebrow">Studio</p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-bark-800 sm:text-5xl">
            Speeko Studio
          </h1>
          <p className="max-w-2xl text-sm font-semibold text-bark-500">
            Content authoring &amp; validation. {entries.length} course
            {entries.length === 1 ? '' : 's'} loaded.
          </p>
        </div>

        {entries.length === 0 ? (
          <section className="card mt-6 flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
            <Fox mood="idle" className="h-20 w-20 shrink-0" />
            <div className="flex-1">
              <h2 className="font-display text-xl font-extrabold text-bark-800">
                No courses published yet
              </h2>
              <p className="mt-1 text-sm font-semibold text-bark-500">
                Scaffold your first course to see it here, or check that the manifest lists
                published courses.
              </p>
            </div>
          </section>
        ) : (
          <ul className="card mt-6 divide-y divide-cream-200 overflow-hidden p-0">
            {entries.map((entry) => (
              <li key={entry.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/studio/${entry.id}`}
                      className="font-display font-extrabold text-bark-800 underline-offset-2 hover:text-speeko-700 hover:underline"
                    >
                      {entry.title}
                    </Link>
                    {entry.reviewStatus === 'draft' ? (
                      <span className="rounded-full border border-fox-200 bg-fox-100 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-fox-700">
                        Draft
                      </span>
                    ) : (
                      <span className="rounded-full border border-speeko-200 bg-speeko-50 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-speeko-700">
                        Reviewed
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs font-semibold text-bark-400">
                    {entry.locale} · {entry.difficulty} · {entry.units} units · {entry.lessons} lessons · {entry.exercises} exercises
                  </p>
                </div>
                <Link href={`/studio/${entry.id}`} className="btn-secondary shrink-0">
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-6 text-sm font-semibold text-bark-500">
          Scaffold a new course:{' '}
          <code className="rounded-md bg-cream-100 px-1.5 py-0.5 font-mono text-xs text-bark-700">
            pnpm --filter @speeko/content run scaffold &lt;locale&gt; &lt;id&gt;
          </code>
        </p>
      </main>
    </div>
  );
}
