import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { z } from 'zod';
import {
  CourseSchema,
  validateCourse,
  type Course,
  type Locale,
  ALL_LOCALES,
  LOCALE_LABEL,
} from '@speeko/core';

export { CourseSchema, validateCourse, ALL_LOCALES, LOCALE_LABEL };
export type { Course, Locale };

export interface ValidationResult {
  file: string;
  ok: boolean;
  errors: string[];
}

export function validateCourseFile(filePath: string): ValidationResult {
  const errors: string[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (e) {
    return { file: filePath, ok: false, errors: [`JSON parse error: ${(e as Error).message}`] };
  }
  const res = CourseSchema.safeParse(parsed);
  if (!res.success) {
    for (const issue of res.error.issues) {
      errors.push(`${issue.path.join('.') || '(root)'}: ${issue.message}`);
    }
    return { file: filePath, ok: false, errors };
  }
  // Cross-check: locale must be a supported locale (already enforced by enum).
  // Check unique ids within course.
  const course = res.data;
  const ids = new Set<string>();
  for (const u of course.units) {
    if (ids.has(u.id)) errors.push(`duplicate unit id: ${u.id}`);
    ids.add(u.id);
    for (const l of u.lessons) {
      if (ids.has(l.id)) errors.push(`duplicate lesson id: ${l.id}`);
      ids.add(l.id);
      for (const e of l.exercises) {
        if (ids.has(e.id)) errors.push(`duplicate exercise id: ${e.id}`);
        ids.add(e.id);
      }
    }
  }
  return { file: filePath, ok: errors.length === 0, errors };
}

export function validateDirectory(dir: string): ValidationResult[] {
  const results: ValidationResult[] = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.') || entry.name === 'dist') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...validateDirectory(full));
    else if (entry.name.endsWith('.json')) results.push(validateCourseFile(full));
  }
  return results;
}

export interface BuildResult {
  courses: number;
  outputDir: string;
  files: string[];
}

