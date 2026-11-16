const fs = require('node:fs');
const path = require('node:path');

const lessonsByUnit = [
  {
    title: 'Greetings',
    description: 'Everyday greetings and polite words.',
    words: [
      { en: 'Hello', hi: '\u0928\u092e\u0938\u094d\u0924\u0947', tr: 'namaste' },
      { en: 'Thank you', hi: '\u0927\u0928\u094d\u092f\u0935\u093e\u0926', tr: 'dhanyavaad' },
      { en: 'Please', hi: '\u0915\u0943\u092a\u092f\u093e', tr: 'kripya' },
      { en: 'Sorry', hi: '\u092e\u093e\u092b \u0915\u0940\u091c\u093f\u090f', tr: 'maaf kijiye' },
      { en: 'Goodbye', hi: '\u0905\u0932\u0935\u093f\u0926\u093e', tr: 'alvida' },
    ],
  },
  {
    title: 'Numbers',
    description: 'Counting from one to five.',
    words: [
      { en: 'One', hi: '\u090f\u0915', tr: 'ek' },
      { en: 'Two', hi: '\u0926\u094b', tr: 'do' },
      { en: 'Three', hi: '\u0924\u0940\u0928', tr: 'teen' },
      { en: 'Four', hi: '\u091a\u093e\u0930', tr: 'chaar' },
      { en: 'Five', hi: '\u092a\u093e\u0901\u091a', tr: 'paanch' },
    ],
  },
  {
    title: 'Family',
    description: 'People close to you.',
    words: [
      { en: 'Mother', hi: '\u092e\u093e\u0901', tr: 'maa' },
      { en: 'Father', hi: '\u092a\u093f\u0924\u093e', tr: 'pita' },
      { en: 'Brother', hi: '\u092d\u093e\u0908', tr: 'bhai' },
      { en: 'Sister', hi: '\u092c\u0939\u0928', tr: 'behen' },
      { en: 'Child', hi: '\u092c\u091a\u094d\u091a\u093e', tr: 'bachcha' },
    ],
  },
  {
    title: 'Food',
    description: 'Food and drink words.',
    words: [
      { en: 'Water', hi: '\u092a\u093e\u0928\u0940', tr: 'paani' },
      { en: 'Tea', hi: '\u091a\u093e\u092f', tr: 'chai' },
      { en: 'Rice', hi: '\u091a\u093e\u0935\u0932', tr: 'chaawal' },
      { en: 'Bread', hi: '\u0930\u094b\u091f\u0940', tr: 'roti' },
      { en: 'Milk', hi: '\u0926\u0942\u0927', tr: 'doodh' },
    ],
  },
  {
    title: 'Places',
    description: 'Places around town.',
    words: [
      { en: 'Home', hi: '\u0918\u0930', tr: 'ghar' },
      { en: 'School', hi: '\u0938\u094d\u0915\u0942\u0932', tr: 'school' },
      { en: 'Market', hi: '\u092c\u093e\u091c\u093e\u0930', tr: 'bazaar' },
      { en: 'Station', hi: '\u0938\u094d\u091f\u0947\u0936\u0928', tr: 'station' },
      { en: 'Road', hi: '\u0938\u0921\u093c\u0915', tr: 'sadak' },
    ],
  },
];

const locale = 'hi';
const id = 'hi-pilot';

const units = lessonsByUnit.map((unit, unitIndex) => {
  const lessons = unit.words.map((word, lessonIndex) => {
    const others = unit.words.filter((w) => w.hi !== word.hi);
    const options = [word.hi, ...others.slice(0, 3).map((w) => w.hi)];
    const englishOptions = [word.en, ...others.slice(0, 3).map((w) => w.en)];
    return {
      id: `${id}-u${unitIndex + 1}-l${lessonIndex + 1}`,
      title: word.en,
      order: lessonIndex,
      difficulty: 'A1',
      xpReward: 10,
      reviewStatus: 'draft',
      guidebook: `Practice the Hindi word for ${word.en.toLowerCase()}.`,
      vocabId: `hi:${word.tr}`,
      exercises: [
        {
          id: `${id}-u${unitIndex + 1}-l${lessonIndex + 1}-e1`,
          kind: 'chooseMeaning',
          prompt: word.en,
          options,
          answerIndex: 0,
          vocabId: `hi:${word.tr}`,
          transliteration: word.tr,
        },
        {
          id: `${id}-u${unitIndex + 1}-l${lessonIndex + 1}-e2`,
          kind: 'chooseMeaning',
          prompt: word.hi,
          options: englishOptions,
          answerIndex: 0,
          vocabId: `hi:${word.tr}`,
          transliteration: word.tr,
        },
        {
          id: `${id}-u${unitIndex + 1}-l${lessonIndex + 1}-e3`,
          kind: 'typeTranslation',
          prompt: `Type "${word.en.toLowerCase()}"`,
          expected: [word.hi],
          vocabId: `hi:${word.tr}`,
          transliteration: word.tr,
        },
      ],
    };
  });
  return {
    id: `${id}-u${unitIndex + 1}`,
    title: unit.title,
    description: unit.description,
    order: unitIndex,
    crownLevel: 0,
    reviewStatus: 'draft',
    guidebook: unit.description,
    lessons,
  };
});

const course = {
  id,
  locale,
  sourceLocale: 'en',
  title: 'Hindi \u2014 Pilot (draft)',
  description: 'A draft pilot course used to grow the Hindi path. Not reviewed by a native speaker.',
  difficulty: 'A1',
  version: '0.1.0',
  reviewStatus: 'draft',
  units,
};

const out = path.join(process.cwd(), 'content', 'hi', 'hi-pilot.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(course, null, 2), 'utf8');
console.log('wrote', out, course.units.length, 'units', course.units.reduce((n, u) => n + u.lessons.length, 0), 'lessons');
