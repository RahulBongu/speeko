import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { z } from 'zod';
import {
  CourseSchema,
  validateCourse,
  type Course,
  type Locale,
  type Unit,
  type Lesson,
  type Exercise,
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

export { scaffoldCourse } from './scaffold.js';

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
  const checkReviewed = (scope: string, status: string, reviewer?: string) => {
    if (status === 'reviewed' && (!reviewer || reviewer.trim().length === 0)) {
      errors.push(`${scope}: reviewed content requires a reviewer`);
    }
  };
  checkReviewed('course', course.reviewStatus ?? 'draft', course.reviewer);
  for (const u of course.units) {
    if (ids.has(u.id)) errors.push(`duplicate unit id: ${u.id}`);
    ids.add(u.id);
    checkReviewed(`unit ${u.id}`, u.reviewStatus ?? 'draft', u.reviewer);
    for (const l of u.lessons) {
      if (ids.has(l.id)) errors.push(`duplicate lesson id: ${l.id}`);
      ids.add(l.id);
      checkReviewed(`lesson ${l.id}`, l.reviewStatus ?? 'draft', l.reviewer);
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
  // Start from a clean directory so courses deleted from `content/` do not
  // linger in the bundle or the web app's public folder.
  rmSync(outputDir, { recursive: true, force: true });
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
      reviewStatus: c.reviewStatus ?? 'draft',
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

// --- Importer ---------------------------------------------------------------
//
// Imports a normalized phrase list into a draft course. The input is expected
// to come from an open-licensed source (Tatoeba, etc.); the output is always
// marked reviewStatus "draft" and must not be presented as reviewed content.

export interface ImportedPhrase {
  english: string;
  target: string;
  transliteration?: string;
  vocabId?: string;
}

export interface ImportedCourseInput {
  locale: Locale;
  id: string;
  title: string;
  description?: string;
  difficulty?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  phrases: ImportedPhrase[];
}

export function importCourseFromPhrases(input: ImportedCourseInput): Course {
  const locale = input.locale;
  const id = input.id;
  const phrases = input.phrases.filter((phrase) => phrase.english.trim() && phrase.target.trim());
  const lessonsPerUnit = 5;
  const phrasesPerLesson = 3;
  const phrasesPerUnit = lessonsPerUnit * phrasesPerLesson;
  const units: Unit[] = [];

  for (let unitIndex = 0; unitIndex < Math.ceil(phrases.length / phrasesPerUnit); unitIndex += 1) {
    const unitPhrases = phrases.slice(unitIndex * phrasesPerUnit, (unitIndex + 1) * phrasesPerUnit);
    const lessons: Lesson[] = [];
    for (let lessonIndex = 0; lessonIndex < lessonsPerUnit; lessonIndex += 1) {
      const lessonPhrases = unitPhrases.slice(
        lessonIndex * phrasesPerLesson,
        (lessonIndex + 1) * phrasesPerLesson,
      );
      if (lessonPhrases.length === 0) break;
      const exercises: Exercise[] = [];
      for (let exerciseIndex = 0; exerciseIndex < lessonPhrases.length; exerciseIndex += 1) {
        const phrase = lessonPhrases[exerciseIndex]!;
        const vocabId = phrase.vocabId ?? `${locale}:${phrase.transliteration ?? phrase.target}`;
        const distractors = phrases
          .filter((candidate) => candidate.target !== phrase.target)
          .slice(0, 3)
          .map((candidate) => candidate.target);
        exercises.push({
          id: `${id}-u${unitIndex + 1}-l${lessonIndex + 1}-e${exerciseIndex + 1}`,
          kind: 'chooseMeaning',
          prompt: phrase.english,
          options: [phrase.target, ...distractors],
          answerIndex: 0,
          vocabId,
          transliteration: phrase.transliteration,
        });
        exercises.push({
          id: `${id}-u${unitIndex + 1}-l${lessonIndex + 1}-e${exerciseIndex + 2}`,
          kind: 'typeTranslation',
          prompt: `Type "${phrase.english.toLowerCase()}"`,
          expected: [phrase.target],
          acceptTypos: true,
          vocabId,
          transliteration: phrase.transliteration,
        });
      }
      lessons.push({
        id: `${id}-u${unitIndex + 1}-l${lessonIndex + 1}`,
        title: lessonPhrases.map((phrase) => phrase.english).join(', '),
        order: lessonIndex,
        difficulty: input.difficulty ?? 'A1',
        xpReward: 10,
        reviewStatus: 'draft',
        guidebook: `Draft lesson imported from open-licensed phrases.`,
        exercises,
      });
    }
    if (lessons.length === 0) break;
    units.push({
      id: `${id}-u${unitIndex + 1}`,
      title: `Unit ${unitIndex + 1}`,
      description: input.description ?? 'Imported draft unit.',
      order: unitIndex,
      crownLevel: 0,
      reviewStatus: 'draft',
      guidebook: input.description ?? 'Imported draft unit.',
      lessons,
    });
  }

  return {
    id,
    locale,
    sourceLocale: 'en',
    title: input.title,
    description: input.description ?? 'Imported draft course. Not reviewed by a native speaker.',
    difficulty: input.difficulty ?? 'A1',
    version: '0.1.0',
    reviewStatus: 'draft',
    units,
  };
}
