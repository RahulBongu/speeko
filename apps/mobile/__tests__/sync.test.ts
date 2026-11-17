import { emptyProgress, mergeProgress, type ProgressState } from '@speeko/core';

jest.mock('../lib/api', () => ({ apiFetch: jest.fn() }));
jest.mock('../lib/progress', () => ({
  loadProgress: jest.fn(),
  saveProgress: jest.fn(),
}));

// Imported after the mocks so the module picks them up.
import { apiFetch } from '../lib/api';
import { loadProgress, saveProgress } from '../lib/progress';
import { syncProgress } from '../lib/sync';

const mockedFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;
const mockedLoad = loadProgress as jest.MockedFunction<typeof loadProgress>;
const mockedSave = saveProgress as jest.MockedFunction<typeof saveProgress>;

function localWithOneLesson(): ProgressState {
  const progress = emptyProgress(new Date('2026-11-16T10:00:00Z'));
  progress.xp = 40;
  progress.completed['hi-starter:greetings'] = {
    courseId: 'hi-starter',
    lessonId: 'greetings',
    xp: 30,
    accuracy: 1,
    completedAt: '2026-11-16T10:00:00.000Z',
  };
  progress.activity['2026-11-16'] = { xp: 40, lessons: 1 };
  return progress;
}

function response(status: number, body: unknown = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe('mobile progress sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedSave.mockResolvedValue(undefined);
  });

  it('returns the device snapshot for a guest without pushing', async () => {
    const local = localWithOneLesson();
    mockedLoad.mockResolvedValue(local);
    mockedFetch.mockResolvedValue(response(401));

    const result = await syncProgress();

    expect(result.signedIn).toBe(false);
    expect(result.progress).toBe(local);
    expect(mockedFetch).toHaveBeenCalledTimes(1);
  });

  it('pushes the device snapshot when the account has no progress yet', async () => {
    const local = localWithOneLesson();
    mockedLoad.mockResolvedValue(local);
    mockedFetch
      .mockResolvedValueOnce(response(200, { progress: null }))
      .mockResolvedValueOnce(response(200, { progress: local }));

    const result = await syncProgress();

    expect(result.signedIn).toBe(true);
    expect(mockedFetch).toHaveBeenNthCalledWith(
      2,
      '/api/progress',
      expect.objectContaining({ method: 'PUT' }),
    );
    expect(mockedSave).toHaveBeenCalledWith(local);
  });

  it('unions local and cloud lessons, then pushes only when they differ', async () => {
    const local = localWithOneLesson();
    const remote = emptyProgress(new Date('2026-11-15T10:00:00Z'));
    remote.xp = 10;
    remote.completed['hi-starter:basics'] = {
      courseId: 'hi-starter',
      lessonId: 'basics',
      xp: 10,
      accuracy: 1,
      completedAt: '2026-11-15T10:00:00.000Z',
    };
    const merged = mergeProgress(remote, local);

    mockedLoad.mockResolvedValue(local);
    mockedFetch
      .mockResolvedValueOnce(response(200, { progress: remote }))
      .mockResolvedValueOnce(response(200, { progress: merged }));

    const result = await syncProgress();

    expect(result.signedIn).toBe(true);
    expect(mockedFetch).toHaveBeenCalledTimes(2);
    expect(mockedSave).toHaveBeenCalledWith(merged);
    expect(Object.keys(result.progress.completed).sort()).toEqual([
      'hi-starter:basics',
      'hi-starter:greetings',
    ]);
  });

  it('does not push when the device and cloud copies already match', async () => {
    const local = localWithOneLesson();
    const remote = mergeProgress(local, local);
    mockedLoad.mockResolvedValue(local);
    mockedFetch.mockResolvedValueOnce(response(200, { progress: remote }));

    const result = await syncProgress();

    expect(result.progress).toEqual(remote);
    expect(mockedFetch).toHaveBeenCalledTimes(1);
  });

  it('keeps an explicit device cosmetic over the cloud choice', async () => {
    const local = localWithOneLesson();
    local.equippedCosmetic = 'scarf';
    const remote = mergeProgress(local, local);
    remote.equippedCosmetic = 'hat';

    mockedLoad.mockResolvedValue(local);
    mockedFetch.mockImplementation(async (path, init) => {
      if (init?.method === 'PUT') {
        const body = JSON.parse(String(init.body)) as { progress: ProgressState };
        return response(200, { progress: body.progress });
      }
      return response(200, { progress: remote });
    });

    const result = await syncProgress();

    expect(result.progress.equippedCosmetic).toBe('scarf');
    const pushed = mockedFetch.mock.calls.find(([, init]) => init?.method === 'PUT');
    expect(pushed).toBeTruthy();
    expect(JSON.parse(String(pushed?.[1]?.body)).progress.equippedCosmetic).toBe('scarf');
  });

  it('falls back to the cloud cosmetic when the device has none', async () => {
    const local = localWithOneLesson();
    local.equippedCosmetic = null;
    const remote = mergeProgress(local, local);
    remote.equippedCosmetic = 'hat';

    mockedLoad.mockResolvedValue(local);
    mockedFetch.mockResolvedValueOnce(response(200, { progress: remote }));

    const result = await syncProgress();

    expect(result.progress.equippedCosmetic).toBe('hat');
  });

  it('throws instead of pretending a rejected push succeeded', async () => {
    mockedLoad.mockResolvedValue(localWithOneLesson());
    mockedFetch
      .mockResolvedValueOnce(response(200, { progress: null }))
      .mockResolvedValueOnce(response(409, { error: 'You do not own this cosmetic.' }));

    await expect(syncProgress()).rejects.toThrow(/409/);
  });
});
