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

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: mockReplace }),
}));

jest.mock('../lib/api', () => ({
  apiFetch: jest.fn(),
  setCookie: jest.fn(),
  ORIGIN: 'http://localhost:3000',
}));
jest.mock('../lib/sync', () => ({
  syncProgress: jest.fn(),
}));

import { apiFetch, setCookie } from '../lib/api';
import { syncProgress } from '../lib/sync';
import Account from '../app/account';
import { saveProgress } from '../lib/progress';

const mockedFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;
const mockedSync = syncProgress as jest.MockedFunction<typeof syncProgress>;
const mockedSetCookie = setCookie as jest.MockedFunction<typeof setCookie>;

function reply(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

function accountProgress(): ProgressState {
  const progress = emptyProgress();
  progress.xp = 120;
  progress.streak = 3;
  progress.completed['hi-starter:greetings'] = {
    courseId: 'hi-starter',
    lessonId: 'greetings',
    xp: 20,
    accuracy: 1,
    completedAt: '2026-11-16T10:00:00.000Z',
  };
  return progress;
}

describe('mobile account', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    mockedFetch.mockReset();
    mockedSync.mockReset();
    mockedSetCookie.mockReset();
  });

  it('shows verified event-derived progress for a signed-in learner', async () => {
    mockedFetch.mockImplementation(async (path: string) => {
      if (path === '/api/auth/get-session') {
        return reply(200, { user: { email: 'learner@example.com' } });
      }
      if (path === '/api/habits') {
        return reply(200, {
          habits: {
            dailyGoal: 30,
            totals: { xp: 42, lessons: 2 },
            streak: { current: 7 },
          },
        });
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    mockedSync.mockResolvedValue({ progress: accountProgress(), signedIn: true });

    await render(<Account />);

    expect(await screen.findByText('learner@example.com')).toBeTruthy();
    // Verified numbers come from events, not from the local snapshot (XP 120).
    expect(screen.getByText('Verified account progress')).toBeTruthy();
    expect(screen.getByText('XP: 42')).toBeTruthy();
    expect(screen.getByText('Streak: 7 days')).toBeTruthy();
    expect(screen.getByText('Lessons completed: 2')).toBeTruthy();
    expect(screen.getByText('Sign out and clear this device')).toBeTruthy();
  });

  it('labels local numbers as device-only when verified sync fails', async () => {
    mockedFetch.mockImplementation(async (path: string) => {
      if (path === '/api/auth/get-session') {
        return reply(200, { user: { email: 'learner@example.com' } });
      }
      if (path === '/api/habits') return reply(500, { error: 'Server unavailable.' });
      throw new Error(`Unexpected request: ${path}`);
    });
    mockedSync.mockResolvedValue({ progress: accountProgress(), signedIn: true });

    await render(<Account />);

    expect(await screen.findByText('Account sync could not be reached.')).toBeTruthy();
    expect(screen.getByText('Device progress')).toBeTruthy();
    expect(screen.getByText('XP: 120')).toBeTruthy();
    expect(screen.queryByText('Verified account progress')).toBeNull();
  });

  it('shows device progress to a guest without calling the merge', async () => {
    await saveProgress(accountProgress());
    mockedFetch.mockResolvedValue(reply(200, { user: null }));

    await render(<Account />);

    expect(await screen.findByText('Not signed in · this device only')).toBeTruthy();
    expect(screen.getByText('Device progress')).toBeTruthy();
    expect(screen.getByText('XP: 120')).toBeTruthy();
    expect(screen.getByText('Sign in')).toBeTruthy();
    expect(mockedSync).not.toHaveBeenCalled();
  });

  it('clears both the session cookie and device progress on sign-out', async () => {
    await saveProgress(accountProgress());
    mockedFetch.mockImplementation(async (path: string) => {
      if (path === '/api/auth/get-session') {
        return reply(200, { user: { email: 'learner@example.com' } });
      }
      if (path === '/api/auth/sign-out') return reply(200, {});
      throw new Error(`Unexpected request: ${path}`);
    });
    mockedSync.mockResolvedValue({ progress: accountProgress(), signedIn: true });

    await render(<Account />);
    expect(await screen.findByText('learner@example.com')).toBeTruthy();
    await fireEvent.press(screen.getByText('Sign out and clear this device'));

    expect(mockedSetCookie).toHaveBeenCalledWith(null);
    expect(await AsyncStorage.getItem('speeko.mobile.progress.v2')).toBeNull();
    expect(screen.getByText('Device progress')).toBeTruthy();
    expect(screen.getByText('XP: 0')).toBeTruthy();
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('does not clear anything when the sign-out request fails', async () => {
    await saveProgress(accountProgress());
    mockedFetch.mockImplementation(async (path: string) => {
      if (path === '/api/auth/get-session') {
        return reply(200, { user: { email: 'learner@example.com' } });
      }
      if (path === '/api/auth/sign-out') return reply(500, { error: 'Server unavailable.' });
      throw new Error(`Unexpected request: ${path}`);
    });
    mockedSync.mockResolvedValue({ progress: accountProgress(), signedIn: true });

    await render(<Account />);
    expect(await screen.findByText('learner@example.com')).toBeTruthy();
    await fireEvent.press(screen.getByText('Sign out and clear this device'));

    expect(await screen.findByText(/Sign out failed \(500\)/)).toBeTruthy();
    expect(mockedSetCookie).not.toHaveBeenCalled();
    expect(await AsyncStorage.getItem('speeko.mobile.progress.v2')).not.toBeNull();
  });
});
