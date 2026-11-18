import { mergeProgress, progressEquals, type ProgressState } from '@speeko/core';
import { ORIGIN, apiFetch } from './api';
import { loadProgress, saveProgress } from './progress';

export interface ProgressSyncResult {
  progress: ProgressState;
  signedIn: boolean;
}

/**
 * Best-effort variant of {@link syncProgress} used after local-only writes
 * (practice reviews) and on screen load. It retries once and never throws, so
 * an offline device keeps its local schedule and syncs on the next sign-in,
 * account, or shop visit. Returns `signedIn: false` when there is no session
 * or the server cannot be reached.
 */
export async function syncProgressIfSignedIn(): Promise<ProgressSyncResult & { synced: boolean }> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = await syncProgress();
      return { ...result, synced: result.signedIn };
    } catch {
      // Retry once; then fall through to the local-only result below.
    }
  }
  const local = await loadProgress();
  return { progress: local, signedIn: false, synced: false };
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
