import type { Metadata } from 'next';

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
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Licenses and attributions</h1>
      <p className="mt-4 text-sm leading-6 text-gray-700">
        Speeko&apos;s source code is licensed under the Apache License, Version 2.0.
        Course content, the fox mascot, the Speeko name and wordmark, the visual
        design, and the documentation are All Rights Reserved. The bundled fonts
        (Baloo 2 and Nunito) are licensed under the SIL Open Font License 1.1.
        The full texts are available below.
      </p>
      <ul className="mt-6 space-y-2 text-sm">
        {FILES.map((file) => (
          <li key={file.href}>
            <a className="text-blue-600 underline" href={file.href}>
              {file.label}
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm leading-6 text-gray-700">
        Runtime dependencies are installed from npm and remain under their own
        licenses; see the NOTICE file above. Third-party attributions are also
        recorded in <code>ATTRIBUTIONS.md</code> in the source repository.
      </p>
    </main>
  );
}