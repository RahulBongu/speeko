import { mergeProgress, progressEquals, type ProgressState } from '@speeko/core';
import { ORIGIN, apiFetch } from './api';
import { loadProgress, saveProgress } from './progress';

export interface ProgressSyncResult {
  progress: ProgressState;
  signedIn: boolean;
}

/**
 * Merges this device's snapshot with the signed-in account's cloud snapshot.
 *
 * - Guest: returns the device snapshot untouched.
 * - Signed in: unions completed lessons, SRS cards, and daily activity, then
 *   pushes the merged snapshot only when the server copy is missing or differs.
 * - The equipped cosmetic prefers an explicit local choice, then the cloud
 *   choice, so signing in on a new device keeps the account's fox.
 */
export async function syncProgress(): Promise<ProgressSyncResult> {
  const local = await loadProgress();
  const response = await apiFetch('/api/progress');
  if (response.status === 401) {
    return { progress: local, signedIn: false };
  }
  if (!response.ok) {
    throw new Error(`Progress could not sync (status ${response.status}).`);
  }

  const data = (await response.json()) as { progress?: ProgressState };
  const remote = data.progress;
  const base = remote ? mergeProgress(remote, local) : local;
  const merged: ProgressState = {
    ...base,
    equippedCosmetic: local.equippedCosmetic ?? remote?.equippedCosmetic ?? null,
  };
  await saveProgress(merged);

  if (!remote || !progressEquals(merged, remote)) {
    const pushed = await apiFetch('/api/progress', {
      method: 'PUT',
      headers: { origin: ORIGIN },
      body: JSON.stringify({ progress: merged }),
    });
    if (!pushed.ok) {
      throw new Error(`Progress could not sync (status ${pushed.status}).`);
    }
    const body = (await pushed.json()) as { progress?: ProgressState };
    if (body.progress) {
      await saveProgress(body.progress);
      return { progress: body.progress, signedIn: true };
    }
  }

  return { progress: merged, signedIn: true };
}
