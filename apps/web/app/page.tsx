import Image from 'next/image';
import { ALL_LOCALES, LOCALE_LABEL, levelForXp } from '@speeko/core';

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center gap-4">
        <Image src="/fox.svg" alt="Speeko the fox" width={96} height={96} priority />
        <div>
          <h1 className="text-4xl font-bold text-speeko-600">Speeko</h1>
          <p className="mt-1 text-gray-600">Learn a new language, one lesson at a time.</p>
        </div>
      </div>
      <p className="mt-6 text-sm text-gray-500">Level 5 unlocks at {levelForXp(5)} XP.</p>
      <h2 className="mt-8 text-xl font-semibold">Supported languages</h2>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ALL_LOCALES.map((l) => (
          <li key={l} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
            {LOCALE_LABEL[l]} <span className="text-gray-400">({l})</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
