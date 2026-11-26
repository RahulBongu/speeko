import type { Course, Exercise, Lesson, Unit } from './content.js';
import { eligibleExercises } from './eligibility.js';
import { guidebookItems } from './guidebook.js';
import { romanHint } from './romanize.js';

export type ExperienceLevel = 'zero' | 'some' | 'returning' | 'conversant';

export const EXPERIENCE_LEVELS: readonly ExperienceLevel[] = [
  'zero',
  'some',
  'returning',
  'conversant',
];

export interface ExperienceProfile {
  id: ExperienceLevel;
  label: string;
  shortLabel: string;
  description: string;
}

export const EXPERIENCE_PROFILES: Record<ExperienceLevel, ExperienceProfile> = {
  zero: {
    id: 'zero',
    label: 'Starting from zero',
    shortLabel: 'Beginner',
    description: 'Guided step-by-step path starting with Greetings and first sounds.',
  },
  some: {
    id: 'some',
    label: 'Know a few phrases',
    shortLabel: 'Basics',
    description: 'Leads with Essentials & Beyond Five while keeping Basics open to skim.',
  },
  returning: {
    id: 'returning',
    label: 'Returning learner',
    shortLabel: 'Returning',
    description: 'Brings daily life (Family, Food, Places, Actions) right up front.',
  },
  conversant: {
    id: 'conversant',
    label: 'Can hold simple chats',
    shortLabel: 'Conversant',
    description: 'Opens with Conversations, Actions, & Nature while keeping foundations unlocked.',
  },
};

export function normalizeExperienceLevel(raw?: string | null): ExperienceLevel {
  if (raw === 'some' || raw === 'returning' || raw === 'conversant') return raw;
  return 'zero';
}

/**
 * Ensures typing exercises always tell the learner which language/script to type,
 * e.g. `Type "hello"` -> `Type "hello" (in Telugu)`.
 */
export function formatExercisePrompt(
  exercise: Pick<Exercise, 'kind' | 'prompt'>,
  localeEnglishName: string,
): string {
  const prompt = exercise.prompt ?? '';
  if (exercise.kind !== 'typeTranslation') return prompt;
  if (!prompt || /\(in\s+[A-Za-z]+\)\s*$/i.test(prompt)) return prompt;
  if (/^type\s+"/i.test(prompt)) {
    return `${prompt} (in ${localeEnglishName})`;
  }
  return prompt;
}

export interface ModuleAnswerGuideItem {
  prompt: string;
  target: string;
  romanized: string;
  audioUrl?: string | undefined;
  exerciseId?: string | undefined;
}

export interface ModuleBrief {
  unitId: string;
  originalUnitNumber: number;
  title: string;
  topicNote: string;
  lessonCount: number;
  listeningCount: number;
  answersGuide: ModuleAnswerGuideItem[];
}

function cleanGuidePrompt(prompt: string, target: string): string {
  const quoted = /^Type\s+"([^"]+)"(?:\s*\(in\s+[A-Za-z]+\))?/i.exec(prompt.trim());
  if (quoted && quoted[1]) {
    const word = quoted[1].trim();
    return word.charAt(0).toUpperCase() + word.slice(1);
  }
  if (/^listen and choose$/i.test(prompt.trim())) {
    return 'Listening phrase';
  }
  if (prompt.trim() === target.trim()) {
    return 'Target phrase';
  }
  return prompt.trim() || target;
}

/**
 * Extracts a concise topic note and upcoming answer key for a unit/module so
 * learners can preview what they are about to meet before clicking Continue.
 */
export function buildModuleBrief(course: Course, unitIndexZeroBased: number): ModuleBrief | null {
  const unit = course.units[unitIndexZeroBased];
  if (!unit) return null;

  const allExercises = unit.lessons.flatMap((l) => l.exercises);
  const extracted = guidebookItems(allExercises);

  // Map target script string -> audioUrl / clean English label when available
  const audioByTarget = new Map<string, { audioUrl: string; exerciseId: string }>();
  const englishLabelByTarget = new Map<string, string>();
  for (const lesson of unit.lessons) {
    for (const ex of lesson.exercises) {
      if (ex.kind === 'listenChoose') {
        const target = ex.options[ex.answerIndex];
        const url = (ex as { audioUrl?: string }).audioUrl;
        if (target && url && url.trim().length > 0 && !audioByTarget.has(target)) {
          audioByTarget.set(target, { audioUrl: url, exerciseId: ex.id });
        }
      } else if (ex.kind === 'chooseMeaning') {
        const target = ex.options[ex.answerIndex];
        if (target && ex.prompt && !englishLabelByTarget.has(target)) {
          englishLabelByTarget.set(target, ex.prompt);
        }
      } else if (ex.kind === 'matchPairs') {
        for (const [src, tgt] of ex.pairs) {
          if (tgt && src && !englishLabelByTarget.has(tgt)) {
            englishLabelByTarget.set(tgt, src);
          }
        }
      }
    }
  }

  const answersGuide: ModuleAnswerGuideItem[] = extracted.slice(0, 8).map((item) => {
    const audioInfo = audioByTarget.get(item.target);
    const label =
      englishLabelByTarget.get(item.target) ?? cleanGuidePrompt(item.prompt, item.target);
    return {
      prompt: label,
      target: item.target,
      romanized: romanHint(item.target) ?? '',
      audioUrl: audioInfo?.audioUrl,
      exerciseId: audioInfo?.exerciseId,
    };
  });

  const listeningCount = unit.lessons.reduce(
    (sum, l) =>
      sum + eligibleExercises(l.exercises).filter((e) => e.kind === 'listenChoose').length,
    0,
  );

  const topicNote =
    unit.guidebook?.trim() ||
    unit.description?.trim() ||
    `Learn key phrases across ${unit.lessons.map((l) => l.title).join(', ')}.`;

  return {
    unitId: unit.id,
    originalUnitNumber: unitIndexZeroBased + 1,
    title: unit.title,
    topicNote,
    lessonCount: unit.lessons.length,
    listeningCount,
    answersGuide,
  };
}

