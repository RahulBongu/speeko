import { Audio } from 'expo-av';
import { MASCOT_REACTIONS, type MascotReactionId } from '@speeko/core';

const AUDIO_MAP: Record<string, number> = {
  correct: require('../assets/mascot/correct.mp3'),
  incorrect: require('../assets/mascot/incorrect.mp3'),
  complete: require('../assets/mascot/complete.mp3'),
  discovery: require('../assets/mascot/discovery.mp3'),
  streak: require('../assets/mascot/streak.mp3'),
  encouragement: require('../assets/mascot/encouragement.mp3'),
};

let currentSound: Audio.Sound | null = null;
let enabled = true;

try {
  // Persist across restarts using AsyncStorage via a lazy require to avoid
  // circular deps at import time.
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  AsyncStorage.getItem('speeko.mascotVoiceEnabled')
    .then((value: string | null) => {
      enabled = value === null ? true : value === '1';
    })
    .catch(() => {});
} catch {
  // keep default
}

export function isMascotVoiceEnabled(): boolean {
  return enabled;
}

export function setMascotVoiceEnabled(value: boolean): void {
  enabled = value;
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    AsyncStorage.setItem('speeko.mascotVoiceEnabled', value ? '1' : '0').catch(() => {});
  } catch {
    // ignore storage failures
  }
}

export function mascotAudioSource(reactionId: MascotReactionId): number | null {
  const reaction = MASCOT_REACTIONS[reactionId];
  if (!reaction) return null;
  return AUDIO_MAP[reaction.audioKey] ?? null;
}

export async function playMascotVoice(reactionId: MascotReactionId): Promise<boolean> {
  if (!enabled) return false;
  const source = mascotAudioSource(reactionId);
  if (!source) return false;
  try {
    await stopMascotVoice();
    const { sound } = await Audio.Sound.createAsync(source, {
      shouldPlay: true,
      volume: 1,
    });
    currentSound = sound;
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
        if (currentSound === sound) currentSound = null;
      }
    });
    return true;
  } catch {
    return false;
  }
}

export async function stopMascotVoice(): Promise<void> {
  if (currentSound) {
    await currentSound.stopAsync().catch(() => {});
    await currentSound.unloadAsync().catch(() => {});
    currentSound = null;
  }
}
