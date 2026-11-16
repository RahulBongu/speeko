import type { AttemptAnswer, ProgressState } from '@speeko/core';
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

/** A lesson attempt exactly as the player captured it, before grading. */
export interface LessonAttemptPayload {
  attemptId: string;
  courseId: string;
  lessonId: string;
  answers: AttemptAnswer[];
}

export interface LessonCompletionEvent {
  id: string;
  attemptId: string;
  courseId: string;
  lessonId: string;
  xp: number;
  accuracy: number;
  heartsLeft: number;
  maxCombo: number;
  createdAt: string;
}

export interface LessonCompletionResult {
  duplicate: boolean;
  event: LessonCompletionEvent;
  progress: ProgressState;
}

export class LessonCompletionError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'LessonCompletionError';
    this.status = status;
  }
}

/**
 * Sends raw answers for server-side re-grading. The server never trusts
 * client-computed XP; `attemptId` makes retries safe (the same attempt can
 * only be awarded once).
 */
export async function submitLessonCompletion(
  payload: LessonAttemptPayload,
): Promise<LessonCompletionResult> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/lesson-completions`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new LessonCompletionError('Could not reach Speeko.', 0);
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new LessonCompletionError('Your session expired. Sign in again.', 401);
    }
    if (response.status >= 500) {
      throw new LessonCompletionError('Speeko had trouble saving this lesson.', response.status);
    }
    let message = `Could not save your reward (status ${response.status}).`;
    try {
      const body = (await response.json()) as { error?: unknown; reason?: unknown };
      if (typeof body.error === 'string') message = body.error;
      if (typeof body.reason === 'string') message = `${message} ${body.reason}`;
    } catch {
      // Keep the status-based fallback message.
    }
    throw new LessonCompletionError(message, response.status);
  }

  return (await response.json()) as LessonCompletionResult;
}
