const KNOWN_USER_KEY = 'speeko.auth.userId';

/**
 * Remembers that this browser was signed in as a specific user. The marker is
 * advisory only: it lets lesson completion fail closed (no local XP) when the
 * session check cannot reach the API, without penalising first-time guests.
 */
export function readKnownSignedInUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(KNOWN_USER_KEY);
    return value && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

export function writeKnownSignedInUserId(userId: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (userId) {
      window.localStorage.setItem(KNOWN_USER_KEY, userId);
    } else {
      window.localStorage.removeItem(KNOWN_USER_KEY);
    }
  } catch {
    // Storage unavailable; the completion path fails closed instead.
  }
}
