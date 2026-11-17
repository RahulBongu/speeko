import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { INDIAN_LOCALES, LOCALE_LABEL, browserTimeZone } from '@speeko/core';

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

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
}));

jest.mock('../lib/api', () => ({
  apiFetch: jest.fn(),
  getCookie: jest.fn(),
}));

import { apiFetch } from '../lib/api';
import {
  ONBOARDING_KEY,
  completeOnboarding,
  readCompletedOnboarding,
  readOnboardingDraft,
  saveOnboardingDraft,
} from '../lib/onboarding';
import { ENGLISH } from '../lib/locale-meta';
import LanguageStep from '../app/onboarding/language';
import MotivationStep from '../app/onboarding/motivation';
import CommitmentStep from '../app/onboarding/commitment';

const mockedFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

function reply(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

const STARTER_MANIFEST = [
  ...INDIAN_LOCALES.map((locale) => ({
    id: `${locale}-starter`,
    locale,
    title: `${ENGLISH[locale]} starter`,
    difficulty: 'beginner',
    units: 1,
    lessons: 12,
    exercises: 60,
  })),
  {
    id: 'hi-pilot',
    locale: 'hi',
    title: 'Hindi pilot',
    difficulty: 'intermediate',
    units: 1,
    lessons: 8,
    exercises: 40,
  },
];

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  mockedFetch.mockReset();
});

describe('onboarding lib', () => {
  it('reads null when nothing is stored', async () => {
    expect(await readOnboardingDraft()).toBeNull();
    expect(await readCompletedOnboarding()).toBeNull();
  });

  it('round-trips a saved draft', async () => {
    await saveOnboardingDraft({ locale: 'bn', motivation: 'fun' });
    expect(await readOnboardingDraft()).toEqual({ locale: 'bn', motivation: 'fun' });
  });

  it('reads null for corrupt JSON', async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, '{not json');
    expect(await readOnboardingDraft()).toBeNull();
    expect(await readCompletedOnboarding()).toBeNull();
  });

  it('rejects locales outside the Indian course list', async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify({ locale: 'xx' }));
    expect(await readOnboardingDraft()).toBeNull();

    await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify({ locale: 'en' }));
    expect(await readOnboardingDraft()).toBeNull();
  });

  it('clamps tiny daily goals to 10 and floors fractional ones', async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify({ locale: 'bn', dailyGoal: 5 }));
    expect((await readOnboardingDraft())?.dailyGoal).toBe(10);

    await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify({ locale: 'bn', dailyGoal: 42.9 }));
    expect((await readOnboardingDraft())?.dailyGoal).toBe(42);
  });

  it('completeOnboarding writes completedAt and hides the draft', async () => {
    const completed = await completeOnboarding({
      locale: 'bn',
      motivation: 'fun',
      level: 'zero',
      dailyGoal: 50,
      commitment: 'daily',
    });
    expect(typeof completed.completedAt).toBe('string');

    expect(await readOnboardingDraft()).toBeNull();
    const stored = await readCompletedOnboarding();
    expect(stored).toMatchObject({
      locale: 'bn',
      motivation: 'fun',
      level: 'zero',
      dailyGoal: 50,
      commitment: 'daily',
    });
    expect(typeof stored?.completedAt).toBe('string');
  });

  it('fills defaults for missing fields when read as completed', async () => {
    await AsyncStorage.setItem(
      ONBOARDING_KEY,
      JSON.stringify({ locale: 'bn', completedAt: '2026-11-01T10:00:00.000Z' }),
    );
    expect(await readCompletedOnboarding()).toEqual({
      locale: 'bn',
      motivation: 'Just for fun',
      level: 'beginner',
      dailyGoal: 50,
      commitment: 'daily',
      completedAt: '2026-11-01T10:00:00.000Z',
    });
    expect(await readOnboardingDraft()).toBeNull();
  });
});

describe('language step', () => {
  it('renders the ten starter courses and not the pilot, then saves a draft on pick', async () => {
    mockedFetch.mockResolvedValue(reply(200, STARTER_MANIFEST));

    await render(<LanguageStep />);

    expect(await screen.findByText('Bengali')).toBeTruthy();
    for (const locale of INDIAN_LOCALES) {
      expect(screen.getByText(ENGLISH[locale])).toBeTruthy();
      expect(screen.getByText(LOCALE_LABEL[locale])).toBeTruthy();
    }
    // hi-pilot is filtered out: Hindi appears exactly once, as the starter.
    expect(screen.getAllByRole('button', { name: 'Hindi' })).toHaveLength(1);
    expect(screen.queryByText('Hindi pilot')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Bengali' }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/onboarding/motivation'));
    const stored = await AsyncStorage.getItem(ONBOARDING_KEY);
    expect(JSON.parse(String(stored))).toEqual({ locale: 'bn' });
  });
});

describe('commitment step', () => {
  it('completes onboarding, snapshots progress, and starts the first lesson', async () => {
    await saveOnboardingDraft({ locale: 'bn', motivation: 'fun', level: 'zero', dailyGoal: 50 });

    await render(<CommitmentStep />);

    await fireEvent.press(await screen.findByRole('button', { name: 'Every day' }));

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/lesson/bn-starter/bn-starter-u1-l1'),
    );

    const raw = await AsyncStorage.getItem('speeko.mobile.progress.v2');
    const progress = JSON.parse(String(raw)) as {
      dailyGoal: number;
      lastCourseId: string | null;
      timeZone: string | null;
    };
    expect(progress.dailyGoal).toBe(50);
    expect(progress.lastCourseId).toBe('bn-starter');
    expect(progress.timeZone).toBe(browserTimeZone());

    const completed = await readCompletedOnboarding();
    expect(completed).toMatchObject({
      locale: 'bn',
      motivation: 'fun',
      level: 'zero',
      dailyGoal: 50,
      commitment: 'daily',
    });
    expect(await readOnboardingDraft()).toBeNull();
  });
});

describe('onboarding guards', () => {
  it('motivation redirects to language when no draft exists', async () => {
    await render(<MotivationStep />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/onboarding/language'));
  });
});
