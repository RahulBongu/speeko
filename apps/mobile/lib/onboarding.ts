import AsyncStorage from '@react-native-async-storage/async-storage';
import { INDIAN_LOCALES, type Locale } from '@speeko/core';

/**
 * Onboarding draft/completed state, persisted on this device. Mirrors the web
 * app's lib/onboarding.ts semantics, but keys and storage are mobile-local.
 */
export const ONBOARDING_KEY = 'speeko.mobile.onboarding.v1';

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

async function readRecord(): Promise<OnboardingDraft | OnboardingState | null> {
  try {
    const raw = await AsyncStorage.getItem(ONBOARDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OnboardingState & OnboardingDraft>;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.locale !== 'string') {
      return null;
    }
    const locale = parsed.locale as Locale;
    if (!(INDIAN_LOCALES as readonly string[]).includes(locale)) return null;
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
export async function readOnboardingDraft(): Promise<OnboardingDraft | null> {
  const record = await readRecord();
  return record && 'completedAt' in record ? null : record;
}

/** Reads completed onboarding, if the learner finished it once. */
export async function readCompletedOnboarding(): Promise<OnboardingState | null> {
  const record = await readRecord();
  return record && 'completedAt' in record ? record : null;
}

export async function saveOnboardingDraft(draft: OnboardingDraft): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify(draft));
  } catch {
    // Storage is best-effort; onboarding still works this session.
  }
}

export async function completeOnboarding(
  draft: RequiredOnboarding,
): Promise<OnboardingState> {
  const completed: OnboardingState = {
    ...draft,
    completedAt: new Date().toISOString(),
  };
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify(completed));
  } catch {
    // Best-effort; the lesson can still start.
  }
  return completed;
}

export type RequiredOnboarding = OnboardingDraft & {
  motivation: string;
  level: string;
  dailyGoal: number;
  commitment: string;
};

export async function readExperienceLevel(): Promise<string> {
  const completed = await readCompletedOnboarding();
  if (completed?.level) return completed.level;
  const draft = await readOnboardingDraft();
  return draft?.level ?? 'zero';
}

export async function saveExperienceLevel(level: string, defaultLocale: Locale = 'hi'): Promise<void> {
  try {
    const completed = await readCompletedOnboarding();
    if (completed) {
      await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify({ ...completed, level }));
      return;
    }
    const draft = await readOnboardingDraft();
    if (draft) {
      await saveOnboardingDraft({ ...draft, level });
      return;
    }
    await AsyncStorage.setItem(
      ONBOARDING_KEY,
      JSON.stringify({
        locale: defaultLocale,
        motivation: 'Just for fun',
        level,
        dailyGoal: 50,
        commitment: 'daily',
        completedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // ignore storage failures
  }
}
