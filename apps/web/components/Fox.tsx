'use client';

import type { CSSProperties } from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  resolveFoxAnimation,
  type FoxMood,
  type MascotReactionId,
  foxMoodForReaction,
} from '@speeko/core';

export type { FoxMood };

const FOX_REACTION_IDS = new Set<MascotReactionId>([
  'correct_answer',
  'incorrect_answer',
  'lesson_complete',
  'discovery',
  'streak_milestone',
  'encouragement',
]);

function isReactionId(value: unknown): value is MascotReactionId {
  return typeof value === 'string' && FOX_REACTION_IDS.has(value as MascotReactionId);
}

export interface FoxProps {
  mood?: FoxMood | 'correct' | 'incorrect' | MascotReactionId;
  className?: string;
  title?: string;
  accessory?: 'scarf' | 'hat' | 'glasses' | null;
  /** Animate the mouth while a mascot voice line plays. */
  speaking?: boolean;
  /** Attentive pose while an audio prompt plays. */
  listening?: boolean;
  /** Called after a tap; the mascot also plays a short wave. */
  onTap?: () => void;
}

/**
 * Speeko, the original mascot, drawn as inline SVG.
 *
 * The SVG is split into independently animated groups: body, head, ears, eyes,
 * eye highlights, mouth, arms, tail and feet. App events are mapped by
 * `resolveFoxAnimation` in core so the web and mobile versions stay in sync.
 * No paid rig or animation service is used. The global reduced-motion rule in
 * globals.css disables all of these loops.
 */
