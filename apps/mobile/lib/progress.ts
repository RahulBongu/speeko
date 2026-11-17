import AsyncStorage from '@react-native-async-storage/async-storage';
import { emptyProgress, migrateProgress, browserTimeZone, type ProgressState } from '@speeko/core';

const KEY = 'speeko.mobile.progress.v2';

export async function loadProgress(): Promise<ProgressState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...emptyProgress(), timeZone: browserTimeZone() };
    return migrateProgress(JSON.parse(raw), new Date(), browserTimeZone());
  } catch {
    return { ...emptyProgress(), timeZone: browserTimeZone() };
  }
}

export async function saveProgress(progress: ProgressState) {
  await AsyncStorage.setItem(KEY, JSON.stringify(progress));
}

/**
 * Sign-out isolation: removes the device snapshot so the next person on this
 * device cannot see the previous account's XP, SRS cards, or preferences.
 */
export async function clearProgress() {
  await AsyncStorage.removeItem(KEY);
}