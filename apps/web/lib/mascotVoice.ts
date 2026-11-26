'use client';

import { useEffect, useState } from 'react';
import {
  MASCOT_REACTIONS,
  createMascotVarietyPicker,
  type MascotReactionId,
  type VariedReactionPick,
} from '@speeko/core';

const STORAGE_KEY = 'speeko.mascotVoiceEnabled';
const VARIETY_STORAGE_KEY = 'speeko.mascotVariety.v1';
const ASSET_DIR = '/mascot';

const varietyPicker = createMascotVarietyPicker(Math.random, {
  load: () => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(VARIETY_STORAGE_KEY);
    } catch {
      return null;
    }
  },
  save: (snapshot) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(VARIETY_STORAGE_KEY, snapshot);
    } catch {
      // ignore storage failures
    }
  },
});
let enabledCache: boolean | null = null;

export function isMascotVoiceEnabled(): boolean {
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

export function setMascotVoiceEnabled(value: boolean): void {
  enabledCache = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
  } catch {
    // ignore storage failures
  }
}

const SOUND_PATHS: Record<string, string> = {
  correct: 'correct.mp3',
  'correct-2': 'correct-2.mp3',
  'correct-3': 'correct-3.mp3',
  'correct-4': 'correct-4.mp3',
  'correct-5': 'correct-5.mp3',
  'correct-6': 'correct-6.mp3',
  'correct-7': 'correct-7.mp3',
  'correct-8': 'correct-8.mp3',
  'correct-9': 'correct-9.mp3',
  incorrect: 'incorrect.mp3',
  'incorrect-2': 'incorrect-2.mp3',
  'incorrect-3': 'incorrect-3.mp3',
  'incorrect-4': 'incorrect-4.mp3',
  'incorrect-5': 'incorrect-5.mp3',
  'incorrect-6': 'incorrect-6.mp3',
  complete: 'complete.mp3',
  'complete-2': 'complete-2.mp3',
  'complete-3': 'complete-3.mp3',
  'complete-4': 'complete-4.mp3',
  'complete-5': 'complete-5.mp3',
  'complete-6': 'complete-6.mp3',
  'unit-complete': 'unit-complete.mp3',
  'unit-complete-2': 'unit-complete-2.mp3',
  'unit-complete-3': 'unit-complete-3.mp3',
  'unit-complete-4': 'unit-complete-4.mp3',
  'unit-complete-5': 'unit-complete-5.mp3',
  'unit-complete-6': 'unit-complete-6.mp3',
  discovery: 'discovery.mp3',
  'discovery-2': 'discovery-2.mp3',
  streak: 'streak.mp3',
  'streak-2': 'streak-2.mp3',
  encouragement: 'encouragement.mp3',
  'encouragement-2': 'encouragement-2.mp3',
  'lets-go': 'lets-go.mp3',
};

let current: HTMLAudioElement | null = null;
const preloadedAudio = new Map<string, HTMLAudioElement>();
let voicePreloaded = false;

type SpeakingListener = (speaking: boolean) => void;
const speakingListeners = new Set<SpeakingListener>();

function emitSpeaking(speaking: boolean) {
  for (const listener of speakingListeners) listener(speaking);
}

/** Subscribe to mascot playback so the fox can animate its mouth. */
export function subscribeMascotSpeaking(listener: SpeakingListener): () => void {
  speakingListeners.add(listener);
  return () => {
    speakingListeners.delete(listener);
  };
}

/** True while a mascot voice line is actually playing. */
export function isMascotSpeaking(): boolean {
  return current !== null;
}

// Listening state is driven by the lesson audio prompt, not by mascot playback.
let listening = false;
const listeningListeners = new Set<SpeakingListener>();

export function emitMascotListening(active: boolean): void {
  if (listening === active) return;
  listening = active;
  for (const listener of listeningListeners) listener(active);
}

export function subscribeMascotListening(listener: SpeakingListener): () => void {
  listeningListeners.add(listener);
  return () => {
    listeningListeners.delete(listener);
  };
}

