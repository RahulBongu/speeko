import { describe, expect, it } from 'vitest';
import {
  buildModuleBrief,
  formatExercisePrompt,
  normalizeExperienceLevel,
  personalizeCoursePath,
} from './path.js';
import type { Course } from './content.js';

function makeCourse(unitCount = 11): Course {
  return {
    id: 'te-starter',
    locale: 'te',
    sourceLocale: 'en',
    title: 'తెలుగు — Starter',
    difficulty: 'A1',
    version: '1.0.0',
    reviewStatus: 'automated_reviewed',
    units: Array.from({ length: unitCount }, (_, ui) => ({
      id: `te-starter-u${ui + 1}`,
      title: `Unit ${ui + 1}`,
      description: `Topics for module ${ui + 1}`,
      order: ui,
      crownLevel: 0,
      reviewStatus: 'automated_reviewed',
      lessons: [
        {
          id: `te-starter-u${ui + 1}-l1`,
          title: `Lesson ${ui + 1}.1`,
          order: 0,
          difficulty: 'A1',
          xpReward: 10,
          reviewStatus: 'automated_reviewed',
          exercises: [
            {
              id: `te-starter-u${ui + 1}-l1-e1`,
              kind: 'chooseMeaning',
              prompt: 'Hello',
              options: ['నమస్కారం', 'కాదు'],
              answerIndex: 0,
            },
            {
              id: `te-starter-u${ui + 1}-l1-e2`,
              kind: 'typeTranslation',
              prompt: 'Type "hello"',
              expected: ['నమస్కారం'],
              acceptTypos: true,
            },
            {
              id: `te-starter-u${ui + 1}-l1-e3`,
              kind: 'listenChoose',
              prompt: 'Listen and choose',
              options: ['నమస్కారం', 'కాదు'],
              answerIndex: 0,
              audioUrl: '/courses/audio/test.mp3',
            },
          ],
        },
        {
          id: `te-starter-u${ui + 1}-l2`,
          title: `Lesson ${ui + 1}.2`,
          order: 1,
          difficulty: 'A1',
          xpReward: 10,
          reviewStatus: 'automated_reviewed',
          exercises: [
            {
              id: `te-starter-u${ui + 1}-l2-e1`,
              kind: 'chooseMeaning',
              prompt: 'Thank you',
              options: ['ధన్యవాదాలు', 'అవును'],
              answerIndex: 0,
            },
          ],
        },
      ],
    })),
  };
}

describe('experience-based module paths & prompts', () => {
  it('keeps strict sequential order starting at Unit 1 for beginners', () => {
    const course = makeCourse(11);
    const path = personalizeCoursePath(course, 'zero', new Set());
    expect(path.experience).toBe('zero');
    expect(path.units[0]?.unit.id).toBe('te-starter-u1');
    expect(path.recommendedLessonId).toBe('te-starter-u1-l1');
    expect(path.unlockedLessonIds.has('te-starter-u1-l1')).toBe(true);
    expect(path.unlockedLessonIds.has('te-starter-u5-l1')).toBe(false);
  });

  it('varies starting modules & unlocks per learner experience level', () => {
    const course = makeCourse(11);

    const somePath = personalizeCoursePath(course, 'some', new Set());
    expect(somePath.units[0]?.unit.id).toBe('te-starter-u3');
    expect(somePath.recommendedLessonId).toBe('te-starter-u3-l1');
    expect(somePath.unlockedLessonIds.has('te-starter-u1-l1')).toBe(true);

    const returningPath = personalizeCoursePath(course, 'returning', new Set());
    expect(returningPath.units[0]?.unit.id).toBe('te-starter-u5');
    expect(returningPath.recommendedLessonId).toBe('te-starter-u5-l1');
    expect(returningPath.unlockedLessonIds.has('te-starter-u1-l1')).toBe(true);

    const conversantPath = personalizeCoursePath(course, 'conversant', new Set());
    expect(conversantPath.units[0]?.unit.id).toBe('te-starter-u11');
    expect(conversantPath.recommendedLessonId).toBe('te-starter-u11-l1');
    expect(conversantPath.unlockedLessonIds.has('te-starter-u9-l1')).toBe(true);
    expect(conversantPath.unlockedLessonIds.has('te-starter-u1-l1')).toBe(true);
  });

  it('normalizes unknown or legacy beginner levels cleanly', () => {
    expect(normalizeExperienceLevel(null)).toBe('zero');
    expect(normalizeExperienceLevel('beginner')).toBe('zero');
    expect(normalizeExperienceLevel('conversant')).toBe('conversant');
  });

  it('formats Type prompts explicitly with target language', () => {
    expect(formatExercisePrompt({ kind: 'typeTranslation', prompt: 'Type "hello"' }, 'Telugu')).toBe(
      'Type "hello" (in Telugu)',
    );
    expect(
      formatExercisePrompt({ kind: 'typeTranslation', prompt: 'Type "hello" (in Telugu)' }, 'Telugu'),
    ).toBe('Type "hello" (in Telugu)');
    expect(formatExercisePrompt({ kind: 'chooseMeaning', prompt: 'Hello' }, 'Telugu')).toBe(
      'Hello',
    );
  });

  it('builds a module brief with topics note and upcoming answers guide', () => {
    const course = makeCourse(4);
    const brief = buildModuleBrief(course, 0);
    expect(brief).not.toBeNull();
    expect(brief?.title).toBe('Unit 1');
    expect(brief?.topicNote).toBe('Topics for module 1');
    expect(brief?.listeningCount).toBe(1);
    expect(brief?.answersGuide.length).toBeGreaterThanOrEqual(2);
    expect(brief?.answersGuide[0]?.target).toBe('నమస్కారం');
    expect(brief?.answersGuide[0]?.audioUrl).toBe('/courses/audio/test.mp3');
  });
});
