import type { Course, Locale } from '@speeko/core';
import { LOCALE_LABEL } from '@speeko/core';

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
    reviewStatus: 'draft',
    units: [
      {
        id: `${id}-u1`,
        title: 'Basics 1',
        description: 'Greetings and essentials',
        order: 0,
        crownLevel: 0,
        reviewStatus: 'draft',
        lessons: [
          {
            id: `${id}-u1-l1`,
            title: 'Hello & Goodbye',
            order: 0,
            difficulty: 'A1',
            xpReward: 10,
            reviewStatus: 'draft',
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
            reviewStatus: 'draft',
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
        reviewStatus: 'draft',
        lessons: [
          {
            id: `${id}-u2-l1`,
            title: 'Numbers 1-5',
            order: 0,
            difficulty: 'A1',
            xpReward: 10,
            reviewStatus: 'draft',
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
                options: ['दो', 'एक', 'चार', 'पाँच'],
                answerIndex: 0,
              },
              {
                id: `${id}-u2-l1-e3`,
                kind: 'typeTranslation',
                prompt: 'Type "one" in the target language',
                expected: ['एक'],
              },
            ],
          },
        ],
      },
    ],
  } as Course;
}
