import { getCookie, setCookie, apiFetch } from '../lib/api';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockedFetch = jest.fn();
global.fetch = mockedFetch as any;

describe('mobile api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFetch.mockReset();
  });

  it('stores and reads a cookie', async () => {
    const storage = require('@react-native-async-storage/async-storage');
    storage.getItem.mockResolvedValue('session=abc');
    expect(await getCookie()).toBe('session=abc');

    await setCookie('session=xyz');
    expect(storage.setItem).toHaveBeenCalledWith('speeko.mobile.cookies', 'session=xyz');
  });

  it('removes the stored cookie when cleared', async () => {
    const storage = require('@react-native-async-storage/async-storage');
    await setCookie(null);
    expect(storage.removeItem).toHaveBeenCalledWith('speeko.mobile.cookies');
  });

  it('stores the cookie a sign-in response returns', async () => {
    const storage = require('@react-native-async-storage/async-storage');
    mockedFetch.mockResolvedValue({
      ok: true,
      headers: { get: () => 'session=from-login' },
    });
    await apiFetch('/api/auth/sign-in/email', { method: 'POST' });
    expect(storage.setItem).toHaveBeenCalledWith(
      'speeko.mobile.cookies',
      'session=from-login',
    );
  });

  it('adds the stored cookie to requests', async () => {    const storage = require('@react-native-async-storage/async-storage');
    storage.getItem.mockResolvedValue('session=abc');
    mockedFetch.mockResolvedValue({ ok: true, headers: { get: () => null } });

    await apiFetch('/api/progress');
    expect(mockedFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/progress'),
      expect.objectContaining({
        headers: expect.objectContaining({ Cookie: 'session=abc' }),
      }),
    );
  });

  it('preserves Cookie and Content-Type when custom headers such as origin are passed', async () => {
    const storage = require('@react-native-async-storage/async-storage');
    storage.getItem.mockResolvedValue('better-auth.session_token=secret123');
    mockedFetch.mockResolvedValue({
      ok: true,
      headers: { get: () => 'better-auth.session_token=rotated456; Path=/; HttpOnly' },
    });

    await apiFetch('/api/lesson-completions', {
      method: 'POST',
      headers: { origin: 'http://localhost:3000' },
      body: JSON.stringify({ test: true }),
    });

    expect(mockedFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/lesson-completions'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Cookie: 'better-auth.session_token=secret123',
          origin: 'http://localhost:3000',
        }),
      }),
    );
    expect(storage.setItem).toHaveBeenCalledWith(
      'speeko.mobile.cookies',
      'better-auth.session_token=rotated456',
    );
  });
});