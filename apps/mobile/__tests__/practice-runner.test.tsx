import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { emptyProgress, type ProgressState } from '@speeko/core';

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
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ courseId: 'hi-starter' }),
  useRouter: () => ({ back: mockBack, push: jest.fn(), replace: jest.fn() }),
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
  playMascotVoice: jest.fn(async () => true),
  stopMascotVoice: jest.fn(async () => {}),
}));

jest.mock('../lib/sync', () => ({
  syncProgress: jest.fn(async () => ({ progress: null, signedIn: false })),
  syncProgressIfSignedIn: jest.fn(async () => ({ progress: null, signedIn: false, synced: false })),
}));

import { apiFetch } from '../lib/api';
import PracticeRunner from '../app/practice/[courseId]';
import { loadProgress, saveProgress } from '../lib/progress';
import { syncProgressIfSignedIn } from '../lib/sync';

const mockedFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;
const mockedSync = syncProgressIfSignedIn as jest.MockedFunction<typeof syncProgressIfSignedIn>;

function reply(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

const chooseExercise = {
  id: 'e-choose',
  kind: 'chooseMeaning',
  prompt: 'Choose the meaning of नमस्ते',
  options: ['नमस्ते', 'धन्यवाद'],
  answerIndex: 0,
};

const course = {
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
          xpReward: 10,
          reviewStatus: 'draft',
          exercises: [chooseExercise],
        },
      ],
    },
  ],
};

function progressWithCard(dueAt: number): ProgressState {
  const progress = emptyProgress(new Date('2026-11-16T10:00:00Z'));
  progress.completed['hi-starter:greetings'] = {
    courseId: 'hi-starter',
    lessonId: 'greetings',
    xp: 12,
    accuracy: 1,
    completedAt: '2026-11-16T10:00:00.000Z',
  };
  progress.srs['hi:नमस्ते'] = {
    skillId: 'hi:नमस्ते',
    box: 1,
    dueAt,
    lapses: 0,
  };
  return progress;
}

describe('mobile practice runner', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    mockedFetch.mockReset();
  });

  it('reviews only due cards and never claims XP', async () => {
    mockedFetch.mockResolvedValue(reply(200, course));
    await saveProgress(progressWithCard(Date.now() - 60_000));

    await render(<PracticeRunner />);

    expect(await screen.findByText('Card 1 of 1')).toBeTruthy();
    expect(screen.getByText('Practice · no XP')).toBeTruthy();
    await fireEvent.press(screen.getByText('नमस्ते'));
    await fireEvent.press(screen.getByText('Check'));
    expect(await screen.findByText('Correct!')).toBeTruthy();
    await fireEvent.press(screen.getByText('See results'));

    expect(await screen.findByText('Review complete!')).toBeTruthy();
    expect(screen.getByText('1 of 1 correct')).toBeTruthy();
    expect(screen.getByText(/No XP is awarded in practice/)).toBeTruthy();
    expect(await screen.findByText('Review schedule saved on this device')).toBeTruthy();

    // Practice must never post a lesson completion.
    expect(
      mockedFetch.mock.calls.some(([path]) => path === '/api/lesson-completions'),
    ).toBe(false);

    // The stored card moved from box 1 to box 2 and was rescheduled ahead.
    const raw = await AsyncStorage.getItem('speeko.mobile.progress.v2');
    const stored = JSON.parse(String(raw)) as ProgressState;
    expect(stored.srs['hi:नमस्ते']?.box).toBe(2);
    expect(stored.srs['hi:नमस्ते']?.dueAt).toBeGreaterThan(Date.now());
    expect(stored.xp).toBe(0);
  });

  it('explains that practice unlocks after the first lesson', async () => {
    mockedFetch.mockResolvedValue(reply(200, course));
    await saveProgress(emptyProgress());

    await render(<PracticeRunner />);

    expect(
      await screen.findByText(
        'Finish a lesson first. Practice only reviews words you have already learned.',
      ),
    ).toBeTruthy();
  });

  it('does not invent a review when nothing is due yet', async () => {
    mockedFetch.mockResolvedValue(reply(200, course));
    await saveProgress(progressWithCard(Date.now() + 3 * 86_400_000));

    await render(<PracticeRunner />);

    expect(await screen.findByText('Nothing to review')).toBeTruthy();
    expect(screen.getByText(/Next review in 3 days/)).toBeTruthy();
  });

  it('shows a retry state when the review schedule cannot be saved', async () => {
    mockedFetch.mockResolvedValue(reply(200, course));
    await saveProgress(progressWithCard(Date.now() - 60_000));
    const storage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
    storage.setItem.mockRejectedValueOnce(new Error('disk full'));

    await render(<PracticeRunner />);
    expect(await screen.findByText('Card 1 of 1')).toBeTruthy();
    await fireEvent.press(screen.getByText('नमस्ते'));
    await fireEvent.press(screen.getByText('Check'));
    await fireEvent.press(await screen.findByText('See results'));

    expect(
      await screen.findByText(
        'Your answers were graded, but the review schedule could not be saved.',
      ),
    ).toBeTruthy();
    expect(screen.queryByText('Review schedule saved on this device')).toBeNull();

    await fireEvent.press(screen.getByText('Try saving again'));
    expect(await screen.findByText('Review schedule saved on this device')).toBeTruthy();
  });

  it('pushes the review schedule to the signed-in account after saving', async () => {
    mockedFetch.mockResolvedValue(reply(200, course));
    mockedSync.mockImplementation(async () => ({ progress: await loadProgress(), signedIn: true, synced: true }));
    await saveProgress(progressWithCard(Date.now() - 60_000));

    await render(<PracticeRunner />);
    expect(await screen.findByText('Card 1 of 1')).toBeTruthy();
    await fireEvent.press(screen.getByText("नमस्ते"));
    await fireEvent.press(screen.getByText('Check'));
    expect(await screen.findByText('Correct!')).toBeTruthy();
    await fireEvent.press(screen.getByText('See results'));

    expect(await screen.findByText('Review complete!')).toBeTruthy();
    expect(await screen.findByText('Review schedule saved on this device')).toBeTruthy();
    expect(mockedSync).toHaveBeenCalled();
  });

  it('keeps the local schedule when account sync fails', async () => {
    mockedFetch.mockResolvedValue(reply(200, course));
    mockedSync.mockRejectedValue(new Error('offline'));
    await saveProgress(progressWithCard(Date.now() - 60_000));

    await render(<PracticeRunner />);
    expect(await screen.findByText('Card 1 of 1')).toBeTruthy();
    await fireEvent.press(screen.getByText("नमस्ते"));
    await fireEvent.press(screen.getByText('Check'));
    await fireEvent.press(await screen.findByText('See results'));

    expect(await screen.findByText('Review complete!')).toBeTruthy();
    expect(await screen.findByText('Review schedule saved on this device')).toBeTruthy();
  });

});
