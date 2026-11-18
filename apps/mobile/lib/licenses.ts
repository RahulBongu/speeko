import raw from '../assets/licenses/licenses.json';

export interface LicenseDocument {
  id: 'license' | 'content' | 'notice' | 'fonts';
  title: string;
  filename: string;
  text: string;
}

/**
 * The texts are generated from the repository files by
 * `scripts/sync-licenses.mjs` and committed so Metro can bundle them.
 * `pnpm check:licenses` fails if the bundle drifts from the sources.
 */
export const LICENSE_DOCUMENTS: LicenseDocument[] = [
  {
    id: 'license',
    title: 'Apache License 2.0 — source code',
    filename: 'LICENSE',
    text: raw.license,
  },
  {
    id: 'content',
    title: 'Content and brand license',
    filename: 'LICENSE-CONTENT',
    text: raw.content,
  },
  {
    id: 'notice',
    title: 'NOTICE — third-party attributions',
    filename: 'NOTICE',
    text: raw.notice,
  },
  {
    id: 'fonts',
    title: 'Fonts — SIL Open Font License 1.1',
    filename: 'OFL.txt',
    text: raw.fonts,
  },
];

export const LICENSE_SUMMARY =
  'Speeko’s source code is licensed under the Apache License 2.0. Course content, ' +
  'the fox mascot, the name and wordmark, design, and documentation are All Rights ' +
  'Reserved. Baloo 2 and Nunito are bundled under the SIL Open Font License 1.1.';
