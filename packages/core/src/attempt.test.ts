import { describe, expect, it } from 'vitest';
import { CourseSchema, type Course } from './content.js';
import {
  reviewsForAttempt,
  scoreLessonAttempt,
  type AttemptAnswer,
} from './attempt.js';
import { createSession, reduceSession } from './session.js';

const course: Course = CourseSchema.parse({
  id: 'hi-test',
  locale: 'hi',
  title: 'Hindi Test',
  difficulty: 'A1',
  units: [
    {
      id: 'hi-test-u1',
      title: 'Unit 1',
      order: 0,
      lessons: [
        {
          id: 'hi-test-u1-l1',
          title: 'Lesson 1',
          order: 0,
          difficulty: 'A1',
          xpReward: 10,
          exercises: [
            {
              id: 'e1',
              kind: 'chooseMeaning',
              prompt: 'Hello',
              options: ['नमस्ते', 'अलविदा'],
              answerIndex: 0,
            },
            {
              id: 'e2',
              kind: 'typeTranslation',
              prompt: 'Type thank you',
              expected: ['धन्यवाद'],
            },
            {
              id: 'e3',
              kind: 'wordBank',
              prompt: 'Build a sentence',
              words: ['मैं', 'हूँ'],
              answer: ['मैं', 'हूँ'],
            },
          ],
        },
      ],
    },
  ],
});

const lesson = course.units[0]!.lessons[0]!;

const correctAnswers: AttemptAnswer[] = [
  { exerciseId: 'e1', input: { kind: 'choice', index: 0 } },
  { exerciseId: 'e2', input: { kind: 'text', value: 'धन्यवाद' } },
  { exerciseId: 'e3', input: { kind: 'tokens', value: ['मैं', 'हूँ'] } },
];

describe('scoreLessonAttempt', () => {
  it('rejects a lesson with no exercises instead of awarding a free bonus', () => {
    expect(scoreLessonAttempt({ ...lesson, exercises: [] }, [])).toEqual({
      ok: false,
      reason: 'Lesson has no exercises',
    });
  });

  it('re-grades a perfect attempt and applies combo + lesson XP', () => {
    const result = scoreLessonAttempt(lesson, correctAnswers);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.score.xp).toBe(22); // 2 + 5 + 5 exercise XP + 10 lesson XP
    expect(result.score.exerciseXp).toBe(12);
    expect(result.score.accuracy).toBe(1);
    expect(result.score.heartsLeft).toBe(5);
    expect(result.score.maxCombo).toBe(3);
    expect(result.score.mistakes).toEqual([]);
    expect(result.score.passed).toBe(true);
    expect(result.score.answers.map((answer) => answer.exerciseId)).toEqual(['e1', 'e2', 'e3']);
  });

  it('matches the player session reducer for a normal in-order attempt', () => {
    let state = createSession(lesson.id, lesson.exercises, 0);
    for (const answer of correctAnswers) {
      state = reduceSession(state, {
        type: 'answer',
        exerciseId: answer.exerciseId,
        correct: true,
        ms: 1000,
      });
    }
    const result = scoreLessonAttempt(lesson, correctAnswers);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.score.exerciseXp).toBe(state.xp);
  });

  it('re-grades wrong answers instead of trusting the client', () => {
    const answers = correctAnswers.map((answer) =>
      answer.exerciseId === 'e2' ? { ...answer, input: { kind: 'text' as const, value: 'नमस्ते' } } : answer,
    );
    const result = scoreLessonAttempt(lesson, answers);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.score.exerciseXp).toBe(5); // 2 + 0 + 3, combo resets after the miss
    expect(result.score.xp).toBe(15);
    expect(result.score.accuracy).toBeCloseTo(2 / 3);
    expect(result.score.heartsLeft).toBe(4);
    expect(result.score.maxCombo).toBe(1);
    expect(result.score.mistakes).toEqual(['e2']);
    expect(result.score.answers[1]?.correct).toBe(false);
    expect(result.score.answers[1]?.expected).toBe('धन्यवाद');
  });

  it('scores in canonical lesson order even when answers arrive shuffled', () => {
    const shuffled = [correctAnswers[2]!, correctAnswers[0]!, correctAnswers[1]!];
    const result = scoreLessonAttempt(lesson, shuffled);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.score.xp).toBe(22);
    expect(result.score.answers.map((answer) => answer.exerciseId)).toEqual(['e1', 'e2', 'e3']);
  });

  it('rejects missing, duplicate, and unknown exercises', () => {
    expect(scoreLessonAttempt(lesson, correctAnswers.slice(0, 2))).toEqual({
      ok: false,
      reason: 'Every exercise must be answered exactly once',
    });

    const duplicate = [correctAnswers[0]!, correctAnswers[0]!, correctAnswers[2]!];
    expect(scoreLessonAttempt(lesson, duplicate).ok).toBe(false);

    const unknown = [...correctAnswers, { exerciseId: 'e4', input: { kind: 'choice' as const, index: 0 } }];
    expect(scoreLessonAttempt(lesson, unknown)).toEqual({
      ok: false,
      reason: 'Unknown exercise e4',
    });
  });

  it('fails the attempt and awards nothing when hearts run out', () => {
    const answers = correctAnswers.map((answer) =>
      answer.exerciseId === 'e1' ? { ...answer, input: { kind: 'choice' as const, index: 1 } } : answer,
    );
    const result = scoreLessonAttempt(lesson, answers, 1);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.score.heartsLeft).toBe(0);
    expect(result.score.passed).toBe(false);
    expect(result.score.xp).toBe(0);
    expect(result.score.exerciseXp).toBeGreaterThan(0);
  });
});

describe('reviewsForAttempt', () => {
  it('maps graded answers to SRS reviews with the shared quality rule', () => {
    const answers = correctAnswers.map((answer) =>
      answer.exerciseId === 'e2' ? { ...answer, input: { kind: 'text' as const, value: 'गलत' } } : answer,
    );
    const result = scoreLessonAttempt(lesson, answers);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const reviews = reviewsForAttempt(course.locale, lesson.exercises, result.score.answers);
    expect(reviews).toHaveLength(3);
    expect(reviews.map((review) => review.quality)).toEqual([5, 2, 5]);
    expect(reviews.map((review) => review.skillId)).toEqual([
      'hi:नमस्ते',
      'hi:धन्यवाद',
      'hi:मैं हूँ',
    ]);
  });
});
