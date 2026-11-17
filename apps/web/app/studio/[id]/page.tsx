'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { validateCourse } from '@speeko/core';
import { SiteHeader } from '@/components/AppHeader';
import { Fox } from '@/components/Fox';
import { ArrowLeftIcon } from '@/components/icons';

export default function StudioEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [errors, setErrors] = useState<string[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus('loading');
    fetch(`/courses/${id}.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`Course could not load (status ${response.status}).`);
        return response.text();
      })
      .then((body) => {
        if (!active) return;
        setText(body);
        setStatus('ok');
      })
      .catch(() => {
        if (active) setStatus('error');
      });
    return () => {
      active = false;
    };
  }, [id, reloadKey]);

  const validate = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      validateCourse(parsed);
      setErrors([]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrors(msg.split('\n').slice(0, 12));
    }
  };

  const onChange = (value: string) => {
    setText(value);
    validate(value);
  };

  const download = () => {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const header = <SiteHeader active="studio" />;

  if (status === 'loading') {
    return (
      <div className="min-h-screen">
        {header}
        <main className="mx-auto flex max-w-2xl flex-col items-center px-5 py-20 text-center">
          <Fox className="h-28 w-28 animate-bob" />
          <p className="mt-3 font-display text-sm font-extrabold uppercase tracking-[0.16em] text-bark-500">
            Loading course…
          </p>
        </main>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen">
        {header}
        <main className="mx-auto flex max-w-2xl flex-col items-center px-5 py-20 text-center">
          <Fox mood="sad" className="h-28 w-28" />
          <h1 className="mt-3 font-display text-3xl font-extrabold text-bark-800">
            Failed to load course
          </h1>
          <p role="alert" className="mt-2 max-w-md text-sm font-semibold text-bark-500">
            {id}.json could not be fetched. Check that the file exists in the published courses.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button type="button" className="btn-primary" onClick={() => setReloadKey((key) => key + 1)}>
              Try again
            </button>
            <Link href="/studio" className="btn-secondary">
              Back to Studio
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {header}
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="eyebrow">Studio</p>
            <h1 className="mt-1 truncate font-display text-2xl font-extrabold tracking-tight text-bark-800 sm:text-3xl">
              Edit: {id}
            </h1>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link href="/studio" className="btn-secondary">
              <ArrowLeftIcon className="h-4 w-4" />
              Back
            </Link>
            <button type="button" onClick={download} className="btn-primary">
              Download JSON
            </button>
          </div>
        </div>

        {errors.length > 0 ? (
          <div
            role="alert"
            className="mt-4 rounded-2xl border-2 border-fox-200 bg-fox-100 p-4 text-sm text-fox-700"
          >
            <p className="font-display font-extrabold">Validation errors:</p>
            <ul className="mt-1 list-disc pl-5 font-semibold">
              {errors.map((error, index) => (
                <li key={`${index}-${error}`}>{error}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-4 text-sm font-extrabold text-speeko-700">
            ✓ Valid course
          </p>
        )}

        <label
          htmlFor="course-editor"
          className="mt-4 block text-[11px] font-extrabold uppercase tracking-[0.16em] text-bark-500"
        >
          Course JSON
        </label>
        <textarea
          id="course-editor"
          value={text}
          onChange={(event) => onChange(event.target.value)}
          className="mt-1.5 h-[60vh] w-full rounded-2xl border-2 border-cream-200 bg-white p-3 font-mono text-sm text-bark-800 shadow-card-sm outline-none transition focus:border-speeko-400 focus-visible:ring-4 focus-visible:ring-speeko-300"
          spellCheck={false}
        />
      </main>
    </div>
  );
}
