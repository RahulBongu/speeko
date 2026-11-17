import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen } from '@testing-library/react-native';
import {
  buildHabitReport,
  dayKeyInTimeZone,
  emptyProgress,
  historyFromActivity,
  type HabitReport,
  type ProgressState,
} from '@speeko/core';

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

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
}));

jest.mock('../lib/api', () => ({
  apiFetch: jest.fn(),
  getCookie: jest.fn(),
}));

import { apiFetch, getCookie } from '../lib/api';
import Habits from '../app/habits';
import { saveProgress } from '../lib/progress';

const mockedFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;
const mockedCookie = getCookie as jest.MockedFunction<typeof getCookie>;

function reply(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

function localProgress(): ProgressState {
  const progress = emptyProgress();
  const today = dayKeyInTimeZone(new Date(), 'Asia/Kolkata');
  progress.timeZone = 'Asia/Kolkata';
  progress.dailyGoal = 20;
  progress.xp = 30;
  progress.activity[today] = { xp: 30, lessons: 1 };
  return progress;
}

function report(goal: number): HabitReport {
  const progress = localProgress();
  const today = dayKeyInTimeZone(new Date(), 'Asia/Kolkata');
  return buildHabitReport(historyFromActivity(progress.activity), {
    asOfDay: today,
    timeZone: 'Asia/Kolkata',
    dailyGoal: goal,
    lifetimeXp: 30,
    lifetimeLessons: 1,
  });
}

describe('mobile habits', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    mockedFetch.mockReset();
    mockedCookie.mockReset();
  });

  it('labels a guest report as device-only and derives it from local activity', async () => {
    await saveProgress(localProgress());
    mockedFetch.mockResolvedValue(reply(401, { error: 'Unauthorized' }));
    mockedCookie.mockResolvedValue(null);

    await render(<Habits />);

    expect(await screen.findByText('This device only')).toBeTruthy();
    expect(screen.getByText("TODAY'S XP")).toBeTruthy();
    expect(screen.getAllByLabelText(/30 XP, 1 lesson/).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/This report uses only activity saved on this device/),
    ).toBeTruthy();
  });

  it('shows the verified server report without pretending it is local', async () => {
    await saveProgress(localProgress());
    mockedFetch.mockResolvedValue(reply(200, { habits: report(20) }));

    await render(<Habits />);

    expect(await screen.findByText('Verified server history')).toBeTruthy();
    expect(screen.getAllByLabelText(/30 XP, 1 lesson/).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Quests, streaks, and the calendar are derived from verified lesson events/),
    ).toBeTruthy();
  });

  it('saves a goal change locally and to the signed-in account', async () => {
    await saveProgress(localProgress());
    let habitsCalls = 0;
    mockedFetch.mockImplementation(async (path: string, init?: RequestInit) => {
      if (path === '/api/habits') {
        habitsCalls += 1;
        return reply(200, { habits: report(habitsCalls === 1 ? 20 : 30) });
      }
      if (path === '/api/progress' && init?.method === 'PUT') {
        const body = JSON.parse(String(init.body)) as { progress: ProgressState };
        return reply(200, { progress: body.progress });
      }
      throw new Error(`Unexpected request: ${init?.method ?? 'GET'} ${path}`);
    });

    await render(<Habits />);
    expect(await screen.findByText('Verified server history')).toBeTruthy();
    // The streak/XP pills in the app bar also render "30", so target the goal
    // option by its combined accessible name.
    await fireEvent.press(screen.getByRole('button', { name: '30 XP' }));

    expect(await screen.findByText('Goal saved and synced.')).toBeTruthy();
    const put = mockedFetch.mock.calls.find(
      ([path, init]) => path === '/api/progress' && init?.method === 'PUT',
    );
    expect(JSON.parse(String(put?.[1]?.body)).progress.dailyGoal).toBe(30);
    const stored = JSON.parse(
      String(await AsyncStorage.getItem('speeko.mobile.progress.v2')),
    ) as ProgressState;
    expect(stored.dailyGoal).toBe(30);
    expect(habitsCalls).toBe(2);
  });

  it('fails closed when a previously signed-in session cannot reach the server', async () => {
    await saveProgress(localProgress());
    mockedCookie.mockResolvedValue('session=abc');
    mockedFetch.mockRejectedValue(new Error('Network unavailable.'));

    await render(<Habits />);

    expect(await screen.findByText('Habits could not load')).toBeTruthy();
    expect(screen.getByText('Network unavailable.')).toBeTruthy();
    expect(screen.queryByText('This device only')).toBeNull();
  });
});
