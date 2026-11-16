'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { validateCourse } from '@speeko/core';

export default function StudioEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/courses/${id}.json`)
      .then((r) => r.text())
      .then((t) => {
        setText(t);
        setStatus('ok');
      })
      .catch(() => setStatus('error'));
  }, [id]);

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

  if (status === 'loading') return <main className="p-6">Loading…</main>;
  if (status === 'error') return <main className="p-6 text-red-600">Failed to load course.</main>;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-speeko-600">Edit: {id}</h1>
        <div className="flex gap-2">
          <button
            onClick={download}
            className="rounded bg-speeko-600 px-3 py-1 text-sm text-white hover:bg-speeko-700"
          >
            Download JSON
          </button>
          <Link href="/studio" className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">
            Back
          </Link>
        </div>
      </div>
      {errors.length > 0 ? (
        <div className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          <p className="font-semibold">Validation errors:</p>
          <ul className="mt-1 list-disc pl-5">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 text-sm text-green-700">✓ Valid course</p>
      )}
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        className="mt-4 h-[60vh] w-full rounded border border-gray-300 p-3 font-mono text-sm"
        spellCheck={false}
      />
    </main>
  );
}
