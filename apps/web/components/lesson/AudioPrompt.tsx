'use client';

import { useEffect, useRef, useState } from 'react';
import type { Locale } from '@speeko/core';
import { speak } from '@/lib/speech';
import { SpeakerIcon } from '@/components/icons';

export interface AudioPromptProps {
  text: string;
  locale: Locale;
  audioUrl?: string | undefined;
  autoPlay?: boolean;
  /** When true the phrase is always shown (e.g. a speaking exercise). */
  alwaysShowText?: boolean;
  size?: 'md' | 'lg';
}

/**
 * Big listen button with two graceful fallbacks:
 * - a recorded `audioUrl` when content provides one;
 * - a "show the phrase" reveal when speech synthesis is unavailable.
 */
export function AudioPrompt({
  text,
  locale,
  audioUrl,
  autoPlay = false,
  alwaysShowText = false,
  size = 'md',
}: AudioPromptProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playing, setPlaying] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [showText, setShowText] = useState(alwaysShowText);

  const stopTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const play = () => {
    stopTimer();
    if (audioUrl) {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = 0;
      setPlaying(true);
      void audio.play().catch(() => {
        setPlaying(false);
        setUnavailable(true);
      });
      return;
    }
    const ok = speak(text, locale, () => setPlaying(false));
    if (!ok) {
      setUnavailable(true);
      setPlaying(false);
      setShowText(true);
      return;
    }
    setPlaying(true);
    // Safety net for browsers that never fire `onend`.
    timeoutRef.current = setTimeout(() => setPlaying(false), 4000);
  };

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setTimeout(() => {
      if (audioUrl || speak(text, locale, () => setPlaying(false))) {
        setPlaying(true);
        timeoutRef.current = setTimeout(() => setPlaying(false), 4000);
      } else {
        setUnavailable(true);
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      stopTimer();
    };
    // Intentionally re-run only when the phrase changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, locale, audioUrl, autoPlay]);

  useEffect(() => () => stopTimer(), []);

  const showPhrase = alwaysShowText || showText || unavailable;
  const buttonSize = size === 'lg' ? 'h-24 w-24' : 'h-20 w-20';

  return (
    <div className="flex flex-col items-center gap-3">
      {audioUrl ? (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="none"
          onEnded={() => setPlaying(false)}
          onError={() => {
            setUnavailable(true);
            setPlaying(false);
          }}
          className="hidden"
        />
      ) : null}

      <div className="relative">
        {playing ? (
          <>
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-speeko-300" />
            <span
              className="absolute inset-0 animate-pulse-ring rounded-full bg-speeko-200"
              style={{ animationDelay: '0.45s' }}
            />
          </>
        ) : null}
        <button
          type="button"
          onClick={play}
          className={`focus-ring relative flex ${buttonSize} items-center justify-center rounded-full bg-speeko-500 text-white shadow-green transition hover:bg-speeko-400 active:translate-y-[2px] active:shadow-green-sm`}
          aria-label="Play the phrase"
        >
          <SpeakerIcon className="h-10 w-10" />
        </button>
      </div>

      {playing ? (
        <p className="font-display text-sm font-bold text-speeko-700" role="status">
          Playing…
        </p>
      ) : unavailable ? (
        <p className="max-w-xs text-center text-xs font-semibold text-bark-400">
          Audio isn&apos;t available in this browser — the phrase is shown below.
        </p>
      ) : !alwaysShowText ? (
        <button
          type="button"
          onClick={() => setShowText((value) => !value)}
          className="focus-ring rounded-lg px-2 py-1 text-xs font-bold text-bark-400 underline decoration-cream-300 underline-offset-2 hover:text-bark-600"
        >
          {showText ? 'Hide the phrase' : "Can't listen? Show the phrase"}
        </button>
      ) : null}

      {showPhrase ? (
        <p
          lang={locale}
          className="script-text animate-pop rounded-2xl border-2 border-cream-200 bg-white px-5 py-2 text-center text-2xl font-bold text-bark-800"
        >
          {text}
        </p>
      ) : null}
    </div>
  );
}
