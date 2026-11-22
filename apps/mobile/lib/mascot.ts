import { createAudioPlayer } from 'expo-audio';
import { MASCOT_REACTIONS, type MascotReactionId } from '@speeko/core';

const AUDIO_MAP: Record<string, number> = {
  correct: require('../assets/mascot/correct.mp3'),
  incorrect: require('../assets/mascot/incorrect.mp3'),
  complete: require('../assets/mascot/complete.mp3'),
  discovery: require('../assets/mascot/discovery.mp3'),
  streak: require('../assets/mascot/streak.mp3'),
  encouragement: require('../assets/mascot/encouragement.mp3'),
};

let currentPlayer: ReturnType<typeof createAudioPlayer> | null = null;
let enabled = true;

try {
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
    const player = createAudioPlayer(source);
    player.volume = 1;
    currentPlayer = player;
    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (status.isLoaded && status.didJustFinish) {
        try {
          player.remove();
        } catch {}
        if (currentPlayer === player) currentPlayer = null;
        subscription.remove();
      }
    });
    player.play();
    return true;
  } catch {
    return false;
  }
}

export async function stopMascotVoice(): Promise<void> {
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
