import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const phrases = JSON.parse(readFileSync(resolve(here, '_config', 'phrases.json'), 'utf8'));

const LOCALES = ['hi','bn','mr','te','ta','kn','ml','gu','pa','or'];
const LABELS = { hi:'हिन्दी', bn:'বাংলা', mr:'मराठी', te:'తెలుగు', ta:'தமிழ்', kn:'ಕನ್ನಡ', ml:'മലയാളം', gu:'ગુજરાતી', pa:'ਪੰਜਾਬੀ', or:'ଓଡ଼ିଆ' };

function t(locale, key) { return phrases[key][locale]; }

for (const locale of LOCALES) {
  const id = `${locale}-starter`;
  const course = {
    id,
    locale,
    sourceLocale: 'en',
    title: `${LABELS[locale]} — Starter`,
    description: `Starter course for ${LABELS[locale]} (Tier 1: greetings, numbers, essentials).`,
    difficulty: 'A1',
    version: '1.0.0',
    units: [
      {
        id: `${id}-u1`,
        title: 'Greetings',
        description: 'Hello, thanks, yes, no',
        order: 0,
        crownLevel: 0,
        lessons: [
          {
            id: `${id}-u1-l1`,
            title: 'Hello & Thanks',
            order: 0,
            difficulty: 'A1',
            xpReward: 10,
            exercises: [
              { id: `${id}-u1-l1-e1`, kind: 'chooseMeaning', prompt: 'Hello', options: [t(locale,'hello'), t(locale,'thank_you'), t(locale,'yes'), t(locale,'no')], answerIndex: 0 },
              { id: `${id}-u1-l1-e2`, kind: 'chooseMeaning', prompt: 'Thank you', options: [t(locale,'thank_you'), t(locale,'hello'), t(locale,'please'), t(locale,'sorry')], answerIndex: 0 },
              { id: `${id}-u1-l1-e3`, kind: 'typeTranslation', prompt: 'Type "hello"', expected: [t(locale,'hello')] },
            ],
          },
          {
            id: `${id}-u1-l2`,
            title: 'Yes & No',
            order: 1,
            difficulty: 'A1',
            xpReward: 10,
            exercises: [
              { id: `${id}-u1-l2-e1`, kind: 'chooseMeaning', prompt: 'Yes', options: [t(locale,'yes'), t(locale,'no'), t(locale,'please'), t(locale,'sorry')], answerIndex: 0 },
              { id: `${id}-u1-l2-e2`, kind: 'chooseMeaning', prompt: 'No', options: [t(locale,'no'), t(locale,'yes'), t(locale,'thank_you'), t(locale,'hello')], answerIndex: 0 },
              { id: `${id}-u1-l2-e3`, kind: 'matchPairs', prompt: 'Match the pairs', pairs: [['Yes', t(locale,'yes')], ['No', t(locale,'no')]] },
            ],
          },
        ],
      },
      {
        id: `${id}-u2`,
        title: 'Numbers',
        description: 'Counting 1 to 5',
        order: 1,
        crownLevel: 0,
        lessons: [
          {
            id: `${id}-u2-l1`,
            title: 'Numbers 1-3',
            order: 0,
            difficulty: 'A1',
            xpReward: 10,
            exercises: [
              { id: `${id}-u2-l1-e1`, kind: 'chooseMeaning', prompt: 'One', options: [t(locale,'one'), t(locale,'two'), t(locale,'three'), t(locale,'four')], answerIndex: 0 },
              { id: `${id}-u2-l1-e2`, kind: 'chooseMeaning', prompt: 'Two', options: [t(locale,'two'), t(locale,'one'), t(locale,'five'), t(locale,'three')], answerIndex: 0 },
              { id: `${id}-u2-l1-e3`, kind: 'chooseMeaning', prompt: 'Three', options: [t(locale,'three'), t(locale,'two'), t(locale,'four'), t(locale,'one')], answerIndex: 0 },
            ],
          },
          {
            id: `${id}-u2-l2`,
            title: 'Numbers 4-5',
            order: 1,
            difficulty: 'A1',
            xpReward: 10,
            exercises: [
              { id: `${id}-u2-l2-e1`, kind: 'chooseMeaning', prompt: 'Four', options: [t(locale,'four'), t(locale,'five'), t(locale,'one'), t(locale,'two')], answerIndex: 0 },
              { id: `${id}-u2-l2-e2`, kind: 'chooseMeaning', prompt: 'Five', options: [t(locale,'five'), t(locale,'four'), t(locale,'three'), t(locale,'one')], answerIndex: 0 },
              { id: `${id}-u2-l2-e3`, kind: 'fillBlank', prompt: 'Fill in the blank', sentence: 'I have ___ apples.', options: ['one','two','three'], answerIndex: 1 },
            ],
          },
        ],
      },
      {
        id: `${id}-u3`,
        title: 'Essentials',
        description: 'Please, sorry, greetings',
        order: 2,
        crownLevel: 0,
        lessons: [
          {
            id: `${id}-u3-l1`,
            title: 'Polite words',
            order: 0,
            difficulty: 'A1',
            xpReward: 10,
            exercises: [
              { id: `${id}-u3-l1-e1`, kind: 'chooseMeaning', prompt: 'Please', options: [t(locale,'please'), t(locale,'sorry'), t(locale,'hello'), t(locale,'thank_you')], answerIndex: 0 },
              { id: `${id}-u3-l1-e2`, kind: 'chooseMeaning', prompt: 'Sorry', options: [t(locale,'sorry'), t(locale,'please'), t(locale,'yes'), t(locale,'no')], answerIndex: 0 },
              { id: `${id}-u3-l1-e3`, kind: 'typeTranslation', prompt: 'Type "please"', expected: [t(locale,'please')] },
            ],
          },
          {
            id: `${id}-u3-l2`,
            title: 'Good morning',
            order: 1,
            difficulty: 'A1',
            xpReward: 10,
            exercises: [
              { id: `${id}-u3-l2-e1`, kind: 'chooseMeaning', prompt: 'Good morning', options: [t(locale,'good_morning'), t(locale,'hello'), t(locale,'thank_you'), t(locale,'please')], answerIndex: 0 },
              { id: `${id}-u3-l2-e2`, kind: 'typeTranslation', prompt: 'Type "good morning"', expected: [t(locale,'good_morning')] },
              { id: `${id}-u3-l2-e3`, kind: 'listenChoose', prompt: 'Listen and choose', options: [t(locale,'good_morning'), t(locale,'hello'), t(locale,'sorry')], answerIndex: 0, audioUrl: '' },
            ],
          },
        ],
      },
      {
        id: `${id}-u4`,
        title: 'Beyond Five',
        description: 'Numbers 6 to 10',
        order: 3,
        crownLevel: 0,
        lessons: [
          {
            id: `${id}-u4-l1`,
            title: 'Six to Eight',
            order: 0,
            difficulty: 'A1',
            xpReward: 12,
            exercises: [
              { id: `${id}-u4-l1-e1`, kind: 'chooseMeaning', prompt: 'Six', options: [t(locale,'six'), t(locale,'seven'), t(locale,'eight'), t(locale,'nine')], answerIndex: 0 },
              { id: `${id}-u4-l1-e2`, kind: 'chooseMeaning', prompt: 'Seven', options: [t(locale,'seven'), t(locale,'six'), t(locale,'eight'), t(locale,'ten')], answerIndex: 0 },
              { id: `${id}-u4-l1-e3`, kind: 'typeTranslation', prompt: 'Type "six"', expected: [t(locale,'six')] },
            ],
          },
          {
            id: `${id}-u4-l2`,
            title: 'Nine & Ten',
            order: 1,
            difficulty: 'A1',
            xpReward: 12,
            exercises: [
              { id: `${id}-u4-l2-e1`, kind: 'chooseMeaning', prompt: 'Nine', options: [t(locale,'nine'), t(locale,'ten'), t(locale,'six'), t(locale,'seven')], answerIndex: 0 },
              { id: `${id}-u4-l2-e2`, kind: 'chooseMeaning', prompt: 'Ten', options: [t(locale,'ten'), t(locale,'nine'), t(locale,'eight'), t(locale,'six')], answerIndex: 0 },
              { id: `${id}-u4-l2-e3`, kind: 'matchPairs', prompt: 'Match the pairs', pairs: [['Nine', t(locale,'nine')], ['Ten', t(locale,'ten')]] },
            ],
          },
        ],
      },
    ],
  };
  mkdirSync(resolve(here, locale), { recursive: true });
  writeFileSync(resolve(here, locale, `${id}.json`), JSON.stringify(course, null, 2));
  console.log('wrote', locale, `${id}.json`);
}
console.log('done');
