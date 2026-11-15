'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ManifestEntry {
  id: string;
  locale: string;
  title: string;
  difficulty: string;
  units: number;
  lessons: number;
  exercises: number;
  file: string;
}

export default function StudioIndex() {
  const [entries, setEntries] = useState<ManifestEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/courses/manifest.json')
      .then((r) => r.json())
      .then(setEntries)
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold text-speeko-600">Speeko Studio</h1>
      <p className="mt-2 text-gray-600">Content authoring &amp; validation. {entries.length} courses loaded.</p>
      {error && <p className="mt-4 text-red-600">{error}</p>}
      <ul className="mt-6 divide-y divide-gray-200 rounded-lg border border-gray-200">
        {entries.map((e) => (
          <li key={e.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <Link href={`/studio/${e.id}`} className="font-medium text-speeko-700 hover:underline">
                {e.title}
              </Link>
              <span className="ml-2 text-sm text-gray-500">
                {e.locale} · {e.difficulty} · {e.units} units · {e.lessons} lessons · {e.exercises} exercises
              </span>
            </div>
            <Link
              href={`/studio/${e.id}`}
              className="rounded bg-speeko-600 px-3 py-1 text-sm text-white hover:bg-speeko-700"
            >
              Edit
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-gray-500">
        Scaffold a new course: <code>pnpm --filter @speeko/content run scaffold &lt;locale&gt; &lt;id&gt;</code>
      </p>
    </main>
  );
}