export function Fox({
  mood = 'idle',
  className,
  title,
  accessory = null,
  speaking = false,
  listening = false,
  onTap,
}: FoxProps) {
  const [tapped, setTapped] = useState(false);
  const [encouraging, setEncouraging] = useState(false);

  const semanticMood: FoxMood | 'correct' | 'incorrect' = isReactionId(mood)
    ? foxMoodForReaction(mood)
    : mood;

  const state = resolveFoxAnimation({
    mood: encouraging ? 'encouraging' : semanticMood,
    speaking,
    listening,
    tapped,
  });

  useEffect(() => {
    setTapped(false);
  }, [semanticMood, speaking, listening]);

  // A wrong answer shows a brief confused reaction, then a supportive nod.
  useEffect(() => {
    if (semanticMood !== 'sad' && semanticMood !== 'incorrect') {
      setEncouraging(false);
      return;
    }
    setEncouraging(false);
    const toEncourage = setTimeout(() => setEncouraging(true), 900);
    const back = setTimeout(() => setEncouraging(false), 2200);
    return () => {
      clearTimeout(toEncourage);
      clearTimeout(back);
    };
  }, [semanticMood]);

  useEffect(() => {
    if (!tapped) return;
    const timer = setTimeout(() => setTapped(false), 700);
    return () => clearTimeout(timer);
  }, [tapped]);

  const handleTap = useCallback(() => {
    setTapped(true);
    onTap?.();
  }, [onTap]);

  const happy = state.mood === 'happy' || state.mood === 'celebrate';
  const sad = state.mood === 'sad';
  const celebrate = state.animation === 'celebrate';
  const confused = state.animation === 'confused';
  const waving = state.waving || celebrate;

  const leftEarStyle: CSSProperties = {
    transformOrigin: '76px 74px',
    transform: sad ? 'rotate(13deg)' : happy ? 'rotate(-5deg)' : undefined,
    transition: 'transform .3s ease',
  };
  const rightEarStyle: CSSProperties = {
    transformOrigin: '164px 74px',
    transform: sad ? 'rotate(-13deg)' : happy ? 'rotate(5deg)' : undefined,
    transition: 'transform .3s ease',
  };
  const tailStyle: CSSProperties = { transformOrigin: '156px 194px' };
  const headStyle: CSSProperties = { transformOrigin: '120px 150px' };

  const armBase: CSSProperties = { transition: 'transform .35s ease' };
  const leftArmStyle: CSSProperties = {
    ...armBase,
    transformBox: 'view-box',
    transformOrigin: '84px 164px',
    transform: sad ? 'rotate(10deg)' : waving ? 'rotate(104deg)' : undefined,
  };
  const rightArmStyle: CSSProperties = {
    ...armBase,
    transformBox: 'view-box',
    transformOrigin: '156px 164px',
    transform: sad ? 'rotate(-10deg)' : celebrate ? 'rotate(-104deg)' : undefined,
  };
  const leftArmClass = waving
    ? 'animate-arm-wave'
    : confused || sad
      ? undefined
      : 'animate-arm-sway';
  const rightArmClass = celebrate
    ? 'animate-arm-wave-right'
    : waving || confused || sad
      ? undefined
      : 'animate-arm-sway-right';

  const headClass = celebrate
    ? 'animate-fox-dance'
    : confused
      ? 'animate-fox-confused'
      : waving
        ? 'animate-fox-wave'
        : state.mood === 'encouraging'
          ? 'animate-fox-nod'
          : happy || state.listening
            ? 'animate-fox-head-bob'
            : undefined;

  return (
    <svg
      viewBox="0 0 240 240"
      className={`${className ?? 'h-40 w-40'} cursor-pointer`}
      role="img"
      aria-label={title ?? state.label}
      onClick={handleTap}
    >
      <defs>
        <linearGradient id="speeko-fur" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffa567" />
          <stop offset="1" stopColor="#ef6a1c" />
        </linearGradient>
        <linearGradient id="speeko-belly" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff8ee" />
          <stop offset="1" stopColor="#ffe8cf" />
        </linearGradient>
        <linearGradient id="speeko-tail-tip" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffd9bd" />
          <stop offset="1" stopColor="#fff6ea" />
        </linearGradient>
        <radialGradient id="speeko-cheek" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ff9d8a" stopOpacity="0.62" />
          <stop offset="1" stopColor="#ff9d8a" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="120" cy="225" rx="66" ry="8.5" fill="#3b2a1f" opacity="0.09" />

      <g
        className={
          celebrate ? 'animate-fox-dance' : happy ? 'animate-fox-hop' : sad ? undefined : 'animate-fox-breathe'
        }
        style={{ transformBox: 'view-box', transformOrigin: '120px 224px' }}
      >
        {/* Feet */}
        <g className={celebrate ? 'animate-toe-tap' : undefined}>
          <ellipse cx="98" cy="218" rx="18" ry="11" fill="url(#speeko-fur)" stroke="#a8420f" strokeWidth="3" />
          <path d="M87 219h7M96 221h7M105 219h6" stroke="#a8420f" strokeWidth="2.2" strokeLinecap="round" opacity="0.55" />
        </g>
        <g className={celebrate ? 'animate-toe-tap-right' : undefined}>
          <ellipse cx="142" cy="218" rx="18" ry="11" fill="url(#speeko-fur)" stroke="#a8420f" strokeWidth="3" />
          <path d="M129 219h6M138 221h7M147 219h7" stroke="#a8420f" strokeWidth="2.2" strokeLinecap="round" opacity="0.55" />
        </g>

        {/* Tail */}
        <g style={tailStyle} className={sad ? undefined : 'animate-wag'}>
          <path
            d="M150 198c36 8 62-13 68-50 2-14 0-27-6-38-7 19-17 31-33 39-15 8-24 20-27 35Z"
            fill="url(#speeko-fur)"
            stroke="#a8420f"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M211 110c6 11 8 24 6 38-2 14-7 26-16 34 9-5 16-17 19-32 3-15 0-29-9-40Z"
            fill="url(#speeko-tail-tip)"
          />
        </g>

        {/* Body */}
        <ellipse cx="120" cy="181" rx="52" ry="43" fill="url(#speeko-fur)" stroke="#a8420f" strokeWidth="3" />
        <ellipse cx="120" cy="190" rx="34" ry="28" fill="url(#speeko-belly)" />

        {/* Arms */}
        <g style={leftArmStyle} className={leftArmClass}>
          <path d="M84 164c-9 9-16 19-19 30" fill="none" stroke="#a8420f" strokeWidth="18" strokeLinecap="round" opacity="0.18" />
          <circle cx="64" cy="194" r="10.5" fill="url(#speeko-fur)" stroke="#a8420f" strokeWidth="3" />
          <path d="M59 199h11" stroke="#a8420f" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        </g>
        <g style={rightArmStyle} className={rightArmClass}>
          <path d="M156 164c9 9 16 19 19 30" fill="none" stroke="#a8420f" strokeWidth="18" strokeLinecap="round" opacity="0.18" />
          <circle cx="176" cy="194" r="10.5" fill="url(#speeko-fur)" stroke="#a8420f" strokeWidth="3" />
          <path d="M171 199h11" stroke="#a8420f" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        </g>

        {/* Ears */}
        <g style={leftEarStyle} className={state.listening ? 'animate-ear-flick' : undefined}>
          <path d="M54 83 66 23q2-7 9-2l25 35Z" fill="url(#speeko-fur)" stroke="#a8420f" strokeWidth="3" strokeLinejoin="round" />
          <path d="M69 69 76 39l16 20Z" fill="#ffc3a1" />
        </g>
        <g style={rightEarStyle} className={state.listening ? 'animate-ear-flick-right' : undefined}>
          <path d="M186 83 174 23q-2-7-9-2l-25 35Z" fill="url(#speeko-fur)" stroke="#a8420f" strokeWidth="3" strokeLinejoin="round" />
          <path d="M171 69 164 39l-16 20Z" fill="#ffc3a1" />
        </g>

        {/* Head */}
        <g style={headStyle} className={headClass}>
          <ellipse cx="120" cy="108" rx="66" ry="58" fill="url(#speeko-fur)" stroke="#a8420f" strokeWidth="3" />

          <path d="M78 150c13 10 27 15 42 15s29-5 42-15l7 21c-15 10-31 15-49 15s-34-5-49-15Z" fill="#37b02c" />
          <path d="M78 150c13 10 27 15 42 15s29-5 42-15l2 6c-14 10-28 15-44 15s-30-5-44-15Z" fill="#58c94d" />
          <circle cx="120" cy="171" r="8.5" fill="#269020" />
          <circle cx="117.5" cy="168.5" r="2.4" fill="#8add7f" />

          <ellipse cx="120" cy="134" rx="39" ry="30" fill="url(#speeko-belly)" />

          {happy ? (
            <>
              <circle cx="76" cy="124" r="15" fill="url(#speeko-cheek)" />
              <circle cx="164" cy="124" r="15" fill="url(#speeko-cheek)" />
            </>
          ) : null}

          {/* Eyes and separate eye highlights (pupils) */}
          {happy ? (
            <>
              <path d="M85 103q11-14 22 0" fill="none" stroke="#2d1f18" strokeWidth="5" strokeLinecap="round" />
              <path d="M133 103q11-14 22 0" fill="none" stroke="#2d1f18" strokeWidth="5" strokeLinecap="round" />
            </>
          ) : (
            <>
              <g>
                <ellipse cx="96" cy="101" rx="8.5" ry="10.5" fill="#2d1f18" />
                <g className={state.listening ? 'animate-pupil-look' : undefined}>
                  <circle cx="99" cy="97.5" r="2.7" fill="#fff8ee" />
                </g>
              </g>
              <g>
                <ellipse cx="144" cy="101" rx="8.5" ry="10.5" fill="#2d1f18" />
                <g className={state.listening ? 'animate-pupil-look-right' : undefined}>
                  <circle cx="147" cy="97.5" r="2.7" fill="#fff8ee" />
                </g>
              </g>
              {!sad ? (
                <>
                  <g className="animate-blink" style={{ transformBox: 'view-box', transformOrigin: '96px 91px' }}>
                    <ellipse cx="96" cy="101" rx="9" ry="10.8" fill="url(#speeko-fur)" />
                  </g>
                  <g className="animate-blink" style={{ transformBox: 'view-box', transformOrigin: '144px 91px' }}>
                    <ellipse cx="144" cy="101" rx="9" ry="10.8" fill="url(#speeko-fur)" />
                  </g>
                </>
              ) : null}
              {sad ? (
                <>
                  <path d="M84 86l21 7" fill="none" stroke="#8a3a12" strokeWidth="3.4" strokeLinecap="round" />
                  <path d="M156 86l-21 7" fill="none" stroke="#8a3a12" strokeWidth="3.4" strokeLinecap="round" />
                  <path d="M87 118q9 6 18 2" fill="none" stroke="#3b82b8" strokeWidth="3" strokeLinecap="round" />
                </>
              ) : null}
            </>
          )}

          <path d="M112 122h16l-8 10Z" fill="#3b2418" stroke="#3b2418" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="116" cy="124.5" r="1.8" fill="#fff8ee" opacity="0.7" />

          {/* Mouth */}
          <g
            className={state.speaking ? 'animate-talk' : undefined}
            style={{ transformBox: 'view-box', transformOrigin: '120px 138px' }}
          >
            {sad ? (
              <path d="M106 145q14-10 28 0" fill="none" stroke="#5c2a12" strokeWidth="4" strokeLinecap="round" />
            ) : happy ? (
              <>
                <path d="M101 133q19 26 38 0Z" fill="#6d2b16" stroke="#5c2a12" strokeWidth="2" strokeLinejoin="round" />
                <path d="M110 148q10 9 20 0q-10 12-20 0Z" fill="#ff8f8f" />
              </>
            ) : (
              <>
                <path d="M106 137q14 10 28 0" fill="#6d2b16" stroke="#5c2a12" strokeWidth="3.5" strokeLinejoin="round" />
                <path d="M111 146q9 6 18 0q-9 9-18 0Z" fill="#ff8f8f" opacity="0.85" />
              </>
            )}
          </g>

          {accessory === 'scarf' ? (
            <path d="M78 150c13 10 27 15 42 15s29-5 42-15l3 9c-15 11-29 16-45 16s-30-5-45-16Z" fill="#37b02c" stroke="#269020" strokeWidth="2.5" strokeLinejoin="round" />
          ) : null}
          {accessory === 'hat' ? (
            <g>
              <path d="M62 92h116l-18-34H80Z" className="fill-gold-200 stroke-gold-700" strokeWidth="3" strokeLinejoin="round" />
              <circle cx="120" cy="58" r="8" className="fill-gold-700" />
            </g>
          ) : null}
          {accessory === 'glasses' ? (
            <g className="stroke-bark-800" strokeWidth="3" fill="none">
              <circle cx="96" cy="101" r="16" />
              <circle cx="144" cy="101" r="16" />
              <path d="M112 101h16" />
            </g>
          ) : null}
        </g>

        {celebrate ? (
          <g aria-hidden="true" className="animate-sparkle">
            <path d="M38 96l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="#ffd66b" />
            <path d="M204 128l2.4 5.6 5.6 2.4-5.6 2.4-2.4 5.6-2.4-5.6-5.6-2.4 5.6-2.4Z" fill="#8add7f" />
            <circle cx="50" cy="150" r="3.4" fill="#ff9d8a" />
            <circle cx="196" cy="82" r="3" fill="#9ccdf4" />
          </g>
        ) : null}
      </g>
    </svg>
  );
}
