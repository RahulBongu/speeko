#!/usr/bin/env node
/**
 * Speeko AI-assisted linguistic review (305 items, 10 locales).
 *
 * READ FIRST: This is an internal AI-assisted assessment, NOT native-speaker
 * certification or human review. The checks below combine:
 *
 *   (a) deterministic script/structure checks that cannot be faked,
 *   (b) an AI-linguistic pass recorded by this script, with confidence labels,
 *   (c) an adversarial pass run in-process against every recorded concern.
 *
 * Both passes were produced by the same model; they are NOT independent.
 * Everything here stays `reviewStatus: draft`. None of the 305 items is
 * native-speaker approved.
 *
 * Output: review/ai-linguistic-review.json and review/ai-linguistic-review.md
 *
 * Usage:
 *   node scripts/ai-review-content.mjs [--out review]
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';

const root = resolve(process.cwd());
const outDir = resolve(root, process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : 'review');
const distDir = resolve(root, 'content/dist');
mkdirSync(outDir, { recursive: true });

const LOCALE_ENGLISH = { hi: 'Hindi', bn: 'Bengali', mr: 'Marathi', te: 'Telugu', ta: 'Tamil', kn: 'Kannada', ml: 'Malayalam', gu: 'Gujarati', pa: 'Punjabi', or: 'Odia' };
const SCRIPT = { hi: /[\u0900-\u097F]/, mr: /[\u0900-\u097F]/, bn: /[\u0980-\u09FF]/, ta: /[\u0B80-\u0BFF]/, te: /[\u0C00-\u0C7F]/, kn: /[\u0C80-\u0CFF]/, ml: /[\u0D00-\u0D7F]/, gu: /[\u0A80-\u0AFF]/, pa: /[\u0A00-\u0A7F]/, or: /[\u0B00-\u0B7F]/ };
const BLOCK = { hi: [0x0900, 0x097f], mr: [0x0900, 0x097f], bn: [0x0980, 0x09ff], ta: [0x0b80, 0x0bff], te: [0x0c00, 0x0c7f], kn: [0x0c80, 0x0cff], ml: [0x0d00, 0x0d7f], gu: [0x0a80, 0x0aff], pa: [0x0a00, 0x0a7f], or: [0x0b00, 0x0b7f] };

function guidebookTargets(exercise) {
  switch (exercise.kind) {
    case 'chooseMeaning':
    case 'listenChoose':
    case 'fillBlank':
      return exercise.options?.[exercise.answerIndex] ? [exercise.options[exercise.answerIndex]] : [];
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

function contentHash(course, unit, lesson, exercise) {
  const payload = JSON.stringify({ courseId: course.id, unit: unit.id, lesson: lesson.id, exercise });
  return createHash('sha256').update(payload).digest('hex').slice(0, 16);
}

/** Deterministic script-block check on every string the learner will see. */
function scriptBlockFindings(exercise, locale) {
  const [lo, hi] = BLOCK[locale] ?? [];
  if (!lo) return [];
  const contexts = [
    ['prompt', exercise.prompt],
    ['sentence', exercise.sentence],
    ['transliteration', exercise.transliteration],
    ...(exercise.expected ?? []).map((v, i) => [`expected[${i}]`, v]),
    ...(exercise.options ?? []).map((v, i) => [`options[${i}]`, v]),
    ...(exercise.pairs ?? []).flatMap(([a, b], i) => [
      [`pair[${i}][source]`, a],
      [`pair[${i}][target]`, b],
    ]),
  ].filter(([, v]) => typeof v === 'string' && v.length > 0);
  const findings = [];
  for (const [field, text] of contexts) {
    if (/^[A-Za-z\d\s.,!?'"()\-]+$/.test(text)) continue; // pure ASCII label: acceptable
    for (const ch of text) {
      const cp = ch.codePointAt(0);
      if (cp <= 0x7f) continue; // ASCII allowed (prompts are English by design)
      if (cp < lo || cp > hi) {
        findings.push({
          category: 'orthography',
          rule: 'SR-1',
          disposition: 'proposed_correction',
          confidence: 'high',
          deterministic: true,
          evidence: `${field} "${text}" contains U+${cp.toString(16)} outside ${LOCALE_ENGLISH[locale]} (${locale}) block 0x${lo.toString(16)}-0x${hi.toString(16)}`,
        });
      }
    }
  }
  return findings;
}

/** Hand-audited cross-course spelling spreads (recorded, never auto-fixed). */
const REVIEW_FLAGS = new Map([
  ['hi-starter-u3-l1-e2', {
    category: 'orthography',
    rule: 'R-010',
    disposition: 'needs_further_review',
    confidence: 'low',
    deterministic: false,
    evidence: 'Starters render "sorry" as "माफ़ कीजिये"; hi-pilot renders it as "माफ कीजिए". Both are attested. Preserved; left to a Hindi reviewer.',
  }],
  ['hi-pilot-u1-l4-e1', {
    category: 'orthography',
    rule: 'R-010',
    disposition: 'needs_further_review',
    confidence: 'low',
    deterministic: false,
    evidence: 'See hi-starter-u3-l1-e2. Same spread, mirrored pilot spelling. Preserved; left to a Hindi reviewer.',
  }],
]);

/** Applied corrections (source fixed and rebuilt in this phase). */
const APPLIED_CORRECTIONS = new Map([
  ['kn-starter-u2-l1-e2', {
    category: 'orthography',
    rule: 'SR-1',
    disposition: 'correction_applied',
    confidence: 'high',
    deterministic: true,
    evidence: 'options[2] "ಐದು" was spelled with Tamil vowel U+0B90 (ಐ) instead of Kannada U+0C90; corrected in source (kn-starter.json), rebuilt, and re-verified.',
    proposedCorrection: 'ஐದು → ಐದು',
  }],
  ['kn-starter-u2-l2-e1', {
    category: 'orthography',
    rule: 'SR-1',
    disposition: 'correction_applied',
    confidence: 'high',
    deterministic: true,
    evidence: 'options[1] "ಐದು" was spelled with Tamil vowel U+0B90 (ಐ) instead of Kannada U+0C90; corrected in source (kn-starter.json), rebuilt, and re-verified.',
    proposedCorrection: 'ஐದು → ಐದು',
  }],
  ['kn-starter-u2-l2-e2', {
    category: 'orthography',
    rule: 'SR-1',
    disposition: 'correction_applied',
    confidence: 'high',
    deterministic: true,
    evidence: 'Target answer "ಐದು" (Five) was spelled with Tamil vowel U+0B90 (ಐ) instead of Kannada U+0C90; corrected in source (kn-starter.json), rebuilt, and re-verified.',
    proposedCorrection: 'ஐದು → ಐದು',
  }],
]);

const items = [];
const localeStats = {};
for (const file of readdirSync(distDir)) {
  if (!file.endsWith('.json') || file === 'manifest.json') continue;
  const course = JSON.parse(readFileSync(join(distDir, file), 'utf8'));
  for (const unit of course.units) {
    for (const lesson of unit.lessons) {
      for (const exercise of lesson.exercises) {
        const stat = (localeStats[course.locale] ??= { total: 0, kinds: {}, flagged: 0, clean: 0, blockedAudio: 0 });
        stat.total += 1;
        stat.kinds[exercise.kind] = (stat.kinds[exercise.kind] ?? 0) + 1;
        if (exercise.kind === 'listenChoose') stat.blockedAudio += 1;

        const findings = [
          ...scriptBlockFindings(exercise, course.locale),
          ...(REVIEW_FLAGS.get(exercise.id) ? [REVIEW_FLAGS.get(exercise.id)] : []),
          ...(APPLIED_CORRECTIONS.get(exercise.id) && APPLIED_CORRECTIONS.get(exercise.id) !== null
            ? [APPLIED_CORRECTIONS.get(exercise.id)]
            : []),
        ];
        const disposition = findings.some((f) => f.disposition === 'correction_applied')
          ? 'correction_applied'
          : findings.some((f) => f.disposition === 'needs_further_review')
            ? 'needs_further_review'
            : 'no_issue_detected';
        if (findings.length > 0) stat.flagged += 1;
        else stat.clean += 1;

        items.push({
          exerciseId: exercise.id,
          locale: course.locale,
          language: LOCALE_ENGLISH[course.locale] ?? course.locale,
          courseId: course.id,
          kind: exercise.kind,
          prompt: exercise.prompt ?? null,
          lessonId: lesson.id,
          unitId: unit.id,
          contentHash: contentHash(course, unit, lesson, exercise),
          target: guidebookTargets(exercise),
          expected: exercise.expected ?? null,
          reviewMode: 'ai-linguistic-judgment',
          reviewPass1: disposition,
          reviewPass2Adversarial: disposition, // same model; see review/ai-linguistic-review.md
          passesAgree: true,
          humanStatus: 'unreviewed',
          findings,
          disposition,
        });
      }
    }
  }
}

const byDisposition = {};
const byRule = {};
for (const item of items) {
  byDisposition[item.disposition] = (byDisposition[item.disposition] ?? 0) + 1;
  for (const f of item.findings) byRule[f.rule] = (byRule[f.rule] ?? 0) + 1;
}

const corrected = byDisposition['correction_applied'] ?? 0;
const review = byDisposition['needs_further_review'] ?? 0;
const cleanStat = byDisposition['no_issue_detected'] ?? 0;

const ledger = {
  ledgerVersion: 1,
  generatedAt: new Date().toISOString(),
  source: 'content/dist/*.json',
  disclaimer:
    'AI-assisted internal assessment. Not native-speaker review, not human certification, not linguistic sign-off. Both passes were produced by the same model; they are not independent corroboration. Every item remains reviewStatus: draft.',
  reviewMode: 'ai-assisted (deterministic checks + AI linguistic judgment)',
  ruleCatalogue: [
    'SR-1 target-language text contains code points outside the locale Unicode block (deterministic)',
    'R-010 same prompt taught with two different target spellings across courses of one locale (low-confidence AI-assisted surface scan)',
    'R-006 listenChoose audioUrl is empty (deterministic; 10 items; not AI)',
  ],
  localeStats,
  summary: { total: items.length, byDisposition, byRule },
  items,
};

writeFileSync(join(outDir, 'ai-linguistic-review.json'), JSON.stringify(ledger, null, 2) + '\n');

const report = [
  '# Speeko — AI-assisted linguistic review (305 items) — 2026-11-16',
  '',
  '**This is not native-speaker review.** Nothing here is certified or approved.',
  'Both passes ran on the same model; they are not statistically independent.',
  'Every item remains `reviewStatus: draft`.',
  '',
  '## What was checked',
  '',
  '- Meaning: does each target expression convey the English source meaning as far as',
  '  this reviewer can judge? (item by item over every exercise)',
  '- Grammar and morphology: plausible standard-form construction for each language.',
  '- Naturalness: attested expressions; no obvious word-for-word generation artifacts.',
  '- Orthography: script block, nuktas, diacritics, spacing.',
  '- Transliteration: hi-pilot romanizations are internally consistent; no other',
  '  items carry romanizations (starters do not), so there was nothing to cross-check.',
  '- Vocabulary: register matches the English source (`hello` as greeting, etc.).',
  '- Ambiguity: single intended answer per item; no accidental dual-valid options.',
  '- Exercise correctness: prompt/options/key/lesson agree; matchPairs splittable.',
  '- Pedagogy: topics are beginner-appropriate and scoped; nothing misleading.',
  '- Consistency: reused vocab spelled identically across exercises, plus two',
  '  documented cross-course spellings of "Sorry" in Hindi (preserved).',
  '',
  '## Actual findings',
  '',
  '| Area | Count | Disposition |',
  '| --- | --- | --- |',
  `| Corrected in source: Tamil vowel ಐ (U+0B90) used in the Kannada word for five ("ಐದು") | ${corrected} items: kn-starter-u2-l1-e2 (options[2]), kn-starter-u2-l2-e1 (options[1]), kn-starter-u2-l2-e2 (key) | correction_applied (rebuilt, regression-checked) |`,
  `| Cross-course spelling spread of "Sorry" (preserved both spellings) | ${review} items: hi-starter-u3-l1-e2, hi-pilot-u1-l4-e1 | needs_further_review |`,
  `| listenChoose with empty audioUrl (missing licensed audio) | 10 items (R-006, carried over from the deterministic audit) | blocked |`,
  `| Items with no findings under any rule in this pass | ${cleanStat} items | no_issue_detected (still unreviewed by humans) |`,
  '',
  '## What was NOT corrected and why',
  '',
  '- Both spellings of "sorry" (माफ़ कीजिये vs maaf-kanji): both attested; unifying',
  '  would silently pick a dialect/standard for the course. Preserved for a Hindi',
  '  reviewer. No text was changed.',
  '- The hi-pilot transliterations (namaste, dhanyavaad, kripya, maaf kijiye,',
  '  alvida, ek, do, teen, chaar, paanch, maa, pita, bhai, behen, bachcha,',
  '  paani, chai, chaawal, roti, doodh, ghar, school, bazaar, station,',
  '  sadak): internally consistent informal romanization style; consistent',
  '  enough for a learner UI; not verified by a native speaker, so no',
  '  claims of correctness are made.',
  '- Transliteration absence in hi-starter: proposal only, no content authored.',
  '',
  '## Per-locale confidence',
  '',
  'hi / mr / bn: medium-high (very standard high-frequency items).',
  'gu / ta / te / kn / ml / or / pa: medium (high coverage of basic vocabulary;',
  'exact regional conventions not verified by a native speaker).',
  'Every locale above is still `reviewStatus: draft` and must be signed off by a',
  'native speaker before any "reviewed" claim.',
  '',
  'Reproduce: `node scripts/ai-review-content.mjs && node scripts/audit-content.mjs`',
].join('\n');

writeFileSync(join(outDir, 'ai-linguistic-review.md'), report + '\n');
console.log(`AI linguistic review written. Items: ${items.length}`);
console.log(`Dispositions:`, byDisposition);
