import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CourseSchema, type Course, type Lesson } from '@speeko/core';

const here = dirname(fileURLToPath(import.meta.url));
const cache = new Map<string, Course>();

/**
 * Places the authoritative course JSON may live, in priority order. Local dev
 * and `pnpm start` run from the repo root; a packaged API can point
 * `CONTENT_DIR` at a mounted content folder.
 */
export function contentRoots(): string[] {
  const candidates = [
    process.env.CONTENT_DIR,
    resolve(process.cwd(), 'content'),
    resolve(process.cwd(), '../../content'),
    resolve(here, '../../../content'),
  ];
  return [...new Set(candidates.filter((value): value is string => Boolean(value)))];
}

function findCourseFile(courseId: string): string | null {
  for (const root of contentRoots()) {
    if (!existsSync(root)) continue;

    const flat = join(root, `${courseId}.json`);
    if (existsSync(flat)) return flat;

    for (const entry of readdirSync(root, { withFileTypes: true })) {
      if (
        !entry.isDirectory() ||
        entry.name.startsWith('_') ||
        entry.name.startsWith('.') ||
        entry.name === 'dist'
      ) {
        continue;
      }
      const nested = join(root, entry.name, `${courseId}.json`);
      if (existsSync(nested)) return nested;
    }
  }
  return null;
}

/** Loads and validates a course from the tracked content sources. */
export function loadCourse(courseId: string): Course | null {
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(courseId)) return null;
  const cached = cache.get(courseId);
  if (cached) return cached;

  const file = findCourseFile(courseId);
  if (!file) return null;
  const parsed = CourseSchema.parse(JSON.parse(readFileSync(file, 'utf8')));
  cache.set(courseId, parsed);
  return parsed;
}

/** Finds a lesson without flattening the rest of the course. */
export function findLesson(course: Course, lessonId: string): Lesson | null {
  for (const unit of course.units) {
    for (const lesson of unit.lessons) {
      if (lesson.id === lessonId) return lesson;
    }
  }
  return null;
}
