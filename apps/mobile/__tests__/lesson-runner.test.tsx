import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    getItem: jest.fn(async (key: string) => store.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      store.delete(key);
    }),
    clear: jest.fn(async () => {
      store.clear();
    }),
  };
});

const mockBack = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ courseId: 'hi-starter', lessonId: 'greetings' }),
  useRouter: () => ({ back: mockBack, push: jest.fn(), replace: mockReplace }),
}));

jest.mock('../lib/api', () => ({
  apiFetch: jest.fn(),
  ORIGIN: 'http://localhost:3000',
}));

jest.mock('../lib/audio', () => ({
  hasMobileAudio: jest.fn(() => false),
  playMobileAudio: jest.fn(async () => false),
  stopMobileAudio: jest.fn(async () => {}),
}));

jest.mock('../lib/mascot', () => ({
  isMascotVoiceEnabled: jest.fn(() => true),
  setMascotVoiceEnabled: jest.fn(),
  nextVariedMascotReaction: jest.fn((reactionId: string) => ({
    reactionId,
    phrase: reactionId === 'incorrect_answer' ? 'Not quite yet!' : 'Hurray! You nailed it!',
    audioKey: reactionId === 'unit_complete' ? 'unit-complete' : 'correct',
    sfxKey: null,
  })),
  playMascotVoice: jest.fn(async () => true),
  stopMascotVoice: jest.fn(async () => {}),
  useMascotSpeaking: jest.fn(() => false),
  useMascotListening: jest.fn(() => false),
}));

jest.mock('../lib/sound', () => ({
  isMobileSoundEnabled: jest.fn(() => true),
  setMobileSoundEnabled: jest.fn(),
  playMobileSound: jest.fn(async () => true),
  stopMobileSound: jest.fn(async () => {}),
}));

import { apiFetch } from '../lib/api';
import Lesson from '../app/lesson/[courseId]/[lessonId]';

const mockedFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

