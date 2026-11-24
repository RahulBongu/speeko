import { useEffect, useState } from 'react';
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
let currentSubscription: { remove(): void } | null = null;
let enabled = true;

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

type ActiveListener = (active: boolean) => void;
const speakingListeners = new Set<ActiveListener>();
const listeningListeners = new Set<ActiveListener>();
let speaking = false;
let listening = false;

function emit(listeners: Set<ActiveListener>, active: boolean) {
  for (const listener of listeners) listener(active);
}

export function emitMascotListening(active: boolean): void {
  if (listening === active) return;
  listening = active;
  emit(listeningListeners, active);
}

export function subscribeMascotSpeaking(listener: ActiveListener): () => void {
  speakingListeners.add(listener);
  return () => speakingListeners.delete(listener);
}

export function subscribeMascotListening(listener: ActiveListener): () => void {
  listeningListeners.add(listener);
  return () => listeningListeners.delete(listener);
}

export function useMascotSpeaking(): boolean {
  const [active, setActive] = useState(speaking);
  useEffect(() => {
    setActive(speaking);
    return subscribeMascotSpeaking(setActive);
  }, []);
  return active;
}

export function useMascotListening(): boolean {
  const [active, setActive] = useState(listening);
  useEffect(() => {
    setActive(listening);
    return subscribeMascotListening(setActive);
  }, []);
  return active;
}

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
        if (currentPlayer === player) releasePlayer();
        if (speaking) {
          speaking = false;
          emit(speakingListeners, false);
        }
      }
    });
    currentSubscription = subscription;
    player.play();
    speaking = true;
    emit(speakingListeners, true);
    return true;
  } catch {
    if (speaking) {
      speaking = false;
      emit(speakingListeners, false);
    }
    return false;
  }
}

export async function stopMascotVoice(): Promise<void> {
  releasePlayer();
  if (speaking) {
    speaking = false;
    emit(speakingListeners, false);
  }
}