export function buildCourses(inputDir: string, outputDir: string): BuildResult {
  mkdirSync(outputDir, { recursive: true });
  const results = validateDirectory(inputDir);
  const failures = results.filter((r) => !r.ok);
  if (failures.length > 0) {
    const msg = failures.map((f) => `${f.file}:\n  ${f.errors.join('\n  ')}`).join('\n');
    throw new Error(`Content validation failed:\n${msg}`);
  }
  const files: string[] = [];
  let count = 0;
  for (const r of results) {
    const course = JSON.parse(readFileSync(r.file, 'utf8')) as Course;
    const outName = `${course.id}.json`;
    const outPath = join(outputDir, outName);
    writeFileSync(outPath, JSON.stringify(course, null, 2));
    files.push(outPath);
    count++;
  }
  // Write an index manifest.
  const manifest = results.map((r) => {
    const c = JSON.parse(readFileSync(r.file, 'utf8')) as Course;
    return {
      id: c.id,
      locale: c.locale,
      title: c.title,
      difficulty: c.difficulty,
      units: c.units.length,
      lessons: c.units.reduce((n, u) => n + u.lessons.length, 0),
      exercises: c.units.reduce((n, u) => n + u.lessons.reduce((m, l) => m + l.exercises.length, 0), 0),
      file: `${c.id}.json`,
    };
  });
  writeFileSync(join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  files.push(join(outputDir, 'manifest.json'));
  return { courses: count, outputDir, files };
}

// --- Audio manifest ---------------------------------------------------------

export interface AudioEntry {
  locale: string;
  text: string;
  file: string;
}

export function collectAudioEntries(inputDir: string): AudioEntry[] {
  const results = validateDirectory(inputDir);
  const entries: AudioEntry[] = [];
  const seen = new Set<string>();
  for (const r of results) {
    if (!r.ok) continue;
    const course = JSON.parse(readFileSync(r.file, 'utf8')) as Course;
    for (const u of course.units) {
      for (const l of u.lessons) {
        for (const e of l.exercises) {
          const candidates = [e.prompt, ...(e.kind === 'chooseMeaning' || e.kind === 'listenChoose' || e.kind === 'chooseImage' ? e.options : [])];
          for (const t of candidates) {
            if (!t) continue;
            const key = `${course.locale}::${t}`;
            if (seen.has(key)) continue;
            seen.add(key);
            const slug = t
              .toLowerCase()
              .replace(/[^a-z0-9\u0900-\u097f\u0980-\u09ff\u0a00-\u0a7f\u0a80-\u0aff\u0b00-\u0b7f\u0b80-\u0bff\u0c00-\u0c7f\u0c80-\u0cff\u0d00-\u0d7f]+/g, '-')
              .slice(0, 40);
            entries.push({ locale: course.locale, text: t, file: `${course.locale}/${slug}.mp3` });
          }
        }
      }
    }
  }
  return entries;
}

// --- Scaffold ---------------------------------------------------------------

export function scaffoldCourse(locale: Locale, id: string): Course {
  const label = LOCALE_LABEL[locale];
  return {
    id,
    locale,
    sourceLocale: 'en',
    title: `${label} — Starter Course`,
    description: `Starter course for ${label}. Tier 1 (units 1-2).`,
    difficulty: 'A1',
    version: '1.0.0',
    units: [
      {
        id: `${id}-u1`,
        title: 'Basics 1',
        description: 'Greetings and essentials',
        order: 0,
        crownLevel: 0,
        lessons: [
          {
            id: `${id}-u1-l1`,
            title: 'Hello & Goodbye',
            order: 0,
            difficulty: 'A1',
            xpReward: 10,
            exercises: [
              {
                id: `${id}-u1-l1-e1`,
                kind: 'chooseMeaning',
                prompt: 'Hello',
                options: ['नमस्ते', 'अलविदा', 'धन्यवाद', 'कृपया'],
                answerIndex: 0,
              },
              {
                id: `${id}-u1-l1-e2`,
                kind: 'chooseMeaning',
                prompt: 'Thank you',
                options: ['धन्यवाद', 'नमस्ते', 'माफ़ कीजिये', 'हाँ'],
                answerIndex: 0,
              },
              {
                id: `${id}-u1-l1-e3`,
                kind: 'typeTranslation',
                prompt: 'Type "hello" in the target language',
                expected: ['नमस्ते'],
              },
            ],
          },
          {
            id: `${id}-u1-l2`,
            title: 'Yes & No',
            order: 1,
            difficulty: 'A1',
            xpReward: 10,
            exercises: [
              {
                id: `${id}-u1-l2-e1`,
                kind: 'chooseMeaning',
                prompt: 'Yes',
                options: ['हाँ', 'नहीं', 'शायद', 'ठीक है'],
                answerIndex: 0,
              },
              {
                id: `${id}-u1-l2-e2`,
                kind: 'chooseMeaning',
                prompt: 'No',
                options: ['नहीं', 'हाँ', 'ठीक है', 'अच्छा'],
                answerIndex: 0,
              },
              {
                id: `${id}-u1-l2-e3`,
                kind: 'matchPairs',
                prompt: 'Match the pairs',
                pairs: [
                  ['Yes', 'हाँ'],
                  ['No', 'नहीं'],
                ],
              },
            ],
          },
        ],
      },
      {
        id: `${id}-u2`,
        title: 'Basics 2',
        description: 'Numbers and people',
        order: 1,
        crownLevel: 0,
        lessons: [
          {
            id: `${id}-u2-l1`,
            title: 'Numbers 1-5',
            order: 0,
            difficulty: 'A1',
            xpReward: 10,
            exercises: [
              {
                id: `${id}-u2-l1-e1`,
                kind: 'chooseMeaning',
                prompt: 'One',
                options: ['एक', 'दो', 'तीन', 'चार'],
                answerIndex: 0,
              },
              {
                id: `${id}-u2-l1-e2`,
                kind: 'chooseMeaning',
                prompt: 'Two',
                options: ['दो', 'एक', 'पाँच', 'छह'],
                answerIndex: 0,
              },
              {
                id: `${id}-u2-l1-e3`,
                kind: 'fillBlank',
                prompt: 'Fill in the blank',
                sentence: 'I have ___ apple.',
                options: ['one', 'two', 'three'],
                answerIndex: 0,
              },
            ],
          },
        ],
      },
    ],
  } as Course;
}
