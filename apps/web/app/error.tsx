'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Fox } from '@/components/Fox';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen">
      <main className="mx-auto flex max-w-2xl flex-col items-center px-5 py-20 text-center">
        <Fox mood="sad" className="h-28 w-28" />
        <h1 className="mt-3 font-display text-3xl font-extrabold text-bark-800">
          Something broke
        </h1>
        <p role="alert" className="mt-2 max-w-md text-sm font-semibold text-bark-500">
          The page hit an unexpected error. Try again — if it keeps happening, come back later.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button type="button" className="btn-primary" onClick={reset}>
            Try again
          </button>
          <Link href="/" className="btn-secondary">
            Back home
          </Link>
        </div>
      </main>
    </div>
  );
}