export function moduleBriefForLesson(course: Course, lessonId: string): ModuleBrief | null {
  const unitIndex = course.units.findIndex((u) => u.lessons.some((l) => l.id === lessonId));
  if (unitIndex < 0) return null;
  return buildModuleBrief(course, unitIndex);
}

export type TrackRole = 'recommended' | 'core' | 'warmup';

export interface PersonalizedUnitEntry {
  unit: Unit;
  originalIndex: number;
  trackRole: TrackRole;
  /** First lesson id inside this unit is immediately accessible without strictly completing warmups. */
  entryUnlocked: boolean;
}

export interface PersonalizedCoursePath {
  experience: ExperienceLevel;
  units: PersonalizedUnitEntry[];
  recommendedLessonId: string | null;
  unlockedLessonIds: ReadonlySet<string>;
}

function personalizedOrderIndices(unitCount: number, experience: ExperienceLevel): number[] {
  const all = Array.from({ length: unitCount }, (_, i) => i);
  if (experience === 'zero' || unitCount <= 2) return all;

  if (experience === 'some') {
    const priority = all.slice(2);
    const warmup = all.slice(0, 2);
    return [...priority, ...warmup];
  }

  if (experience === 'returning') {
    const split = Math.min(4, Math.max(2, unitCount - 2));
    const priority = all.slice(split);
    const warmup = all.slice(0, split);
    return [...priority, ...warmup];
  }

  // 'conversant': place real-world conversations & action units right at the top
  const head = [10, 8, 9, 7, 6, 5, 4].filter((i) => i < unitCount);
  const headSet = new Set(head);
  const tail = all.filter((i) => !headSet.has(i)).reverse();
  return [...head, ...tail];
}

/**
 * Reorders and tailors module entry points based on the learner's self-reported
 * language experience while leaving strict `'zero'` progression intact.
 */
export function personalizeCoursePath(
  course: Course,
  rawLevel: string | null | undefined,
  completedLessonIds: ReadonlySet<string>,
): PersonalizedCoursePath {
  const experience = normalizeExperienceLevel(rawLevel);
  const order = personalizedOrderIndices(course.units.length, experience);

  const warmupThreshold =
    experience === 'some'
      ? 2
      : experience === 'returning'
        ? Math.min(4, Math.max(2, course.units.length - 2))
        : experience === 'conversant'
          ? Math.min(4, Math.max(2, course.units.length - 2))
          : 0;

  const flatOrderedLessons: Lesson[] = [];
  const entries: PersonalizedUnitEntry[] = order.map((originalIndex, displayPos) => {
    const unit = course.units[originalIndex]!;
    for (const lesson of unit.lessons) flatOrderedLessons.push(lesson);

    const isWarmup = experience !== 'zero' && originalIndex < warmupThreshold;
    const isRecommended =
      (experience === 'zero' && displayPos === 0) ||
      (!isWarmup && displayPos === 0) ||
      (experience === 'conversant' && originalIndex >= warmupThreshold);

    return {
      unit,
      originalIndex,
      trackRole: isWarmup ? 'warmup' : isRecommended ? 'recommended' : 'core',
      entryUnlocked: experience !== 'zero' && (isWarmup || displayPos === 0 || experience === 'conversant'),
    };
  });

  const recommendedLessonId =
    flatOrderedLessons.find((l) => !completedLessonIds.has(l.id))?.id ??
    flatOrderedLessons[flatOrderedLessons.length - 1]?.id ??
    null;

  const unlockedLessonIds = new Set<string>(completedLessonIds);
  if (recommendedLessonId) unlockedLessonIds.add(recommendedLessonId);

  if (experience !== 'zero') {
    for (const entry of entries) {
      const firstLesson = entry.unit.lessons[0];
      if (entry.entryUnlocked && firstLesson) {
        unlockedLessonIds.add(firstLesson.id);
      }
      // Within any module, once a lesson is completed, unlock the next lesson in that module
      for (let i = 0; i < entry.unit.lessons.length - 1; i++) {
        if (completedLessonIds.has(entry.unit.lessons[i]!.id)) {
          unlockedLessonIds.add(entry.unit.lessons[i + 1]!.id);
        }
      }
    }
  }

  return {
    experience,
    units: entries,
    recommendedLessonId,
    unlockedLessonIds,
  };
}
