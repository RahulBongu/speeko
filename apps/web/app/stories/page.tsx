'use client';

import Link from 'next/link';
import { SiteHeader } from '@/components/AppHeader';
import { Fox } from '@/components/Fox';

export default function StoriesPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader active="learn" />
      <main className="mx-auto flex max-w-2xl flex-col items-center px-5 py-20 text-center">
        <Fox className="h-28 w-28" />
        <h1 className="mt-3 font-display text-3xl font-extrabold text-bark-800">Stories are coming</h1>
        <p className="mt-2 max-w-md text-sm font-semibold text-bark-500">
          Stories ship only with original, reviewed content. Nothing is generated or presented as
          correct until a native speaker signs off.
        </p>
        <Link href="/learn" className="btn-primary mt-6">
          Keep learning
        </Link>
      </main>
    </div>
  );
}
