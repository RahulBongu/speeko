import { createAudioPlayer } from 'expo-audio';
import { createMascotVarietyPicker } from '@speeko/core';

const SOUND_MAP: Record<string, number> = {
  correct: require('../assets/sounds/correct.mp3'),
  'correct-2': require('../assets/sounds/correct-2.mp3'),
  'correct-3': require('../assets/sounds/correct-3.mp3'),
  'correct-4': require('../assets/sounds/correct-4.mp3'),
  'correct-5': require('../assets/sounds/correct-5.mp3'),
  incorrect: require('../assets/sounds/incorrect.mp3'),
  'incorrect-2': require('../assets/sounds/incorrect-2.mp3'),
  'incorrect-3': require('../assets/sounds/incorrect-3.mp3'),
  complete: require('../assets/sounds/complete.mp3'),
  'complete-2': require('../assets/sounds/complete-2.mp3'),
  'complete-3': require('../assets/sounds/complete-3.mp3'),
  'unit-complete': require('../assets/sounds/unit-complete.mp3'),
  'unit-complete-2': require('../assets/sounds/unit-complete-2.mp3'),
  'unit-complete-3': require('../assets/sounds/unit-complete-3.mp3'),
};

const sfxPicker = createMascotVarietyPicker();
let currentPlayer: ReturnType<typeof createAudioPlayer> | null = null;
let currentSubscription: { remove(): void } | null = null;
let enabled = true;

try {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  AsyncStorage.getItem('speeko.soundEnabled')
    .then((value: string | null) => {
      enabled = value === null ? true : value === '1';
    })
    .catch(() => {});
} catch {
  // keep default
}

export function isMobileSoundEnabled(): boolean {
  return enabled;
}

export function setMobileSoundEnabled(value: boolean): void {
  enabled = value;
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    AsyncStorage.setItem('speeko.soundEnabled', value ? '1' : '0').catch(() => {});
  } catch {
    // ignore
  }
}

function releasePlayer(): void {
  if (currentSubscription) {
    try {
      currentSubscription.remove();
    } catch {}
    currentSubscription = null;
  }
  if (currentPlayer) {
    try {
      currentPlayer.pause();
    } catch {}
    try {
      currentPlayer.remove();
    } catch {}
    currentPlayer = null;
  }
}

export async function playMobileSound(
  kind: 'correct' | 'incorrect' | 'complete' | 'unit_complete',
  explicitKey?: string | null,
): Promise<boolean> {
  if (!enabled) return false;
  const fallbackKey = kind === 'unit_complete' ? 'unit-complete' : kind;
  const key = explicitKey && SOUND_MAP[explicitKey] ? explicitKey : sfxPicker.pickSfxKey(kind);
  const source = SOUND_MAP[key] ?? SOUND_MAP[fallbackKey];
  if (!source) return false;
  try {
    releasePlayer();
    const player = createAudioPlayer(source);
    player.volume = 0.85;
    currentPlayer = player;
    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (status.isLoaded && status.didJustFinish) {
        if (currentPlayer === player) releasePlayer();
      }
    });
    currentSubscription = subscription;
    player.play();
    return true;
  } catch {
    return false;
  }
}

export async function stopMobileSound(): Promise<void> {
  releasePlayer();
}
