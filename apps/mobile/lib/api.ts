import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Endpoint constants. Development defaults point at the local API; a release
 * build must supply the deployed origins via the `extra` block in app.json
 * (e.g. through EAS env substitution) — the same way the web app reads
 * NEXT_PUBLIC_API_URL.
 */
import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  apiUrl?: string;
  webOrigin?: string;
};

export const API_URL = extra.apiUrl ?? 'http://localhost:3001';
export const ORIGIN = extra.webOrigin ?? 'http://localhost:3000';

const COOKIE_KEY = 'speeko.mobile.cookies';

export async function getCookie(): Promise<string | null> {
  return AsyncStorage.getItem(COOKIE_KEY);
}

export async function setCookie(value: string | null) {
  if (value) await AsyncStorage.setItem(COOKIE_KEY, value);
  else await AsyncStorage.removeItem(COOKIE_KEY);
}

/** Extract `name=value` cookie pairs from a Set-Cookie header so request headers stay clean. */
function extractCookiePairs(setCookieHeader: string): string {
  // Split multiple Set-Cookie headers separated by comma outside Expires=...
  const cookies = setCookieHeader.split(/,(?=[^;,=\s]+=[^;,]*)/);
  const pairs: string[] = [];
  for (const part of cookies) {
    const first = part.split(';')[0]?.trim();
    if (first && first.includes('=')) pairs.push(first);
  }
  return pairs.length > 0 ? pairs.join('; ') : setCookieHeader.trim();
}

export async function apiFetch(path: string, init?: RequestInit) {
  const cookie = await getCookie();
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const setCookieHeader = response.headers.get('set-cookie');
  if (setCookieHeader) {
    await setCookie(extractCookiePairs(setCookieHeader));
  }
  return response;
}
