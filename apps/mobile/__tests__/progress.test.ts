import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearProgress, loadProgress, saveProgress } from '../lib/progress';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockedStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('mobile progress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty progress when nothing is stored', async () => {
    mockedStorage.getItem.mockResolvedValue(null);
    const progress = await loadProgress();
    expect(progress.version).toBe(2);
    expect(progress.xp).toBe(0);
  });

  it('returns empty progress instead of crashing on corrupt JSON', async () => {
    mockedStorage.getItem.mockResolvedValue('{not json');
    const progress = await loadProgress();
    expect(progress.version).toBe(2);
    expect(progress.completed).toEqual({});
  });

  it('saves progress as JSON', async () => {
    const progress = await loadProgress();
    await saveProgress(progress);
    expect(mockedStorage.setItem).toHaveBeenCalledWith(
      'speeko.mobile.progress.v2',
      expect.any(String),
    );
  });

  it('clears the canonical device snapshot on sign-out', async () => {
    await clearProgress();
    expect(mockedStorage.removeItem).toHaveBeenCalledWith('speeko.mobile.progress.v2');
  });
});
