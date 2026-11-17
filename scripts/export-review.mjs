#!/usr/bin/env node
/**
 * Generates the native-speaker review package from the built course bundle.
 *
 * Reads `content/dist/*.json` (the exact artifacts the app and tests verify),
 * emits a machine-readable JSON package and one CSV per locale under `review/`.
 * Nothing in the output is marked reviewed; every item is pre-filled with
 * `reviewStatus: "draft"` and empty decision fields that a reviewer fills in.
 *
 * Usage:
 *   node scripts/export-review.mjs [--out review]
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { LOCALE_LABEL } from '../packages/core/dist/index.js';

const root = resolve(process.cwd());
const outDir = resolve(root, process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : 'review');
const distDir = resolve(root, 'content/dist');
mkdirSync(outDir, { recursive: true });

const SCRIPT_LABEL = { en: 'Latin', hi: 'Devanagari', bn: 'Bengali', mr: 'Devanagari', te: 'Telugu', ta: 'Tamil', kn: 'Kannada', ml: 'Malayalam', gu: 'Gujarati', pa: 'Gurmukhi', or: 'Odia' };
const LOCALE_ENGLISH = { en: 'English', hi: 'Hindi', bn: 'Bengali', mr: 'Marathi', te: 'Telugu', ta: 'Tamil', kn: 'Kannada', ml: 'Malayalam', gu: 'Gujarati', pa: 'Punjabi', or: 'Odia' };

function guidebookTargets(exercise) {
  switch (exercise.kind) {
    case 'chooseMeaning':
    case 'listenChoose':
    case 'fillBlank': {
      const t = exercise.options?.[exercise.answerIndex];
      return t ? [t] : [];
    }
    case 'typeTranslation':
    case 'typeWhatYouHear':
    case 'speak':
      return exercise.expected?.length ? [exercise.expected[0]] : [];
    case 'wordBank':
    case 'arrangeSentence':
      return exercise.answer?.length ? [exercise.answer.join(' ')] : [];
    case 'matchPairs':
      return exercise.pairs?.map(([, t]) => t) ?? [];
    default:
      return [];
  }
}

const manifest = JSON.parse(readFileSync(join(distDir, 'manifest.json'), 'utf8'));
const files = readdirSync(distDir).filter((f) => f.endsWith('.json') && f !== 'manifest.json');

const items = [];
const stats = { perLocale: {}, totals: { courses: 0, units: 0, lessons: 0, exercises: 0 } };

for (const file of files.sort()) {
  const course = JSON.parse(readFileSync(join(distDir, file), 'utf8'));
  const locale = course.locale;
  const localeStats = (stats.perLocale[locale] ??= {
    label: LOCALE_LABEL[locale],
    script: SCRIPT_LABEL[locale],
    english: LOCALE_ENGLISH[locale],
    courses: 0,
    units: 0,
    lessons: 0,
    exercises: 0,
    byKind: {},
    reviewStatusCounts: {},
    withAudio: 0,
    withTransliteration: 0,
    emptyAudio: 0,
  });
  localeStats.courses += 1;
  stats.totals.courses += 1;

  for (const unit of course.units) {
    localeStats.units += 1;
    stats.totals.units += 1;
    for (const lesson of unit.lessons) {
      localeStats.lessons += 1;
      stats.totals.lessons += 1;
      for (const exercise of lesson.exercises) {
        stats.totals.exercises += 1;
        localeStats.exercises += 1;
        localeStats.byKind[exercise.kind] = (localeStats.byKind[exercise.kind] ?? 0) + 1;
        localeStats.reviewStatusCounts[exercise.reviewStatus] =
          (localeStats.reviewStatusCounts[exercise.reviewStatus] ?? 0) + 1;
        if (exercise.audioUrl) localeStats.withAudio += 1;
        else if ('audioUrl' in exercise) localeStats.emptyAudio += 1;
        if (exercise.transliteration) localeStats.withTransliteration += 1;
        items.push({
          exerciseId: exercise.id,
          locale,
          language: LOCALE_ENGLISH[locale],
          courseId: course.id,
          courseTitle: course.title,
          difficulty: course.difficulty,
          version: course.version,
          unitId: unit.id,
          unitTitle: unit.title,
          unitOrder: unit.order,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          lessonOrder: lesson.order,
          lessonXp: lesson.xpReward,
          kind: exercise.kind,
          prompt: exercise.prompt ?? null,
          sentence: exercise.sentence ?? null,
          options: exercise.options ?? null,
          answerIndex: exercise.answerIndex ?? null,
          expected: exercise.expected ?? null,
          pairs: exercise.pairs ?? null,
          answer: exercise.answer ?? null,
          target: guidebookTargets(exercise),
          transliteration: exercise.transliteration ?? null,
          audioUrl: exercise.audioUrl ?? null,
          vocabId: exercise.vocabId ?? null,
          courseReviewStatus: course.reviewStatus,
          unitReviewStatus: unit.reviewStatus,
          lessonReviewStatus: lesson.reviewStatus,
          exerciseReviewStatus: exercise.reviewStatus,
          // Filled in by the reviewer — never by tooling.
          reviewDecision: null,
          reviewNotes: null,
          reviewer: null,
        });
      }
    }
  }
}

const policy = {
  reviewStatus: 'draft',
  instruction:
    'Every item is draft. Do NOT assert review; fill reviewDecision (keep|revise|remove), reviewNotes, and reviewer per item. Then re-run export-review to build the reviewed manifest.',
  decisionValues: ['keep', 'revise', 'remove'],
  blockers: [
    'No course ships as reviewed until a native-speaker reviewer of that locale signs off.',
    'listenChoose exercises ship with an empty audioUrl; see the emptyAudio count per locale. A reviewer must either provide audio assets or mark those exercises for revision.',
    'hi-starter/pilot and all starters contain only draft content.',
  ],
};

const pkg = {
  packageVersion: 1,
  generatedAt: new Date().toISOString(),
  source: 'content/dist/*.json',
  manifestFile: 'content/dist/manifest.json',
  localeCount: Object.keys(stats.perLocale).length,
  stats,
  policy,
  items,
};

writeFileSync(join(outDir, 'review-package.json'), JSON.stringify(pkg, null, 2) + '\n');

const csvEscape = (value) => {
  const text = value == null ? '' : typeof value === 'string' ? value : JSON.stringify(value);
  return `"${text.replace(/"/g, '""')}"`;
};
const csvHeader = [
  'exerciseId',
  'locale',
  'courseId',
  'lessonId',
  'lessonTitle',
  'kind',
  'prompt',
  'sentence',
  'target',
  'options',
  'answerIndex',
  'expected',
  'pairs',
  'answer',
  'transliteration',
  'audioUrl',
  'vocabId',
  'reviewStatus',
  'reviewDecision',
  'reviewNotes',
  'reviewer',
].join(',');
const byLocale = new Map();
for (const item of items) {
  const rows = byLocale.get(item.locale) ?? [];
  rows.push(item);
  byLocale.set(item.locale, rows);
}
for (const [locale, rows] of byLocale) {
  const csv = [
    csvHeader,
    ...rows.map((item) =>
      [
        item.exerciseId,
        item.locale,
        item.courseId,
        item.lessonId,
        item.lessonTitle,
        item.kind,
        item.prompt,
        item.sentence,
        item.target,
        item.options,
        item.answerIndex,
        item.expected,
        item.pairs,
        item.answer,
        item.transliteration,
        item.audioUrl,
        item.vocabId,
        item.exerciseReviewStatus,
        '',
        '',
        '',
      ]
        .map(csvEscape)
        .join(','),
    ),
  ].join('\n');
  writeFileSync(join(outDir, `review-${locale}.csv`), csv + '\n');
}

const auditSummaryPath = join(outDir, 'audit-ledger.json');
let auditSummary = null;
try {
  auditSummary = JSON.parse(readFileSync(auditSummaryPath, 'utf8'));
} catch {
  // The audit may not have run yet; the section degrades gracefully.
}

const report = [
  '# Speeko — Native-speaker review package',
  '',
  `Generated: ${pkg.generatedAt}`,
  `Source: ${pkg.source}`,
  '',
  '## Inventory',
  '',
  `- Courses: ${stats.totals.courses} (10 starter + 1 pilot)`,
  `- Units: ${stats.totals.units}`,
  `- Lessons: ${stats.totals.lessons}`,
  `- Exercises: ${stats.totals.exercises} (all \`reviewStatus: draft\`)`,
  '',
  '| Locale | Label | Exercises | Kinds | With transliteration | Empty listenChoose audio |',
  '| --- | --- | --- | --- | --- | --- |',
  ...Object.entries(stats.perLocale).map(
    ([locale, s]) =>
      `| \`${locale}\` | ${s.english} (${s.label}) | ${s.exercises} | ${Object.entries(s.byKind)
        .map(([k, v]) => `${k} ${v}`)
        .join(', ')} | ${s.withTransliteration} | ${s.emptyAudio} |`,
  ),
  '',
  '## Automated audit evidence (AI-assisted)',
  '',
  'Source: `node scripts/audit-content.mjs` writes `audit-ledger.json` in this folder.',
  'This is an engineering quality gate, never native-speaker approval.',
  'Every item remains `reviewStatus: draft` until a signed-off human review happens.',
  'See `audit-pilot-hi.md` for the 20-item calibration pilot and its false-positive analysis.',
  '',
  auditSummary
    ? [
        '| Measurement | Value |',
        '| --- | --- |',
        `| Ledger items accounted for | ${auditSummary.items?.length ?? 0} / ${stats.totals.exercises} |`,
        `| Structural defects found (R-001..R-005) | ${['R-001', 'R-002', 'R-003', 'R-004', 'R-005'].reduce((n, r) => n + (auditSummary.summary?.byRule?.[r] ?? 0), 0)} |`,
        `| Items blocked on empty audioUrl (R-006) | ${auditSummary.summary?.byRule?.['R-006'] ?? 0} |`,
        `| Items flagged by low-confidence surface scan (R-010) | ${auditSummary.summary?.byRule?.['R-010'] ?? 0} |`,
        `| Items clean against deterministic rules | ${auditSummary.summary?.byDisposition?.no_issue_detected ?? 0} |`,
        '| Items native-speaker approved | **0** |',
      ].join('\n')
    : 'Audit ledger not found next to this file. Run `node scripts/audit-content.mjs` to generate it.',
  '',
  'Dispositions: `no_issue_detected` means only "no automated rule triggered".',
  'A native reviewer must still judge grammar, register, and meaning.',
  '',
  '## How to review',
  '',
  '1. Open the CSV for your locale (`review-<locale>.csv`) — one row per exercise, in path order.',
  '2. For each row, check: meaning accuracy, grammar, register/formality, script and transliteration, and (where provided) audio references.',
  '3. Fill `reviewDecision` = `keep` | `revise` | `remove`, plus `reviewNotes` and your name in `reviewer`. Leave blank anything you did not check.',
  '4. Return the CSV (or diff to it) to the project owner. Nobody else marks items reviewed.',
  '5. The owner applies decisions, flips the reviewed lessons to `reviewStatus: "reviewed"` with `reviewer: "<name>"`, and re-runs `pnpm sync:content`.',
  '',
  '## Status and limitations (unchanged)',
  '',
  '- **No content is reviewed.** Every row exists and must be treated as draft; nothing here certifies linguistic correctness.',
  '- **listenChoose has no audio assets.** All listening exercises ship an empty `audioUrl`; they currently render an honest "audio not available" fallback. Deciding on audio sources is a reviewer + owner question.',
  '- **Starter vocabulary direction is inconsistent.** Some courses show English prompts with target-language answers; hi-pilot shows target-language prompts with English gloss answers. Both are playable but a reviewer should pick one convention per locale and flag the other for revision.',
  '- **No item may be presented as reviewed** until a native speaker of that locale signs off. Automated validation (`pnpm sync:content`, content tests) grades answer-key reachability only; it does not judge language.',
];

writeFileSync(join(outDir, 'REVIEW.md'), report.join('\n'));
console.log(`Review package written to ${outDir}`);
console.log(`Items: ${items.length} across ${Object.keys(stats.perLocale).length} locales`);
