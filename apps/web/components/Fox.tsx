'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  resolveFoxAnimation,
  foxMoodForReaction,
  type FoxMood,
  type MascotReactionId,
  type MascotState,
  type ProgressState,
} from '@speeko/core';

export type { FoxMood };

export interface FoxProps {
  mood?: FoxMood | MascotState | 'correct' | 'incorrect' | MascotReactionId;
  className?: string;
  /**
   * Accessible label. Omit when nearby text already names what is happening
   * so decorative repeats stay quiet to screen readers.
   */
  title?: string;
  /** Purchased and equipped cosmetic from `/shop`. */
  accessory?: ProgressState['equippedCosmetic'];
  /** Animates mouth shapes & speech expressions when Speeko speaks aloud. */
  speaking?: boolean;
  /** Shows attentive perked ears and steady eyes while listening for the learner's voice. */
  listening?: boolean;
  /** Gentle ambient floating lift for static home / course header spots. */
  patrol?: boolean;
  /** Normalized gaze vector (`-1..1`) for subtle responsive head tilt toward pointer focus. */
  lookAt?: { x: number; y: number } | null;
  /** Consecutive correct answers; escalates to victory dance at high streaks. */
  combo?: number;
  /** Optional tap handler — turns the mascot into a button only when passed. */
  onTap?: () => void;
}

const FOX_REACTION_IDS = new Set<MascotReactionId>([
  'correct_answer',
  'incorrect_answer',
  'lesson_complete',
  'unit_complete',
  'discovery',
  'streak_milestone',
  'encouragement',
]);

/** States backed by single-play reaction clips that restart from frame 0 on trigger. */
const ONE_SHOT_STATES = new Set<MascotState>([
  'greeting',
  'correct_answer',
  'incorrect_supportive',
  'surprise',
  'curious_discovery',
  'welcome_back',
]);

const PRELOAD_CORE_CLIPS: readonly MascotState[] = [
  'idle',
  'greeting',
  'thinking',
  'correct_answer',
  'incorrect_supportive',
  'encouragement',
  'talking',
  'listening',
  'lesson_complete',
];

const preloadedSrcs = new Set<string>();

function isReactionId(value: unknown): value is MascotReactionId {
  return typeof value === 'string' && FOX_REACTION_IDS.has(value as MascotReactionId);
}

