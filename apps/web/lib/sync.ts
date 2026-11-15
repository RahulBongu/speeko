import type { ProgressState } from '@speeko/core';
import { API_URL } from './auth-client';

async function progressRequest(init?: RequestInit) {
  const response = await fetch(`${API_URL}/api/progress`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (response.status === 401) return null;
  if (!response.ok) {
    throw new Error(`Progress sync failed with status ${response.status}`);
  }
  return (await response.json()) as {
    progress: ProgressState;
    updatedAt: string | null;
  };
}

export async function fetchCloudProgress(): Promise<ProgressState | null> {
  const result = await progressRequest();
  return result?.progress ?? null;
}

export async function pushCloudProgress(progress: ProgressState): Promise<ProgressState | null> {
  const result = await progressRequest({
    method: 'PUT',
    body: JSON.stringify({ progress }),
  });
  return result?.progress ?? null;
}