function reply(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

const fiveExercises = [
  {
    id: 'e-choose',
    kind: 'chooseMeaning',
    prompt: 'Choose the meaning of नमस्ते',
    options: ['Hello', 'Thank you'],
    answerIndex: 0,
  },
  {
    id: 'e-blank',
    kind: 'fillBlank',
    prompt: 'Fill the blank',
    sentence: 'मैं ___ हूँ।',
    options: ['ठीक', 'किताब'],
    answerIndex: 0,
  },
  {
    id: 'e-listen',
    kind: 'listenChoose',
    prompt: 'What did you hear?',
    audioUrl: '',
    options: ['पानी', 'दूध'],
    answerIndex: 1,
  },
  {
    id: 'e-type',
    kind: 'typeTranslation',
    prompt: 'Type hello in Hindi',
    expected: ['नमस्ते'],
    acceptTypos: false,
  },
  {
    id: 'e-pairs',
    kind: 'matchPairs',
    prompt: 'Match the pairs',
    pairs: [
      ['एक', 'one'],
      ['दो', 'two'],
    ],
  },
];

const fiveExercisesWithAudio = fiveExercises.map((exercise) =>
  (exercise as { id: string }).id === 'e-listen'
    ? { ...exercise, audioUrl: 'https://example.com/audio/listenChoose-test.mp3' }
    : exercise,
);

function courseWith(exercises: unknown[], xpReward = 10) {
  return {
    id: 'hi-starter',
    locale: 'hi',
    sourceLocale: 'en',
    title: 'Hindi Starter',
    difficulty: 'A1',
    version: '1.0.0',
    reviewStatus: 'draft',
    units: [
      {
        id: 'unit-1',
        title: 'Unit 1',
        order: 0,
        lessons: [
          {
            id: 'greetings',
            title: 'Greetings',
            order: 0,
            difficulty: 'A1',
            xpReward,
            reviewStatus: 'draft',
            exercises,
          },
        ],
      },
    ],
  };
}

function mockCourse(course: unknown) {
  mockedFetch.mockImplementation(async (path: string, init?: RequestInit) => {
    if (path === '/api/courses/hi-starter') return reply(200, course);
    if (path === '/api/lesson-completions') return reply(200, { event: { xp: 32 } });
    throw new Error(`Unexpected request: ${init?.method ?? 'GET'} ${path}`);
  });
}

function completionPosts() {
  return mockedFetch.mock.calls.filter(([path]) => path === '/api/lesson-completions');
}

describe('mobile lesson runner', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('saves the server-awarded reward and plays the eligible kinds', async () => {
    mockCourse(courseWith(fiveExercises));
    await render(<Lesson />);

    // listenChoose has an empty audioUrl, so it's excluded until audio exists.
    expect(await screen.findByText('Question 1 of 4')).toBeTruthy();
    expect(screen.getByLabelText('5 of 5 hearts left')).toBeTruthy();

    // chooseMeaning
    await fireEvent.press(screen.getByText('Hello'));
    await fireEvent.press(screen.getByText('Check'));
    expect(await screen.findByText('Correct!')).toBeTruthy();
    await fireEvent.press(screen.getByText('Continue'));

    // fillBlank is a choice board, not a text input.
    expect(await screen.findByText('Question 2 of 4')).toBeTruthy();
    expect(screen.getByText('मैं ___ हूँ।')).toBeTruthy();
    await fireEvent.press(screen.getByText('ठीक'));
    await fireEvent.press(screen.getByText('Check'));
    expect(await screen.findByText('Correct!')).toBeTruthy();
    await fireEvent.press(screen.getByText('Continue'));

    // typeTranslation
    expect(await screen.findByText('Question 3 of 4')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Translation answer'), 'नमस्ते');
    await fireEvent.press(screen.getByText('Check'));
    expect(await screen.findByText('Correct!')).toBeTruthy();
    await fireEvent.press(screen.getByText('Continue'));

    // matchPairs, both pairs
    expect(await screen.findByText('Question 4 of 4')).toBeTruthy();
    await fireEvent.press(screen.getByText('एक'));
    await fireEvent.press(screen.getByText('one'));
    await fireEvent.press(screen.getByText('दो'));
    await fireEvent.press(screen.getByText('two'));
    expect(screen.getByText('Matched 2 / 2 · Mismatches 0')).toBeTruthy();
    await fireEvent.press(screen.getByText('Check'));
    expect(await screen.findByText('Correct!')).toBeTruthy();
    await fireEvent.press(screen.getByText('See results'));

    expect(await screen.findByText('100% accuracy')).toBeTruthy();
    expect(screen.getByText('4 of 4 correct')).toBeTruthy();
    expect(await screen.findByText('+32 XP saved to your account')).toBeTruthy();

    const posts = completionPosts();
    expect(posts).toHaveLength(1);
    const body = JSON.parse(String(posts[0]![1]?.body));
    expect(body).toMatchObject({ courseId: 'hi-starter', lessonId: 'greetings' });
    expect(typeof body.attemptId).toBe('string');
    expect(body.answers.map((answer: { input: { kind: string } }) => answer.input.kind)).toEqual([
      'choice',
      'choice',
      'text',
      'pairs',
    ]);
  });

  it('plays a listenChoose exercise when an eligible audioUrl exists', async () => {
    mockCourse(courseWith(fiveExercisesWithAudio));
    await render(<Lesson />);

    expect(await screen.findByText('Question 1 of 5')).toBeTruthy();
    await fireEvent.press(screen.getByText('Hello'));
    await fireEvent.press(screen.getByText('Check'));
    expect(await screen.findByText('Correct!')).toBeTruthy();
    await fireEvent.press(screen.getByText('Continue'));

    expect(await screen.findByText('Question 2 of 5')).toBeTruthy();
    await fireEvent.press(screen.getByText('ठीक'));
    await fireEvent.press(screen.getByText('Check'));
    expect(await screen.findByText('Correct!')).toBeTruthy();
    await fireEvent.press(screen.getByText('Continue'));

    expect(await screen.findByText('Question 3 of 5')).toBeTruthy();
    await fireEvent.press(screen.getByText('दूध'));
    await fireEvent.press(screen.getByText('Check'));
    expect(await screen.findByText('Correct!')).toBeTruthy();
    await fireEvent.press(screen.getByText('Continue'));

    expect(await screen.findByText('Question 4 of 5')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Translation answer'), 'नमस्ते');
    await fireEvent.press(screen.getByText('Check'));
    expect(await screen.findByText('Correct!')).toBeTruthy();
    await fireEvent.press(screen.getByText('Continue'));

    expect(await screen.findByText('Question 5 of 5')).toBeTruthy();
  });

  it('blocks an unsupported exercise without posting a completion', async () => {
    mockCourse(
      courseWith([
        {
          id: 'e-image',
          kind: 'chooseImage',
          prompt: 'Which one is it?',
          options: ['नमस्ते', 'धन्यवाद'],
          answerIndex: 0,
        },
      ]),
    );
    await render(<Lesson />);

    expect(
      await screen.findByText("This exercise type isn't available in the mobile app yet."),
    ).toBeTruthy();
    expect(screen.queryByText('Check')).toBeNull();
    expect(screen.getByText('Back to lessons')).toBeTruthy();
    expect(completionPosts()).toHaveLength(0);
    expect(screen.queryByText('Lesson complete!')).toBeNull();
  });

  it('plays the newly supported kinds end to end', async () => {
    // 401 fallback: the app awards device XP from core's per-kind table
    // (wordBank 3, arrangeSentence 4, typeWhatYouHear 4, speak 5).
    mockedFetch.mockImplementation(async (path: string) => {
      if (path === '/api/courses/hi-starter') {
        return reply(
          200,
          courseWith([
            {
              id: 'e-wordbank',
              kind: 'wordBank',
              prompt: 'Build this phrase',
              words: ['मैं', 'हूँ', 'ठीक'],
              answer: ['मैं', 'ठीक', 'हूँ'],
            },
            {
              id: 'e-arrange',
              kind: 'arrangeSentence',
              prompt: 'Arrange the words',
              tiles: ['किताब', 'यह', 'है'],
              answer: ['यह', 'किताब', 'है'],
            },
            {
              id: 'e-twyh',
              kind: 'typeWhatYouHear',
              prompt: 'Write what you hear',
              expected: ['नमस्ते'],
            },
            {
              id: 'e-speak',
              kind: 'speak',
              prompt: 'Say the phrase',
              expected: ['धन्यवाद'],
              softScore: true,
            },
          ]),
        );
      }
      if (path === '/api/lesson-completions') return reply(401, { error: 'Unauthorized' });
      throw new Error(`Unexpected request: ${path}`);
    });

    await render(<Lesson />);
    expect(await screen.findByText('Question 1 of 4')).toBeTruthy();
    expect(screen.getAllByText('BUILD THE TRANSLATION').length).toBeGreaterThan(0);

    // wordBank — tap the words in answer order.
    await fireEvent.press(screen.getByText('मैं'));
    await fireEvent.press(screen.getByText('ठीक'));
    await fireEvent.press(screen.getByText('हूँ'));
    await fireEvent.press(screen.getByText('Check'));
    expect(await screen.findByText('Correct!')).toBeTruthy();
    await fireEvent.press(screen.getByText('Continue'));

    // arrangeSentence — tap the tiles in answer order.
    expect(await screen.findByText('Question 2 of 4')).toBeTruthy();
    expect(screen.getAllByText('ARRANGE THE SENTENCE').length).toBeGreaterThan(0);
    await fireEvent.press(screen.getByText('यह'));
    await fireEvent.press(screen.getByText('किताब'));
    await fireEvent.press(screen.getByText('है'));
    await fireEvent.press(screen.getByText('Check'));
    expect(await screen.findByText('Correct!')).toBeTruthy();
    await fireEvent.press(screen.getByText('Continue'));

    // typeWhatYouHear — honest degrade: no audio, the phrase is shown.
    expect(await screen.findByText('Question 3 of 4')).toBeTruthy();
    expect(
      screen.getByText('Audio is not available on this build — the phrase is shown.'),
    ).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Type what you hear'), 'नमस्ते');
    await fireEvent.press(screen.getByText('Check'));
    expect(await screen.findByText('Correct!')).toBeTruthy();
    await fireEvent.press(screen.getByText('Continue'));

    // speak — fallback-only: the learner types what they said, no mic.
    expect(await screen.findByText('Question 4 of 4')).toBeTruthy();
    expect(screen.getByText('I said it out loud')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Type what you said'), 'धन्यवाद');
    await fireEvent.press(screen.getByText('Check'));
    expect(await screen.findByText('Correct!')).toBeTruthy();
    await fireEvent.press(screen.getByText('See results'));

    expect(await screen.findByText('100% accuracy')).toBeTruthy();
    expect(screen.getByText('4 of 4 correct')).toBeTruthy();
    // 10 lesson bonus + 3 + 4 + 4 + 5 exercise XP, saved on this device (401 fallback).
    expect(await screen.findByText('+26 XP saved on this device')).toBeTruthy();

    const posts = completionPosts();
    expect(posts).toHaveLength(1);
    const body = JSON.parse(String(posts[0]![1]?.body));
    expect(
      body.answers.map((answer: { input: { kind: string } }) => answer.input.kind),
    ).toEqual(['tokens', 'tokens', 'text', 'speak']);
  });

  it('falls back to device progress when the server rejects as unauthenticated', async () => {
    mockedFetch.mockImplementation(async (path: string) => {
      if (path === '/api/courses/hi-starter') {
        return reply(
          200,
          courseWith([fiveExercises[0], fiveExercises[1]], 10),
        );
      }
      if (path === '/api/lesson-completions') return reply(401, { error: 'Unauthorized' });
      throw new Error(`Unexpected request: ${path}`);
    });

    await render(<Lesson />);
    expect(await screen.findByText('Question 1 of 2')).toBeTruthy();
    await fireEvent.press(screen.getByText('Hello'));
    await fireEvent.press(screen.getByText('Check'));
    await fireEvent.press(await screen.findByText('Continue'));
    await fireEvent.press(await screen.findByText('ठीक'));
    await fireEvent.press(screen.getByText('Check'));
    await fireEvent.press(await screen.findByText('See results'));

    // Lesson bonus 10 + two correct choice exercises at 2 XP each.
    expect(await screen.findByText('+14 XP saved on this device')).toBeTruthy();
    expect(
      screen.getByText('Sign in to earn verified XP and gems that sync across devices.'),
    ).toBeTruthy();

    const stored = await AsyncStorage.getItem('speeko.mobile.progress.v2');
    expect(stored).toBeTruthy();
    expect(JSON.parse(String(stored)).completed['hi-starter:greetings']).toBeTruthy();
  });

  it('ends the attempt with no reward when hearts run out', async () => {
    // All five eligible items; five wrong answers deplete all hearts.
    mockCourse(courseWith(fiveExercisesWithAudio));
    await render(<Lesson />);
    expect(await screen.findByText('Question 1 of 5')).toBeTruthy();

    const wrongAnswers = ['Thank you', 'किताब', 'पानी'];
    for (let index = 0; index < 3; index += 1) {
      await fireEvent.press(screen.getByText(wrongAnswers[index]!));
      await fireEvent.press(screen.getByText('Check'));
      expect(await screen.findByText('Not quite')).toBeTruthy();
      await fireEvent.press(screen.getByText('Continue'));
    }

    await fireEvent.changeText(screen.getByLabelText('Translation answer'), 'गलत');
    await fireEvent.press(screen.getByText('Check'));
    expect(await screen.findByText('Not quite')).toBeTruthy();
    await fireEvent.press(screen.getByText('Continue'));

    // Deliberately mismatch one pair first, then finish matching them all.
    // The mismatch is what makes the exercise incorrect.
    await fireEvent.press(screen.getByText('एक'));
    await fireEvent.press(screen.getByText('two'));
    await fireEvent.press(screen.getByText('एक'));
    await fireEvent.press(screen.getByText('one'));
    await fireEvent.press(screen.getByText('दो'));
    await fireEvent.press(screen.getByText('two'));
    expect(screen.getByText('Matched 2 / 2 · Mismatches 1')).toBeTruthy();
    await fireEvent.press(screen.getByText('Check'));
    expect(await screen.findByText('Not quite')).toBeTruthy();
    await fireEvent.press(screen.getByText('See result'));

    expect(await screen.findByText('Out of hearts')).toBeTruthy();
    expect(screen.getByText(/awarded no XP/)).toBeTruthy();
    expect(completionPosts()).toHaveLength(0);
    expect(screen.queryByText('Lesson complete!')).toBeNull();
  });

  it('shows a retry state after a server failure and only claims XP once it saves', async () => {
    let attempts = 0;
    mockedFetch.mockImplementation(async (path: string) => {
      if (path === '/api/courses/hi-starter') {
        return reply(200, courseWith([fiveExercises[0]], 10));
      }
      if (path === '/api/lesson-completions') {
        attempts += 1;
        if (attempts === 1) return reply(500, { error: 'Database unavailable.' });
        return reply(200, { event: { xp: 12 } });
      }
      throw new Error(`Unexpected request: ${path}`);
    });

    await render(<Lesson />);
    expect(await screen.findByText('Question 1 of 1')).toBeTruthy();
    await fireEvent.press(screen.getByText('Hello'));
    await fireEvent.press(screen.getByText('Check'));
    await fireEvent.press(await screen.findByText('See results'));

    expect(
      await screen.findByText('The lesson is finished, but your reward wasn\'t saved.'),
    ).toBeTruthy();
    expect(screen.queryByText(/XP saved to your account/)).toBeNull();

    await fireEvent.press(screen.getByText('Try saving again'));
    expect(await screen.findByText('+12 XP saved to your account')).toBeTruthy();
    expect(attempts).toBe(2);
  });
});
