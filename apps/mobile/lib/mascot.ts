import { useEffect, useState } from 'react';
import { createAudioPlayer } from 'expo-audio';
import {
  MASCOT_REACTIONS,
  createMascotVarietyPicker,
  type MascotReactionId,
  type VariedReactionPick,
} from '@speeko/core';

const AUDIO_MAP: Record<string, number> = {
  correct: require('../assets/mascot/correct.mp3'),
  'correct-2': require('../assets/mascot/correct-2.mp3'),
  'correct-3': require('../assets/mascot/correct-3.mp3'),
  'correct-4': require('../assets/mascot/correct-4.mp3'),
  'correct-5': require('../assets/mascot/correct-5.mp3'),
  'correct-6': require('../assets/mascot/correct-6.mp3'),
  'correct-7': require('../assets/mascot/correct-7.mp3'),
  'correct-8': require('../assets/mascot/correct-8.mp3'),
  'correct-9': require('../assets/mascot/correct-9.mp3'),
  incorrect: require('../assets/mascot/incorrect.mp3'),
  'incorrect-2': require('../assets/mascot/incorrect-2.mp3'),
  'incorrect-3': require('../assets/mascot/incorrect-3.mp3'),
  'incorrect-4': require('../assets/mascot/incorrect-4.mp3'),
  'incorrect-5': require('../assets/mascot/incorrect-5.mp3'),
  'incorrect-6': require('../assets/mascot/incorrect-6.mp3'),
  complete: require('../assets/mascot/complete.mp3'),
  'complete-2': require('../assets/mascot/complete-2.mp3'),
  'complete-3': require('../assets/mascot/complete-3.mp3'),
  'complete-4': require('../assets/mascot/complete-4.mp3'),
  'complete-5': require('../assets/mascot/complete-5.mp3'),
  'complete-6': require('../assets/mascot/complete-6.mp3'),
  'unit-complete': require('../assets/mascot/unit-complete.mp3'),
  'unit-complete-2': require('../assets/mascot/unit-complete-2.mp3'),
  'unit-complete-3': require('../assets/mascot/unit-complete-3.mp3'),
  'unit-complete-4': require('../assets/mascot/unit-complete-4.mp3'),
  'unit-complete-5': require('../assets/mascot/unit-complete-5.mp3'),
  'unit-complete-6': require('../assets/mascot/unit-complete-6.mp3'),
  discovery: require('../assets/mascot/discovery.mp3'),
  'discovery-2': require('../assets/mascot/discovery-2.mp3'),
  streak: require('../assets/mascot/streak.mp3'),
  'streak-2': require('../assets/mascot/streak-2.mp3'),
  encouragement: require('../assets/mascot/encouragement.mp3'),
  'encouragement-2': require('../assets/mascot/encouragement-2.mp3'),
  'lets-go': require('../assets/mascot/lets-go.mp3'),
};

let mobileVarietyCache: string | null = null;
const varietyPicker = createMascotVarietyPicker(Math.random, {
  load: () => mobileVarietyCache,
  save: (snapshot) => {
    mobileVarietyCache = snapshot;
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      AsyncStorage.setItem('speeko.mascotVariety.v1', snapshot).catch(() => {});
    } catch {
      // ignore storage errors
    }
  },
});

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
const enabledListeners = new Set<ActiveListener>();
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

export function subscribeMascotVoiceEnabled(listener: ActiveListener): () => void {
  enabledListeners.add(listener);
  return () => enabledListeners.delete(listener);
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

export function useMascotVoiceEnabled(): boolean {
  const [active, setActive] = useState(enabled);
  useEffect(() => {
    setActive(enabled);
    return subscribeMascotVoiceEnabled(setActive);
  }, []);
  return active;
}

try {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  AsyncStorage.getItem('speeko.mascotVoiceEnabled')
    .then((value: string | null) => {
      enabled = value === null ? true : value === '1';
      emit(enabledListeners, enabled);
    })
    .catch(() => {});
  AsyncStorage.getItem('speeko.mascotVariety.v1')
    .then((value: string | null) => {
      if (value) mobileVarietyCache = value;
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
  emit(enabledListeners, value);
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    AsyncStorage.setItem('speeko.mascotVoiceEnabled', value ? '1' : '0').catch(() => {});
  } catch {
    // ignore storage failures
  }
}

export function nextVariedMascotReaction(reactionId: MascotReactionId): VariedReactionPick {
  return varietyPicker.pick(reactionId);
}

export function mascotAudioSource(reactionId: MascotReactionId, overrideKey?: string): number | null {
  const reaction = MASCOT_REACTIONS[reactionId];
  if (!reaction) return null;
  if (overrideKey && AUDIO_MAP[overrideKey]) return AUDIO_MAP[overrideKey];
  const nextKey = varietyPicker.pickAudioKey(reactionId);
  return AUDIO_MAP[nextKey] ?? AUDIO_MAP[reaction.audioKey] ?? null;
}

export async function playMascotVoice(
  reactionId: MascotReactionId,
  overrideKey?: string,
): Promise<boolean> {
  if (!enabled) return false;
  const source = mascotAudioSource(reactionId, overrideKey);
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

export async function playLetsGoSound(): Promise<boolean> {
  if (!enabled) return false;
  const source = AUDIO_MAP['lets-go'];
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
