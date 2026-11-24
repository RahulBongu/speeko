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
  speaking?: boolean;
  listening?: boolean;
  onTap?: () => void;
}

/**
 * Speeko the fox — the web counterpart of the mobile vector rig.
 *
 * Artwork follows the supplied illustration: large glossy eyes, wide cream
 * muzzle, pointed warm ears, fluffy cream-tipped tail, dark paws and a teal
 * scarf. Independent SVG groups are animated with CSS keyframes; the semantic
 * mood comes from @speeko/core so web and mobile stay in sync.
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

  useEffect(() => { setTapped(false); }, [semanticMood, speaking, listening]);

  useEffect(() => {
    if (semanticMood !== 'sad' && semanticMood !== 'incorrect') {
      setEncouraging(false);
      return;
    }
    setEncouraging(false);
    const toEncourage = setTimeout(() => setEncouraging(true), 850);
    const back = setTimeout(() => setEncouraging(false), 2100);
    return () => { clearTimeout(toEncourage); clearTimeout(back); };
  }, [semanticMood]);

  useEffect(() => {
    if (!tapped) return;
    const timer = setTimeout(() => setTapped(false), 720);
    return () => clearTimeout(timer);
  }, [tapped]);

  const handleTap = useCallback(() => {
    setTapped(true);
    onTap?.();
  }, [onTap]);

  const happy = state.mood === 'happy' || state.mood === 'celebrate';
  const sad = state.mood === 'sad';
  const celebrate = state.animation === 'celebrate';
  const wave = state.waving || celebrate || state.animation === 'bounce';

  const rootClass = celebrate
    ? 'animate-fox-hop'
    : happy
      ? 'animate-fox-hop'
      : sad
        ? ''
        : 'animate-fox-breathe';

  const headClass = celebrate
    ? 'animate-fox-cheer'
    : state.animation === 'confused'
      ? 'animate-fox-confused'
      : wave
        ? 'animate-fox-wave'
        : state.mood === 'encouraging'
          ? 'animate-fox-nod'
          : happy || state.listening
            ? 'animate-fox-head-bob'
            : '';

  const tailClass = sad ? '' : 'animate-wag';
  const leftArmClass = wave ? 'animate-arm-cheer' : confusedOrIdle(sad, state);
  const rightArmClass = celebrate
    ? 'animate-arm-cheer-right'
    : wave || sad
      ? ''
      : 'animate-arm-sway-right';

  const leftEarClass = state.listening ? 'animate-ear-flick' : '';
  const rightEarClass = state.listening ? 'animate-ear-flick-right' : '';

  const headStyle: CSSProperties = { transformBox: 'view-box', transformOrigin: '120px 150px' };
  const tailStyle: CSSProperties = { transformBox: 'view-box', transformOrigin: '150px 190px' };
  const leftEarStyle: CSSProperties = { transformBox: 'view-box', transformOrigin: '62px 74px', transition: 'transform .3s ease' };
  const rightEarStyle: CSSProperties = { transformBox: 'view-box', transformOrigin: '178px 74px', transition: 'transform .3s ease' };
  const leftArmStyle: CSSProperties = { transformBox: 'view-box', transformOrigin: '90px 160px', transition: 'transform .3s ease' };
  const rightArmStyle: CSSProperties = { transformBox: 'view-box', transformOrigin: '150px 160px', transition: 'transform .3s ease' };
  const mouthStyle: CSSProperties = { transformBox: 'view-box', transformOrigin: '120px 140px' };

  return (
    <svg
      viewBox="0 0 240 240"
      className={`${className ?? 'h-40 w-40'} cursor-pointer`}
      role="img"
      aria-label={title ?? state.label}
      onClick={handleTap}
    >
      <defs>
        <linearGradient id="fox-fur" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFB067" />
          <stop offset="1" stopColor="#F4761A" />
        </linearGradient>
        <linearGradient id="fox-cream" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFDF6" />
          <stop offset="1" stopColor="#FFE6C2" />
        </linearGradient>
        <radialGradient id="fox-blush" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FF9D8A" stopOpacity="0.5" />
          <stop offset="1" stopColor="#FF9D8A" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="120" cy="232" rx="68" ry="7" fill="#3F2A1D" opacity="0.09" />

      <g className={rootClass} style={{ transformBox: 'view-box', transformOrigin: '120px 224px' }}>
        {/* Tail */}
        <g style={tailStyle} className={tailClass}>
          <path
            d="M150 190 C176 197 204 189 220 166 C233 148 233 122 220 103 C216 128 204 145 186 155 C168 165 156 176 150 190 Z"
            fill="url(#fox-fur)"
            stroke="#4A2B1B"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path
            d="M220 103 C226 116 228 130 225 145 C221 133 214 124 206 118 C214 114 219 109 220 103 Z"
            fill="url(#fox-cream)"
            stroke="#4A2B1B"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </g>

        {/* Feet */}
        <ellipse cx="92" cy="224" rx="21" ry="11" fill="#4A2B1B" />
        <ellipse cx="146" cy="224" rx="21" ry="11" fill="#4A2B1B" />
        <path d="M80 226h8M90 229h8M100 226h8M134 226h8M144 229h8M154 226h8" stroke="#2E1A10" strokeWidth="2" strokeLinecap="round" opacity={0.7} />

        {/* Body */}
        <ellipse cx="120" cy="184" rx="52" ry="42" fill="url(#fox-fur)" stroke="#4A2B1B" strokeWidth="4" />
        <path
          d="M96 156 C104 150 136 150 144 156 L150 178 L143 176 L147 198 L137 194 L132 214 L120 206 L108 214 L103 194 L93 198 L97 176 L90 178 Z"
          fill="url(#fox-cream)"
        />

        {/* Arms */}
        <g style={leftArmStyle} className={leftArmClass}>
          <path d="M90 160 C78 150 66 136 56 122" fill="none" stroke="#F4761A" strokeWidth="20" strokeLinecap="round" />
          <path d="M90 160 C78 150 66 136 56 122" fill="none" stroke="#4A2B1B" strokeWidth="4" strokeLinecap="round" opacity="0.35" />
          <circle cx="52" cy="116" r="16" fill="#4A2B1B" />
          <circle cx="45" cy="110" r="3.2" fill="#8B5A3C" />
          <circle cx="54" cy="106" r="3.2" fill="#8B5A3C" />
          <circle cx="62" cy="112" r="3.2" fill="#8B5A3C" />
          <circle cx="52" cy="121" r="4.5" fill="#8B5A3C" />
        </g>
        <g style={rightArmStyle} className={rightArmClass}>
          <path d="M150 160 C162 170 172 180 180 188" fill="none" stroke="#F4761A" strokeWidth="20" strokeLinecap="round" />
          <path d="M150 160 C162 170 172 180 180 188" fill="none" stroke="#4A2B1B" strokeWidth="4" strokeLinecap="round" opacity="0.35" />
          <circle cx="182" cy="192" r="15" fill="#4A2B1B" />
          <path d="M174 190h16" stroke="#2E1A10" strokeWidth="2.4" strokeLinecap="round" opacity={0.7} />
        </g>

        {/* Ears */}
        <g style={leftEarStyle} className={leftEarClass}>
          <path d="M50 82 L38 18 Q36 10 44 14 L86 52 Z" fill="url(#fox-fur)" stroke="#4A2B1B" strokeWidth="4" strokeLinejoin="round" />
          <path d="M58 70 L50 30 L78 58 Z" fill="#FFE3C6" />
        </g>
        <g style={rightEarStyle} className={rightEarClass}>
          <path d="M190 82 L202 18 Q204 10 196 14 L154 52 Z" fill="url(#fox-fur)" stroke="#4A2B1B" strokeWidth="4" strokeLinejoin="round" />
          <path d="M182 70 L190 30 L162 58 Z" fill="#FFE3C6" />
        </g>

        {/* Head */}
        <g style={headStyle} className={headClass}>
          <path
            d="M120 40 C158 40 186 66 186 102 C186 134 160 154 120 154 C80 154 54 134 54 102 C54 66 82 40 120 40 Z"
            fill="url(#fox-fur)"
            stroke="#4A2B1B"
            strokeWidth="4"
          />
          <path d="M96 44 Q108 28 120 40 Q134 26 144 44 Q132 38 120 46 Q108 38 96 44 Z" fill="#F4761A" />

          {/* Muzzle */}
          <path
            d="M64 106 C64 94 80 90 94 96 C104 100 112 104 120 104 C128 104 136 100 146 96 C160 90 176 94 176 106 C176 128 156 144 120 144 C84 144 64 128 64 106 Z"
            fill="url(#fox-cream)"
            stroke="#4A2B1B"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M52 112 L66 108 L60 120 Z" fill="url(#fox-cream)" stroke="#4A2B1B" strokeWidth="2" strokeLinejoin="round" />
          <path d="M188 112 L174 108 L180 120 Z" fill="url(#fox-cream)" stroke="#4A2B1B" strokeWidth="2" strokeLinejoin="round" />

          {happy ? (
            <>
              <circle cx="74" cy="110" r="12" fill="url(#fox-blush)" />
              <circle cx="166" cy="110" r="12" fill="url(#fox-blush)" />
            </>
          ) : null}

          {/* Eyes */}
          <ellipse cx="92" cy="96" rx="20" ry="24" fill="#FFFFFF" stroke="#4A2B1B" strokeWidth="3" />
          <ellipse cx="148" cy="96" rx="20" ry="24" fill="#FFFFFF" stroke="#4A2B1B" strokeWidth="3" />
          <circle cx="94" cy="98" r="14" fill="#7A3B16" />
          <circle cx="146" cy="98" r="14" fill="#7A3B16" />
          <circle cx="94" cy="98" r="7" fill="#2E1A10" />
          <circle cx="146" cy="98" r="7" fill="#2E1A10" />
          <g className={state.listening ? 'animate-pupil-look' : ''}>
            <circle cx="94" cy="98" r="4" fill="#FFFFFF" />
          </g>
          <g className={state.listening ? 'animate-pupil-look-right' : ''}>
            <circle cx="146" cy="98" r="4" fill="#FFFFFF" />
          </g>
          <circle cx="99" cy="106" r="2" fill="#FFFFFF" opacity="0.8" />
          <circle cx="151" cy="106" r="2" fill="#FFFFFF" opacity="0.8" />
          {!sad ? (
            <>
              <g className="animate-blink" style={{ transformBox: 'view-box', transformOrigin: '92px 96px' }}>
                <ellipse cx="92" cy="96" rx="21" ry="24" fill="url(#fox-fur)" />
              </g>
              <g className="animate-blink" style={{ transformBox: 'view-box', transformOrigin: '148px 96px' }}>
                <ellipse cx="148" cy="96" rx="21" ry="24" fill="url(#fox-fur)" />
              </g>
            </>
          ) : null}
          {sad ? (
            <>
              <path d="M76 68l16 6" fill="none" stroke="#8A3A12" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M164 68l-16 6" fill="none" stroke="#8A3A12" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M100 122q10 6 20 0" fill="none" stroke="#3B82B8" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : (
            <>
              <path d="M76 68 Q92 58 108 68" fill="none" stroke="#4A2B1B" strokeWidth="5" strokeLinecap="round" />
              <path d="M132 68 Q148 58 164 68" fill="none" stroke="#4A2B1B" strokeWidth="5" strokeLinecap="round" />
            </>
          )}

          {/* Nose */}
          <path d="M112 120 Q120 116 128 120 Q126 130 120 132 Q114 130 112 120 Z" fill="#4A2B1B" />

          {/* Mouth */}
          <g className={state.speaking ? 'animate-talk' : ''} style={mouthStyle}>
            {sad ? (
              <path d="M106 140 Q120 132 134 140" fill="none" stroke="#5C2A12" strokeWidth="4" strokeLinecap="round" />
            ) : happy ? (
              <>
                <path d="M102 136 Q120 154 138 136 Q136 160 120 164 Q104 160 102 136 Z" fill="#5C2A12" stroke="#4A2B1B" strokeWidth="3" strokeLinejoin="round" />
                <path d="M110 152 Q120 147 130 152 Q126 164 120 166 Q114 164 110 152 Z" fill="#FF8F8F" />
              </>
            ) : (
              <>
                <path d="M108 138 Q120 148 132 138" fill="none" stroke="#5C2A12" strokeWidth="4" strokeLinecap="round" />
                <path d="M111 146 Q120 151 129 146 Q120 156 111 146 Z" fill="#FF8F8F" opacity="0.85" />
              </>
            )}
          </g>

          {accessory === 'glasses' ? (
            <g className="stroke-bark-800" strokeWidth="3" fill="none">
              <circle cx="92" cy="96" r="20" />
              <circle cx="148" cy="96" r="20" />
              <path d="M112 96h16" />
            </g>
          ) : null}
          {accessory === 'hat' ? (
            <g>
              <path d="M62 92h116l-18-34H80Z" className="fill-gold-200 stroke-gold-700" strokeWidth="3" strokeLinejoin="round" />
              <circle cx="120" cy="58" r="8" className="fill-gold-700" />
            </g>
          ) : null}
        </g>

        {/* Teal scarf with knot and tails */}
        <g>
          <path d="M80 150 C96 162 144 162 160 150 L168 170 C150 184 90 184 72 170 Z" fill="#159CA6" stroke="#0E6F78" strokeWidth="3" strokeLinejoin="round" />
          <path d="M96 156 C110 164 130 164 144 156 L148 164 C132 174 108 174 92 164 Z" fill="#4ABFC7" />
          <circle cx="160" cy="158" r="11" fill="#0E7C86" stroke="#0E6F78" strokeWidth="3" />
          <path d="M164 162 L196 176 L186 190 L158 174 Z" fill="#159CA6" stroke="#0E6F78" strokeWidth="3" strokeLinejoin="round" />
          <path d="M158 166 L184 198 L172 202 L152 174 Z" fill="#0E7C86" stroke="#0E6F78" strokeWidth="3" strokeLinejoin="round" />
        </g>

        {celebrate ? (
          <g aria-hidden="true" className="animate-sparkle">
            <path d="M36 92 L40 102 L50 106 L40 110 L36 120 L32 110 L22 106 L32 102 Z" fill="#FBBF24" />
            <path d="M204 120 L207 128 L215 131 L207 134 L204 142 L201 134 L193 131 L201 128 Z" fill="#8ADD7F" />
          </g>
        ) : null}
      </g>
    </svg>
  );
}

function confusedOrIdle(sad: boolean, state: ReturnType<typeof resolveFoxAnimation>): string {
  return sad || state.animation === 'confused' ? '' : 'animate-arm-sway';
}
