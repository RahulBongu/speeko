import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/AppHeader';

export const metadata: Metadata = {
  title: 'Licenses — Speeko',
  description: 'License texts and third-party attributions for the Speeko web app.',
};

const FILES = [
  { href: '/licenses/LICENSE', label: 'LICENSE — Apache License, Version 2.0 (source code)' },
  { href: '/licenses/LICENSE-CONTENT', label: 'LICENSE-CONTENT — All Rights Reserved (content, brand, design, docs)' },
  { href: '/licenses/NOTICE', label: 'NOTICE — copyright and third-party attribution' },
  { href: '/licenses/OFL.txt', label: 'OFL.txt — SIL Open Font License 1.1 (Baloo 2, Nunito)' },
];

export default function LicensesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader active="account" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <Link
          href="/account"
          className="focus-ring inline-flex items-center gap-1 rounded-lg px-1 py-0.5 text-sm font-bold text-bark-500 transition hover:text-bark-800"
        >
          ← Back to account
        </Link>
        <div className="card mt-4 p-6 sm:p-8">
          <p className="eyebrow">Open source &amp; content</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-bark-800">
            Licenses and attributions
          </h1>
          <p className="mt-4 text-sm font-semibold leading-6 text-bark-600">
            Speeko&apos;s source code is licensed under the Apache License, Version 2.0.
            Course content, the fox mascot, the Speeko name and wordmark, the visual
            design, and the documentation are All Rights Reserved. The bundled fonts
            (Baloo 2 and Nunito) are licensed under the SIL Open Font License 1.1.
            The full texts are available below.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm">
            {FILES.map((file) => (
              <li key={file.href}>
                <a
                  className="focus-ring inline-flex items-center rounded-xl border-2 border-cream-200 bg-cream-50 px-3.5 py-2.5 font-display font-bold text-speeko-700 transition hover:border-speeko-300 hover:bg-speeko-50"
                  href={file.href}
                >
                  {file.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm font-semibold leading-6 text-bark-500">
            Runtime dependencies are installed from npm and remain under their own
            licenses; see the NOTICE file above. Third-party attributions are also
            recorded in <code className="rounded bg-cream-100 px-1.5 py-0.5 text-xs font-bold text-bark-700">ATTRIBUTIONS.md</code> in the source repository.
          </p>
        </div>
      </main>
    </div>
  );
}