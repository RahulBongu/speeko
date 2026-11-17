#!/usr/bin/env node
/**
 * Speeko internal AI-assisted audit.
 *
 * READ FIRST: This is an engineering quality gate, NOT native-speaker
 * certification. It executes deterministic rules (schema bounds, duplicates,
 * Unicode hygiene, audio asset presence) and flags a small set of
 * surface-level linguistic observations with explicit confidence labels.
 * It NEVER marks content reviewed, correct, or safe to publish.
 *
 * Output: review/audit-ledger.json
 *
 * Usage:
 *   node scripts/audit-content.mjs [--out review]
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
const APPROVED_NONEMPTY_AUDIO = /^https?:\/\/\S+$/;

const manifest = JSON.parse(readFileSync(join(distDir, 'manifest.json'), 'utf8'));
const files = readdirSync(distDir).filter((f) => f.endsWith('.json') && f !== 'manifest.json');

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

function textFields(exercise) {
  const fields = [
    ['prompt', exercise.prompt],
    ['sentence', exercise.sentence],
    ['transliteration', exercise.transliteration],
    ...(exercise.expected ?? []).map((v, i) => [`expected[${i}]`, v]),
    ...(exercise.options ?? []).map((v, i) => [`options[${i}]`, v]),
    ...(exercise.pairs ?? []).flatMap(([a, b]) => [
      [`pair-source`, a],
      [`pair-target`, b],
    ]),
    ...(exercise.answer ?? []).map((v, i) => [`answer[${i}]`, v]),
  ];
  return fields.filter(([, v]) => typeof v === 'string' && v.length > 0);
}

function ruleR001AnswerIndexBounds(exercise) {
  if (!('answerIndex' in exercise) || !Array.isArray(exercise.options)) return [];
  const i = exercise.answerIndex;
  if (!Number.isInteger(i) || i < 0 || i >= exercise.options.length) {
    return [
      {
        category: 'structural',
        rule: 'R-001',
        check: 'answerIndex bounds',
        disposition: 'proposed_correction',
        confidence: 'high',
        deterministic: true,
        evidence: `answerIndex ${i} out of bounds for ${exercise.options.length} options`,
      },
    ];
  }
  return [];
}

function ruleR002DuplicateOptions(exercise) {
  if (!Array.isArray(exercise.options)) return [];
  const dupes = exercise.options.filter((o, i) => exercise.options.indexOf(o) !== i);
  return dupes.length ? [
    {
      category: 'exercise-correctness',
      rule: 'R-002',
      check: 'duplicate answer options',
      disposition: 'proposed_correction',
      confidence: 'high',
      deterministic: true,
      evidence: `duplicate option strings: ${[...new Set(dupes)].join(' | ')}`,
    },
  ] : [];
}

function ruleR003DuplicateExpected(exercise) {
  if (!Array.isArray(exercise.expected)) return [];
  const seen = new Set();
  const dupes = [];
  for (const v of exercise.expected) { if (seen.has(v)) dupes.push(v); seen.add(v); }
  return dupes.length ? [
    {
      category: 'exercise-correctness',
      rule: 'R-003',
      check: 'duplicate expected entries',
      disposition: 'proposed_correction',
      confidence: 'high',
      deterministic: true,
      evidence: `duplicate expected entries: ${[...new Set(dupes)].join(' | ')}`,
    },
  ] : [];
}

function ruleR004Normalization(exercise, where) {
  const findings = [];
  for (const [field, value] of textFields(exercise)) {
    if (value !== value.normalize('NFC')) {
      findings.push({
        category: 'structural',
        rule: 'R-004',
        check: 'Unicode NFC normalization',
        disposition: 'proposed_correction',
        confidence: 'high',
        deterministic: true,
        evidence: `non-NFC text in ${field}: ${value}`,
      });
    }
    for (const ch of value) {
      const cp = ch.codePointAt(0);
      const invisible = (cp <= 0x1f && cp !== 0x09 && cp !== 0x0a && cp !== 0x0d) || (cp >= 0x7f && cp <= 0x9f) || cp === 0x00a0 || cp === 0x200b || cp === 0x200c || cp === 0x200d || cp === 0x202a || cp === 0x202e || cp === 0xfeff;
      if (invisible) {
        findings.push({
          category: 'structural',
          rule: 'R-005',
          check: 'invisible/control characters',
          disposition: 'proposed_correction',
          confidence: 'high',
          deterministic: true,
          evidence: `U+${cp.toString(16)} in ${field}`,
        });
      }
    }
  }
  return findings;
}

function ruleR006ListenChooseAudio(exercise) {
  if (exercise.kind !== 'listenChoose') return [];
  const audio = exercise.audioUrl ?? '';
  if (audio.length === 0) {
    return [{
      category: 'audio',
      rule: 'R-006',
      check: 'listenChoose audioUrl',
      disposition: 'blocked',
      confidence: 'high',
      deterministic: true,
      evidence: 'audioUrl is empty: no licensed recording exists; the client renders the explicit no-audio fallback',
      proposedCorrection: null,
      reason: 'No licensed audio recorded yet. The item can only certify listening once audio exists.',
    }];
  }
  if (!APPROVED_NONEMPTY_AUDIO.test(audio)) {
    return [{
      category: 'audio',
      rule: 'R-007',
      check: 'listenChoose audioUrl format',
      disposition: 'proposed_correction',
      confidence: 'high',
      deterministic: true,
      evidence: `audioUrl is not a valid http(s) URL: ${audio}`,
    }];
  }
  return [];
}

function ruleR008ScriptConsistency(exercise, locale) {
  const re = SCRIPT[locale];
  if (!re) return [];
  const productionKinds = new Set(['typeTranslation', 'typeWhatYouHear', 'speak', 'wordBank', 'arrangeSentence', 'matchPairs', 'listenChoose', 'fillBlank']);
  if (!productionKinds.has(exercise.kind)) return [];
  const targets = guidebookTargets(exercise);
  return targets
    .filter((target) => target && !re.test(target))
    .map((target) => ({
      category: 'language-pedagogy',
      rule: 'R-008',
      check: 'target text missing locale script',
      disposition: 'needs_further_review',
      confidence: 'medium',
      deterministic: true,
      evidence: `production target "${target}" contains no ${locale} script code points`,
    }));
}

// Cross-course surface inconsistency: identical English prompt answered with
// two different target spellings across courses of the same locale.
function collectSpellings(items) {
  const byLocalePrompt = new Map();
  for (const item of items) {
    const key = `${item.locale}:${item.prompt}`;
    const rows = byLocalePrompt.get(key) ?? [];
    rows.push(item);
    byLocalePrompt.set(key, rows);
  }
  return byLocalePrompt;
}

export { collectSpellings };

const items = [];
const stats = { perLocale: {}, totals: { courses: files.length, exercises: 0 } };

for (const file of files.sort()) {
  const course = JSON.parse(readFileSync(join(distDir, file), 'utf8'));
  for (const unit of course.units) {
    for (const lesson of unit.lessons) {
      for (const exercise of lesson.exercises) {
        stats.totals.exercises += 1;
        const localeStats = (stats.perLocale[course.locale] ??= { total: 0, byKind: {}, blockedAudio: 0 });
        localeStats.total += 1;
        localeStats.byKind[exercise.kind] = (localeStats.byKind[exercise.kind] ?? 0) + 1;
        if (exercise.kind === 'listenChoose') localeStats.blockedAudio += 1;

        const findings = [
          ...ruleR001AnswerIndexBounds(exercise),
          ...ruleR002DuplicateOptions(exercise),
          ...ruleR003DuplicateExpected(exercise),
          ...ruleR004Normalization(exercise),
          ...ruleR006ListenChooseAudio(exercise),
          ...ruleR008ScriptConsistency(exercise, course.locale),
        ];
        const disposition = findings.some((f) => f.disposition === 'blocked')
          ? 'blocked'
          : findings.some((f) => f.disposition === 'proposed_correction')
            ? 'proposed_correction'
            : findings.some((f) => f.disposition === 'needs_further_review')
              ? 'needs_further_review'
              : 'no_issue_detected';
        items.push({
          exerciseId: exercise.id,
          locale: course.locale,
          language: LOCALE_ENGLISH[course.locale] ?? course.locale,
          courseId: course.id,
          kind: exercise.kind,
          prompt: exercise.prompt ?? null,
          originalText: textFields(exercise).map(([field, value]) => ({ field, value })),
          originalExpected: exercise.expected ?? null,
          originalTarget: guidebookTargets(exercise),
          contentHash: contentHash(course, unit, lesson, exercise),
          unitId: unit.id,
          lessonId: lesson.id,
          findings,
          disposition,
          // Always distinct from human approval. Never used to claim review.
          humanStatus: 'unreviewed',
          deterministicRulesChecked: ['R-001', 'R-002', 'R-003', 'R-004', 'R-005', 'R-006', 'R-007', 'R-008'],
          linguisticReviewStatus: findings.some((f) => f.deterministic === false) ? 'flagged' : 'not_verified_by_human',
        });
      }
    }
  }
}

// Cross-course surface-spelling inconsistency within a locale (hi-pilot vs hi-starter etc.).
const spellings = collectSpellings(items);
for (const [key, rows] of spellings) {
  const [locale] = key.split(':');
  const targets = new Set(rows.flatMap((r) => r.originalTarget));
  const courses = new Set(rows.map((r) => r.courseId));
  if (courses.size > 1 && targets.size > 1) {
    const target = [...targets];
    for (const row of rows) {
      row.findings.push({
        category: 'language-pedagogy',
        rule: 'R-010',
        check: 'same prompt taught with different target spellings across courses of this locale',
        disposition: 'needs_further_review',
        confidence: 'low',
        deterministic: false,
        evidence: `prompt "${row.prompt}" spelled as: ${target.join(' | ')}`,
      });
      if (row.disposition === 'no_issue_detected') row.disposition = 'needs_further_review';
      else if (row.disposition === 'proposed_correction') row.disposition = 'proposed_correction';
    }
  }
}

const summary = { byDisposition: {}, byRule: {}, deterministicClean: 0, blocked: 0, findingsTotal: 0 };
for (const item of items) {
  summary.byDisposition[item.disposition] = (summary.byDisposition[item.disposition] ?? 0) + 1;
  if (item.disposition === 'blocked') summary.blocked += 1;
  if (item.findings.length === 0) summary.deterministicClean += 1;
  for (const f of item.findings) {
    summary.byRule[f.rule] = (summary.byRule[f.rule] ?? 0) + 1;
    summary.findingsTotal += 1;
  }
}

const ledger = {
  ledgerVersion: 1,
  generatedAt: new Date().toISOString(),
  source: 'content/dist/*.json',
  disclaimer:
    'Automated and AI-assisted internal audit only. No item in this ledger is native-speaker reviewed, approved, verified, or certified. Absent humanStatus changes made by a qualified reviewer, every item remains reviewStatus: draft.',
  rules: [
    'R-001 answerIndex within the options array (deterministic)',
    'R-002 duplicate option strings (deterministic)',
    'R-003 duplicate expected entries (deterministic)',
    'R-004 Unicode NFC normalization (deterministic)',
    'R-005 invisible/control characters in text fields (deterministic)',
    'R-006 listenChoose has an empty audioUrl -> blocked pending licensed audio (deterministic)',
    'R-007 listenChoose audioUrl is non-empty but malformed elsewhere (deterministic, currently zero)',
    'R-008 production-kind targets missing locale script code points (deterministic, locale-aware)',
    'R-010 same prompt spelled with different target forms across courses of one locale (AI-assisted, low confidence, needs human judgment)',
  ],
  stats,
  summary,
  items,
};

writeFileSync(join(outDir, 'audit-ledger.json'), JSON.stringify(ledger, null, 2) + '\n');

console.log(`Audit ledger written to ${join(outDir, 'audit-ledger.json')}`);
console.log(`Items: ${items.length}`);
console.log(`Blocked (no licensed audio): ${summary.blocked}`);
console.log(`Dispositions:`, summary.byDisposition);
console.log(`Rules hit:`, summary.byRule);
