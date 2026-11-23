'use client';

import { useEffect, useState } from 'react';
import { MASCOT_REACTIONS, type MascotReactionId } from '@speeko/core';

const STORAGE_KEY = 'speeko.mascotVoiceEnabled';
const ASSET_DIR = '/mascot';

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
  incorrect: 'incorrect.mp3',
  complete: 'complete.mp3',
  discovery: 'discovery.mp3',
  streak: 'streak.mp3',
  encouragement: 'encouragement.mp3',
};

let current: HTMLAudioElement | null = null;

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

export function playMascotVoice(reactionId: MascotReactionId): boolean {
  if (typeof window === 'undefined') return false;
  if (!isMascotVoiceEnabled()) return false;
  const reaction = MASCOT_REACTIONS[reactionId];
  if (!reaction) return false;
  const file = SOUND_PATHS[reaction.audioKey];
  if (!file) return false;

  stopMascotVoice();

  try {
    const audio = new Audio(`${ASSET_DIR}/${file}`);
    audio.preload = 'auto';
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
