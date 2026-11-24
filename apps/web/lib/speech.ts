import type { Locale } from '@speeko/core';
import { LOCALE_META } from './courses';

export function speechAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance !== 'undefined'
  );
}

function pickVoice(voices: SpeechSynthesisVoice[], lang: string, locale: string): SpeechSynthesisVoice | null {
  const exact = voices.find((voice) => voice.lang.toLowerCase() === lang.toLowerCase());
  if (exact) return exact;
  const normalizedLocale = locale.toLowerCase();
  const prefix = voices.find((voice) =>
    voice.lang.toLowerCase().replace('_', '-').startsWith(`${normalizedLocale}-`),
  );
  return prefix ?? null;
}

/** Stop any in-flight speech utterance (e.g. when a lesson screen unmounts). */
export function cancelSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/** Speak target-language text. Returns false when the browser has no speech synthesis. */
export function speak(text: string, locale: Locale, onEnd?: () => void): boolean {
  if (!speechAvailable() || !text.trim()) return false;
  const synth = window.speechSynthesis;
  synth.cancel();
  const lang = LOCALE_META[locale].speech;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.82;
  const voice = pickVoice(synth.getVoices(), lang, locale);
  if (voice) utterance.voice = voice;
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }
  synth.speak(utterance);
  return true;
}

interface RecognitionAlternative {
  transcript: string;
}

interface RecognitionResult {
  readonly length: number;
  readonly [index: number]: RecognitionAlternative;
}

interface RecognitionEvent {
  results: {
    readonly length: number;
    readonly [index: number]: RecognitionResult;
  };
}

interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}

type RecognitionCtor = new () => RecognitionLike;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const scope = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

export function recognitionAvailable(): boolean {
  return recognitionCtor() !== null;
}

export interface Recognizer {
  start(): void;
  stop(): void;
}

export function createRecognizer(
  locale: Locale,
  onResult: (transcript: string) => void,
  onEnd: () => void,
): Recognizer | null {
  const Ctor = recognitionCtor();
  if (!Ctor) return null;
  const recognition = new Ctor();
  recognition.lang = LOCALE_META[locale].speech;
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;
  recognition.continuous = false;
  recognition.onresult = (event) => {
    const first = event.results[0];
    if (!first) return;
    const alternatives = Array.from({ length: first.length }, (_, i) => first[i]?.transcript ?? '');
    const transcript = alternatives.join(' ').trim();
    if (transcript) onResult(transcript);
  };
  recognition.onend = onEnd;
  recognition.onerror = onEnd;
  return {
    start: () => {
      try {
        recognition.start();
      } catch {
        onEnd();
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch {
        onEnd();
      }
    },
  };
}
