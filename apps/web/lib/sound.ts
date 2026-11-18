'use client';

const STORAGE_KEY = 'speeko.soundEnabled';
const SOUND_FILES: Record<string, string> = {
  correct: '/sounds/correct.mp3',
  incorrect: '/sounds/incorrect.mp3',
  complete: '/sounds/complete.mp3',
};

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

export function playSound(name: keyof typeof SOUND_FILES): void {
  if (typeof window === 'undefined') return;
  if (!isSoundEnabled()) return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    // Still allow sound under reduced motion; motion preference is separate.
  }
  const src = SOUND_FILES[name];
  if (!src) return;
  try {
    let audio = activeAudio.get(name);
    if (!audio) {
      audio = new Audio(src);
      audio.preload = 'auto';
      activeAudio.set(name, audio);
    }
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Autoplay or decode failure: silently ignore.
    });
  } catch {
    // ignore
  }
}