/** React hook for the listening pose while an audio prompt plays. */
export function useMascotListening(): boolean {
  const [active, setActive] = useState(listening);
  useEffect(() => {
    setActive(listening);
    return subscribeMascotListening(setActive);
  }, []);
  return active;
}

/** React hook form of {@link isMascotSpeaking}. */
export function useMascotSpeaking(): boolean {
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => {
    setSpeaking(isMascotSpeaking());
    return subscribeMascotSpeaking(setSpeaking);
  }, []);
  return speaking;
}

export function nextVariedMascotReaction(reactionId: MascotReactionId): VariedReactionPick {
  return varietyPicker.pick(reactionId);
}

export function playMascotVoice(
  reactionId: MascotReactionId,
  overrideAudioKey?: string,
): boolean {
  if (typeof window === 'undefined') return false;
  if (!isMascotVoiceEnabled()) return false;
  const reaction = MASCOT_REACTIONS[reactionId];
  if (!reaction) return false;
  const clipKey =
    overrideAudioKey && SOUND_PATHS[overrideAudioKey]
      ? overrideAudioKey
      : varietyPicker.pickAudioKey(reactionId);
  const file = SOUND_PATHS[clipKey] ?? SOUND_PATHS[reaction.audioKey];
  if (!file) return false;

  stopMascotVoice();

  try {
    let audio = preloadedAudio.get(file);
    if (!audio) {
      audio = new Audio(`${ASSET_DIR}/${file}`);
      audio.preload = 'auto';
      preloadedAudio.set(file, audio);
    }
    audio.pause();
    audio.currentTime = 0;
    audio.playbackRate = 1.07;
    current = audio;
    const finish = () => {
      // A newer line may have replaced this one; only the active clip clears.
      if (current !== audio) return;
      current = null;
      emitSpeaking(false);
    };
    audio.addEventListener('ended', finish, { once: true });
    audio.addEventListener('error', finish, { once: true });
    void audio.play().catch(finish);
    emitSpeaking(true);
    return true;
  } catch {
    return false;
  }
}

/** Pre-warm core mascot reaction audio + "Let's go!" clip so appreciation fires instantaneously. */
export function preloadMascotAudio(): void {
  if (typeof window === 'undefined' || voicePreloaded) return;
  voicePreloaded = true;
  const warmupFiles = [
    'lets-go.mp3',
    'correct.mp3',
    'correct-2.mp3',
    'correct-3.mp3',
    'incorrect.mp3',
    'incorrect-2.mp3',
    'complete.mp3',
    'unit-complete.mp3',
  ];
  for (const file of warmupFiles) {
    if (preloadedAudio.has(file)) continue;
    try {
      const a = new Audio(`${ASSET_DIR}/${file}`);
      a.preload = 'auto';
      preloadedAudio.set(file, a);
    } catch {
      // ignore
    }
  }
}

/** Crisp energetic "Let's go!" cue when continuing from a module start brief. */
export function playLetsGoSound(): boolean {
  if (typeof window === 'undefined' || !isMascotVoiceEnabled()) return false;
  stopMascotVoice();
  try {
    let audio = preloadedAudio.get('lets-go.mp3');
    if (!audio) {
      audio = new Audio(`${ASSET_DIR}/lets-go.mp3`);
      audio.preload = 'auto';
      preloadedAudio.set('lets-go.mp3', audio);
    }
    audio.pause();
    audio.currentTime = 0;
    audio.playbackRate = 1.08;
    current = audio;
    const finish = () => {
      if (current !== audio) return;
      current = null;
      emitSpeaking(false);
    };
    audio.addEventListener('ended', finish, { once: true });
    audio.addEventListener('error', finish, { once: true });
    void audio.play().catch(finish);
    emitSpeaking(true);
    return true;
  } catch {
    return false;
  }
}

export function stopMascotVoice(): void {
  if (current) {
    const audio = current;
    current = null;
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {
      // ignore
    }
    emitSpeaking(false);
  }
}
