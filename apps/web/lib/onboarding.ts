import type { Locale } from '@speeko/core';
import { COURSE_ORDER } from './courses';

export const ONBOARDING_KEY = 'speeko.onboarding.v1';

export interface OnboardingDraft {
  locale: Locale;
  motivation?: string | undefined;
  level?: string | undefined;
  /** Daily goal in XP. */
  dailyGoal?: number | undefined;
  commitment?: string | undefined;
}

export interface OnboardingState extends OnboardingDraft {
  motivation: string;
  level: string;
  dailyGoal: number;
  commitment: string;
  completedAt: string;
}

function readRecord(): OnboardingDraft | OnboardingState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(ONBOARDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OnboardingState & OnboardingDraft>;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.locale !== 'string') {
      return null;
    }
    const locale = parsed.locale as Locale;
    if (!COURSE_ORDER.includes(locale)) return null;
    const draft: OnboardingDraft = {
      locale,
      motivation: typeof parsed.motivation === 'string' ? parsed.motivation : undefined,
      level: typeof parsed.level === 'string' ? parsed.level : undefined,
      dailyGoal:
        typeof parsed.dailyGoal === 'number' && Number.isFinite(parsed.dailyGoal)
          ? Math.max(10, Math.floor(parsed.dailyGoal))
          : undefined,
      commitment:
        typeof parsed.commitment === 'string' ? parsed.commitment : undefined,
    };
    if (typeof parsed.completedAt === 'string') {
      return {
        ...draft,
        motivation: draft.motivation ?? 'Just for fun',
        level: draft.level ?? 'beginner',
        dailyGoal: draft.dailyGoal ?? 50,
        commitment: draft.commitment ?? 'daily',
        completedAt: parsed.completedAt,
      };
    }
    return draft;
  } catch {
    return null;
  }
}

/** Reads the in-progress draft, if any. Completed onboarding reads as null. */
export function readOnboardingDraft(): OnboardingDraft | null {
  const record = readRecord();
  return record && 'completedAt' in record ? null : record;
}

/** Reads completed onboarding, if the learner finished it once. */
export function readCompletedOnboarding(): OnboardingState | null {
  const record = readRecord();
  return record && 'completedAt' in record ? record : null;
}

export function saveOnboardingDraft(draft: OnboardingDraft): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ONBOARDING_KEY, JSON.stringify(draft));
  } catch {
    // Storage is best-effort; onboarding still works this session.
  }
}

export function completeOnboarding(draft: RequiredOnboarding): OnboardingState {
  const completed: OnboardingState = {
    ...draft,
    completedAt: new Date().toISOString(),
  };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(ONBOARDING_KEY, JSON.stringify(completed));
    } catch {
      // Best-effort; the lesson can still start.
    }
  }
  return completed;
}

export type RequiredOnboarding = OnboardingDraft & {
  motivation: string;
  level: string;
  dailyGoal: number;
  commitment: string;
};
