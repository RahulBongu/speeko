import Link from 'next/link';
import { Fox } from '@/components/Fox';

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <main className="mx-auto flex max-w-2xl flex-col items-center px-5 py-20 text-center">
        <Fox mood="sad" className="h-28 w-28" />
        <h1 className="mt-3 font-display text-3xl font-extrabold text-bark-800">
          Page not found
        </h1>
        <p className="mt-2 max-w-md text-sm font-semibold text-bark-500">
          The fox looked everywhere — this page doesn&apos;t exist. It may have moved, or the link
          was mistyped.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/" className="btn-primary">
            Back home
          </Link>
          <Link href="/learn" className="btn-secondary">
            Browse courses
          </Link>
        </div>
      </main>
    </div>
  );
}
