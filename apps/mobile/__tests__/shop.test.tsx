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

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn() }),
}));

jest.mock('../lib/api', () => ({
  apiFetch: jest.fn(),
  ORIGIN: 'http://localhost:3000',
}));
jest.mock('../lib/sync', () => ({
  syncProgress: jest.fn(),
}));

import { apiFetch } from '../lib/api';
import { syncProgress } from '../lib/sync';
import Shop from '../app/shop';
import { loadProgress, saveProgress } from '../lib/progress';

const mockedFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;
const mockedSync = syncProgress as jest.MockedFunction<typeof syncProgress>;

function reply(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

function shopState(owned: boolean) {
  return {
    balance: owned ? 4 : 10,
    freezeCredits: 0,
    items: [
      {
        id: 'fox-scarf',
        name: 'Fox scarf',
        description: 'A tiny scarf for the fox.',
        price: 6,
        kind: 'cosmetic',
        cosmeticId: 'scarf',
        owned,
        quantity: owned ? 1 : 0,
        canAfford: !owned,
      },
      {
        id: 'streak-freeze',
        name: 'Streak freeze',
        description: 'Covers one missed day.',
        price: 4,
        kind: 'freeze',
        owned: false,
        quantity: 0,
        canAfford: false,
      },
    ],
  };
}

describe('mobile shop', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    mockedFetch.mockReset();
    mockedSync.mockReset();
  });

  it('asks a guest to sign in instead of faking a balance', async () => {
    mockedFetch.mockResolvedValue(reply(401, { error: 'Unauthorized' }));
    mockedSync.mockResolvedValue({ progress: emptyProgress(), signedIn: false });

    await render(<Shop />);

    expect(await screen.findByText('The shop needs an account')).toBeTruthy();
    await fireEvent.press(screen.getByText('Sign in'));
    expect(mockPush).toHaveBeenCalledWith('/sign-in');
  });

  it('purchases an item and refreshes ownership from the server', async () => {
    mockedSync.mockResolvedValue({ progress: emptyProgress(), signedIn: true });
    let shop = shopState(false);
    mockedFetch.mockImplementation(async (path: string, init?: RequestInit) => {
      if (path === '/api/shop') return reply(200, shop);
      if (path === '/api/shop/purchase') {
        shop = shopState(true);
        return reply(200, { duplicate: false });
      }
      throw new Error(`Unexpected request: ${init?.method ?? 'GET'} ${path}`);
    });

    await render(<Shop />);
    expect(await screen.findByText('Gems: 10')).toBeTruthy();

    await fireEvent.press(screen.getByText('Buy for 6 gems'));

    expect(await screen.findByText('Purchased Fox scarf.')).toBeTruthy();
    expect((await screen.findAllByText('Owned')).length).toBeGreaterThan(0);

    const purchase = mockedFetch.mock.calls.find(
      ([path]) => path === '/api/shop/purchase',
    );
    const body = JSON.parse(String(purchase?.[1]?.body));
    expect(body.itemId).toBe('fox-scarf');
    expect(typeof body.requestId).toBe('string');
  });

  it('rolls the cosmetic back when the server rejects ownership', async () => {
    const local = emptyProgress();
    await saveProgress(local);
    mockedSync.mockResolvedValue({ progress: local, signedIn: true });
    mockedFetch.mockImplementation(async (path: string, init?: RequestInit) => {
      if (path === '/api/shop') return reply(200, shopState(true));
      if (path === '/api/progress' && init?.method === 'PUT') {
        return reply(409, { error: 'You do not own this cosmetic.' });
      }
      throw new Error(`Unexpected request: ${init?.method ?? 'GET'} ${path}`);
    });

    await render(<Shop />);
    expect(await screen.findByText('Gems: 4')).toBeTruthy();
    await fireEvent.press(screen.getByText('Equip'));

    expect(await screen.findByText('You do not own this cosmetic.')).toBeTruthy();
    const stored = await loadProgress();
    expect(stored.equippedCosmetic).toBeNull();
    expect(screen.getByText('Equip')).toBeTruthy();
  });

  it('equips, syncs, and removes a cosmetic with explicit readback', async () => {
    const local = emptyProgress();
    await saveProgress(local);
    mockedSync.mockResolvedValue({ progress: local, signedIn: true });
    mockedFetch.mockImplementation(async (path: string, init?: RequestInit) => {
      if (path === '/api/shop') return reply(200, shopState(true));
      if (path === '/api/progress' && init?.method === 'PUT') {
        const body = JSON.parse(String(init.body)) as { progress: ProgressState };
        return reply(200, { progress: body.progress });
      }
      throw new Error(`Unexpected request: ${init?.method ?? 'GET'} ${path}`);
    });

    await render(<Shop />);
    expect(await screen.findByText('Gems: 4')).toBeTruthy();
    await fireEvent.press(screen.getByText('Equip'));
    expect(await screen.findByText('Cosmetic equipped and synced.')).toBeTruthy();
    expect(screen.getByText('Equipped')).toBeTruthy();
    expect((await loadProgress()).equippedCosmetic).toBe('scarf');

    await fireEvent.press(screen.getByText('Remove equipped cosmetic'));
    expect(await screen.findByText('Cosmetic removed and synced.')).toBeTruthy();
    expect((await loadProgress()).equippedCosmetic).toBeNull();

    const puts = mockedFetch.mock.calls.filter(
      ([path, init]) => path === '/api/progress' && init?.method === 'PUT',
    );
    expect(puts).toHaveLength(2);
    expect(JSON.parse(String(puts[0]![1]?.body)).progress.equippedCosmetic).toBe('scarf');
    expect(JSON.parse(String(puts[1]![1]?.body)).progress.equippedCosmetic).toBeNull();
  });
});