function CosmeticBadge({ accessory }: { accessory: NonNullable<ProgressState['equippedCosmetic']> }) {
  return (
    <span
      aria-hidden="true"
      data-fox-accessory={accessory}
      className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-speeko-500 shadow-sm"
    >
      {accessory === 'hat' ? (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
          <path d="M4 15h16M7 15l1.5-6h7L17 15" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : accessory === 'glasses' ? (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
          <circle cx="8" cy="12" r="3.2" stroke="#fff" strokeWidth="2" />
          <circle cx="16" cy="12" r="3.2" stroke="#fff" strokeWidth="2" />
          <path d="M11.2 12h1.6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
          <path d="M5 10c4.5 2.5 9.5 2.5 14 0v4c-4.5 2-9.5 2-14 0v-4Z" fill="#fff" />
        </svg>
      )}
    </span>
  );
}

/**
 * Speeko the fox mascot backed by `@speeko/core`'s 15-state animation controller
 * and transparent cropped Google Flow reference animation loops (`public/mascot/clips/*.webp`),
 * with automatic static `.png` fallback (`public/mascot/stills/*.png`) under
 * `prefers-reduced-motion: reduce`.
 */
export function Fox({
  mood = 'idle',
  className,
  title,
  accessory = null,
  speaking = false,
  listening = false,
  patrol = false,
  lookAt = null,
  combo = 0,
  onTap,
}: FoxProps) {
  const [tapped, setTapped] = useState(false);
  const [encouraging, setEncouraging] = useState(false);
  const [clipNonce, setClipNonce] = useState(0);

  const semanticMood: FoxMood | 'correct' | 'incorrect' = isReactionId(mood)
    ? foxMoodForReaction(mood)
    : mood;

  const state = resolveFoxAnimation({
    mood: encouraging ? 'encouraging' : semanticMood,
    speaking,
    listening,
    tapped,
    combo,
  });

  const prevSemanticRef = useRef<MascotState>(state.semanticState);

  useEffect(() => {
    setTapped(false);
  }, [semanticMood, speaking, listening]);

  // Recover smoothly from gentle incorrect posture into warm encouragement, then idle.
  useEffect(() => {
    if (
      semanticMood !== 'sad' &&
      semanticMood !== 'incorrect' &&
      semanticMood !== 'incorrect_supportive'
    ) {
      setEncouraging(false);
      return;
    }
    setEncouraging(false);
    const toEncourage = window.setTimeout(() => setEncouraging(true), 520);
    const back = window.setTimeout(() => setEncouraging(false), 1450);
    return () => {
      window.clearTimeout(toEncourage);
      window.clearTimeout(back);
    };
  }, [semanticMood]);

  useEffect(() => {
    if (!tapped) return;
    const timer = window.setTimeout(() => setTapped(false), 650);
    return () => window.clearTimeout(timer);
  }, [tapped]);

  useEffect(() => {
    if (prevSemanticRef.current !== state.semanticState) {
      prevSemanticRef.current = state.semanticState;
      if (ONE_SHOT_STATES.has(state.semanticState)) {
        setClipNonce((n) => n + 1);
      }
    }
  }, [state.semanticState]);

  // Warm key lesson clips lazily so answer feedback transitions swap instantaneously.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.Image === 'undefined') return;
    const timer = window.setTimeout(() => {
      for (const s of PRELOAD_CORE_CLIPS) {
        const src = `/mascot/clips/${s}.webp`;
        if (preloadedSrcs.has(src)) continue;
        preloadedSrcs.add(src);
        const img = new window.Image();
        img.src = src;
      }
    }, 180);
    return () => window.clearTimeout(timer);
  }, []);

  const handleTap = useCallback(() => {
    setTapped(true);
    setClipNonce((n) => n + 1);
    onTap?.();
  }, [onTap]);

  const decorative = !onTap && !title;
  const clipSrc = `/mascot/clips/${state.semanticState}.webp`;
  const stillSrc = `/mascot/stills/${state.semanticState}.png`;
  const animatedKey = ONE_SHOT_STATES.has(state.semanticState)
    ? `${state.semanticState}-${clipNonce}`
    : state.semanticState;

  const gazeX = lookAt ? Math.max(-1, Math.min(1, lookAt.x)) : 0;
  const gazeY = lookAt ? Math.max(-1, Math.min(1, lookAt.y)) : 0;
  const tiltStyle: CSSProperties | undefined = lookAt
    ? {
        transform: `translate3d(${(gazeX * 3).toFixed(2)}px, ${(gazeY * 2).toFixed(2)}px, 0) rotate(${(gazeX * 2.4).toFixed(2)}deg)`,
      }
    : undefined;

  return (
    <span
      data-fox-mascot="true"
      data-mascot-state={state.semanticState}
      data-mascot-paw={state.pawPose}
      className={`relative inline-flex shrink-0 items-center justify-center select-none ${
        className ?? 'h-32 w-32'
      } ${patrol ? 'animate-bob motion-reduce:animate-none' : ''} ${
        onTap
          ? 'cursor-pointer rounded-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-speeko-300'
          : ''
      }`}
      role={onTap ? 'button' : decorative ? undefined : 'img'}
      aria-label={onTap || !decorative ? title ?? state.label : undefined}
      aria-hidden={decorative ? true : undefined}
      tabIndex={onTap ? 0 : undefined}
      onClick={onTap ? handleTap : undefined}
      onKeyDown={
        onTap
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleTap();
              }
            }
          : undefined
      }
    >
      <span
        className="relative block h-full w-full transition-transform duration-200 ease-out motion-reduce:transform-none"
        style={tiltStyle}
      >
        {/* Native <img> preserves 16fps animated WebP frames without _next/image re-encoding */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={animatedKey}
          src={clipSrc}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="block h-full w-full select-none object-contain motion-reduce:hidden"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={stillSrc}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="hidden h-full w-full select-none object-contain motion-reduce:block"
        />
      </span>
      {accessory ? <CosmeticBadge accessory={accessory} /> : null}
    </span>
  );
}

export default Fox;
