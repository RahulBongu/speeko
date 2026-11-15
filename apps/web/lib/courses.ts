import {
  CourseSchema,
  type Course,
  type Lesson,
  type Locale,
  type Unit,
} from '@speeko/core';

export interface CourseManifestEntry {
  id: string;
  locale: Locale;
  title: string;
  difficulty: string;
  units: number;
  lessons: number;
  exercises: number;
  file: string;
}

export interface LocaleMeta {
  native: string;
  english: string;
  glyph: string;
  gradient: string;
  speech: string;
}

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  en: { native: 'English', english: 'English', glyph: 'A', gradient: 'from-slate-400 to-slate-500', speech: 'en-US' },
  hi: { native: 'हिन्दी', english: 'Hindi', glyph: 'अ', gradient: 'from-emerald-400 to-teal-500', speech: 'hi-IN' },
  bn: { native: 'বাংলা', english: 'Bengali', glyph: 'অ', gradient: 'from-sky-400 to-blue-500', speech: 'bn-IN' },
  mr: { native: 'मराठी', english: 'Marathi', glyph: 'म', gradient: 'from-orange-400 to-amber-500', speech: 'mr-IN' },
  te: { native: 'తెలుగు', english: 'Telugu', glyph: 'తె', gradient: 'from-violet-400 to-purple-500', speech: 'te-IN' },
  ta: { native: 'தமிழ்', english: 'Tamil', glyph: 'த', gradient: 'from-rose-400 to-pink-500', speech: 'ta-IN' },
  kn: { native: 'ಕನ್ನಡ', english: 'Kannada', glyph: 'ಕ', gradient: 'from-cyan-400 to-sky-500', speech: 'kn-IN' },
  ml: { native: 'മലയാളം', english: 'Malayalam', glyph: 'മ', gradient: 'from-lime-400 to-emerald-500', speech: 'ml-IN' },
  gu: { native: 'ગુજરાતી', english: 'Gujarati', glyph: 'ગ', gradient: 'from-fuchsia-400 to-purple-500', speech: 'gu-IN' },
  pa: { native: 'ਪੰਜਾਬੀ', english: 'Punjabi', glyph: 'ਗ', gradient: 'from-amber-400 to-orange-500', speech: 'pa-IN' },
  or: { native: 'ଓଡ଼ିଆ', english: 'Odia', glyph: 'ଓ', gradient: 'from-indigo-400 to-violet-500', speech: 'or-IN' },
};

export const COURSE_ORDER: readonly Locale[] = ['hi', 'bn', 'mr', 'te', 'ta', 'kn', 'ml', 'gu', 'pa', 'or'];

export function sortManifest(entries: CourseManifestEntry[]): CourseManifestEntry[] {
  return [...entries].sort((a, b) => {
    const ai = COURSE_ORDER.indexOf(a.locale);
    const bi = COURSE_ORDER.indexOf(b.locale);
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  });
}

export async function fetchManifest(): Promise<CourseManifestEntry[]> {
  const res = await fetch('/courses/manifest.json', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Could not load courses (${res.status})`);
  const data = (await res.json()) as CourseManifestEntry[];
  return sortManifest(data);
}

export async function fetchCourse(courseId: string): Promise<Course> {
  const res = await fetch(`/courses/${encodeURIComponent(courseId)}.json`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Could not load course (${res.status})`);
  const data: unknown = await res.json();
  // Parse through Zod so schema defaults (acceptTypos, softScore, xpReward) apply.
  return CourseSchema.parse(data);
}

export interface FlatLesson {
  lesson: Lesson;
  unit: Unit;
  index: number;
}

export function flattenLessons(course: Course): FlatLesson[] {
  const out: FlatLesson[] = [];
  for (const unit of course.units) {
    for (const lesson of unit.lessons) {
      out.push({ lesson, unit, index: out.length });
    }
  }
  return out;
}

export function findLesson(course: Course, lessonId: string): FlatLesson | null {
  return flattenLessons(course).find((entry) => entry.lesson.id === lessonId) ?? null;
}

export function courseLessonCount(course: Course): number {
  return course.units.reduce((total, unit) => total + unit.lessons.length, 0);
}
