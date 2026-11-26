'use client';

import { createMascotVarietyPicker } from '@speeko/core';

const STORAGE_KEY = 'speeko.soundEnabled';
const SOUND_FILES: Record<string, string> = {
  correct: '/sounds/correct.mp3',
  'correct-2': '/sounds/correct-2.mp3',
  'correct-3': '/sounds/correct-3.mp3',
  'correct-4': '/sounds/correct-4.mp3',
  incorrect: '/sounds/incorrect.mp3',
  'incorrect-2': '/sounds/incorrect-2.mp3',
  'incorrect-3': '/sounds/incorrect-3.mp3',
  complete: '/sounds/complete.mp3',
  'complete-2': '/sounds/complete-2.mp3',
};

const sfxPicker = createMascotVarietyPicker();
let enabledCache: boolean | null = null;

export function isSoundEnabled(): boolean {
  if (enabledCache !== null) return enabledCache;
  if (typeof window === 'undefined') return true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    enabledCache = raw === null ? true : raw === '1';
  } catch {
    enabledCache = true;
  }
  return enabledCache;
}

export function setSoundEnabled(value: boolean): void {
  enabledCache = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
  } catch {
    // ignore storage failures
  }
}

const activeAudio = new Map<string, HTMLAudioElement>();

export function playSound(
  name: 'correct' | 'incorrect' | 'complete',
  explicitKey?: string | null,
): void {
  if (typeof window === 'undefined') return;
  if (!isSoundEnabled()) return;
  const resolvedKey =
    explicitKey && SOUND_FILES[explicitKey] ? explicitKey : sfxPicker.pickSfxKey(name);
  const src = SOUND_FILES[resolvedKey] ?? SOUND_FILES[name];
  if (!src) return;
  try {
    let audio = activeAudio.get(resolvedKey);
    if (!audio) {
      audio = new Audio(src);
      audio.preload = 'auto';
      activeAudio.set(resolvedKey, audio);
    }
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Autoplay or decode failure: silently ignore.
    });
  } catch {
    // ignore
  }
}
