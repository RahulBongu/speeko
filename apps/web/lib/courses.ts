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
  // On-brand two-stop ramps. Every stop is >= 4.5:1 against white text
  // (fox-700 4.6, speeko-700 5.9, bark-500 6.6 and darker).
  en: { native: 'English', english: 'English', glyph: 'A', gradient: 'from-bark-500 to-bark-800', speech: 'en-US' },
  hi: { native: 'हिन्दी', english: 'Hindi', glyph: 'अ', gradient: 'from-speeko-700 to-speeko-800', speech: 'hi-IN' },
  bn: { native: 'বাংলা', english: 'Bengali', glyph: 'অ', gradient: 'from-speeko-700 to-bark-800', speech: 'bn-IN' },
  mr: { native: 'मराठी', english: 'Marathi', glyph: 'म', gradient: 'from-fox-700 to-bark-800', speech: 'mr-IN' },
  te: { native: 'తెలుగు', english: 'Telugu', glyph: 'తె', gradient: 'from-bark-600 to-speeko-800', speech: 'te-IN' },
  ta: { native: 'தமிழ்', english: 'Tamil', glyph: 'த', gradient: 'from-fox-700 to-speeko-800', speech: 'ta-IN' },
  kn: { native: 'ಕನ್ನಡ', english: 'Kannada', glyph: 'ಕ', gradient: 'from-bark-500 to-speeko-800', speech: 'kn-IN' },
  ml: { native: 'മലയാളം', english: 'Malayalam', glyph: 'മ', gradient: 'from-speeko-800 to-bark-800', speech: 'ml-IN' },
  gu: { native: 'ગુજરાતી', english: 'Gujarati', glyph: 'ગ', gradient: 'from-bark-600 to-fox-700', speech: 'gu-IN' },
  pa: { native: 'ਪੰਜਾਬੀ', english: 'Punjabi', glyph: 'ਗ', gradient: 'from-bark-500 to-bark-700', speech: 'pa-IN' },
  or: { native: 'ଓଡ଼ିଆ', english: 'Odia', glyph: 'ଓ', gradient: 'from-bark-700 to-speeko-800', speech: 'or-IN' },
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
