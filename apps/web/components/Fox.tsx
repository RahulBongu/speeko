'use client';

import type { CSSProperties } from 'react';
import { useCallback, useEffect, useId, useState } from 'react';
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
  accessory?: string | null;
  speaking?: boolean;
  listening?: boolean;
  patrol?: boolean;
  /** Normalized target direction (`-1..1`) for eye & head tracking. */
  lookAt?: { x: number; y: number } | null;
  /** Consecutive correct answers; escalates leap energy at 3+ and 5+. */
  combo?: number;
  onTap?: () => void;
}

/**
 * Speeko the fox — Duolingo-inspired vector character faithfully matching
 * `design/reference/fox-mascot-reference.png` and `@speeko/core`'s state machine.
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
  const uid = useId().replace(/:/g, '');
  const furGrad = `fox-fur-${uid}`;
  const creamGrad = `fox-cream-${uid}`;
  const earGrad = `fox-ear-${uid}`;

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
    combo,
  });

  useEffect(() => {
    setTapped(false);
  }, [semanticMood, speaking, listening]);

  useEffect(() => {
    if (semanticMood !== 'sad' && semanticMood !== 'incorrect') {
      setEncouraging(false);
      return;
    }
    setEncouraging(false);
    const toEncourage = window.setTimeout(() => setEncouraging(true), 850);
    const back = window.setTimeout(() => setEncouraging(false), 2100);
    return () => {
      window.clearTimeout(toEncourage);
      window.clearTimeout(back);
    };
  }, [semanticMood]);

  useEffect(() => {
    if (!tapped) return;
    const timer = window.setTimeout(() => setTapped(false), 820);
    return () => window.clearTimeout(timer);
  }, [tapped]);

  const handleTap = useCallback(() => {
    setTapped(true);
    onTap?.();
  }, [onTap]);

  const decorative = !onTap && !title;
  const happy = state.mood === 'happy' || state.mood === 'celebrate' || state.mood === 'encouraging';
  const sad = state.mood === 'sad';
  const celebrate = state.animation === 'celebrate';
  const jumping = state.animation === 'bounce' || state.animation === 'celebrate' || state.waving;
  const scarfMode = accessory === 'scarf' ? 'green' : 'teal';

  const bodyAnim = celebrate
    ? 'animate-fox-dance'
    : state.animation === 'bounce'
      ? state.intensity === 'ultra'
        ? 'animate-fox-hop-ultra'
        : state.intensity === 'super'
          ? 'animate-fox-hop-super'
          : 'animate-fox-hop'
      : state.animation === 'confused'
        ? 'animate-fox-confused'
        : state.animation === 'nod'
          ? 'animate-fox-nod'
          : state.animation === 'wave'
            ? 'animate-fox-hop'
            : patrol
              ? 'animate-fox-patrol'
              : 'animate-fox-breathe';

  const shadowAnim =
    jumping
      ? 'animate-fox-shadow-hop'
      : patrol
        ? 'animate-fox-shadow-patrol'
        : '';

  const headAnim = state.listening
    ? 'animate-fox-head-bob'
    : state.mood === 'celebrate'
      ? 'animate-fox-head-dance'
      : state.animation === 'bounce'
        ? 'animate-fox-cheer'
        : '';

  const leftArmAnim = state.waving
    ? 'animate-arm-wave'
    : celebrate || state.animation === 'bounce'
      ? 'animate-arm-cheer'
      : sad || state.animation === 'confused'
        ? ''
        : 'animate-arm-sway';

  const rightArmAnim = celebrate || state.animation === 'bounce'
    ? 'animate-arm-cheer-right'
    : sad || state.animation === 'confused'
      ? ''
      : 'animate-arm-sway-right';

  const center = (cx: number, cy: number): CSSProperties => ({
    transformBox: 'view-box',
    transformOrigin: `${cx}px ${cy}px`,
  });

  const tailStyle = center(152, 188);
  const headStyle: CSSProperties = {
    ...center(120, 144),
    animationDelay: jumping ? '55ms' : undefined,
  };
  const leftEarStyle: CSSProperties = {
    ...center(72, 68),
    animationDelay: jumping ? '75ms' : undefined,
  };
  const rightEarStyle: CSSProperties = {
    ...center(168, 68),
    animationDelay: jumping ? '75ms' : undefined,
  };
  const bandanaTailStyle: CSSProperties = {
    ...center(150, 147),
    animationDelay: jumping || patrol ? '90ms' : undefined,
  };
  const leftArmStyle = center(86, 154);
  const rightArmStyle = center(148, 156);
  const mouthStyle = center(120, 130);
  const leftLidStyle = center(96, 91);
  const rightLidStyle = center(144, 91);

  const gazeX = lookAt ? Math.max(-1, Math.min(1, lookAt.x)) : 0;
  const gazeY = lookAt ? Math.max(-1, Math.min(1, lookAt.y)) : 0;
  const eyeGazeStyle: CSSProperties = {
    transform: lookAt ? `translate(${(gazeX * 3.8).toFixed(2)}px, ${(gazeY * 2.8).toFixed(2)}px)` : undefined,
    transition: 'transform 130ms ease-out',
  };
  const headGazeStyle: CSSProperties = {
    ...center(120, 144),
    transform: lookAt ? `rotate(${(gazeX * 3.4).toFixed(2)}deg)` : undefined,
    transition: 'transform 160ms ease-out',
  };
  const scarfFlutterAnim = jumping || patrol ? 'animate-bandana-flutter' : '';

  return (
    <svg
      viewBox="0 0 240 240"
      className={`${className ?? 'h-32 w-32'} overflow-visible motion-reduce:animate-none ${
        onTap ? 'cursor-pointer select-none focus:outline-none focus-visible:ring-4 focus-visible:ring-speeko-300 rounded-2xl' : ''
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
      {title && !onTap ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={furGrad} x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0%" stopColor="#FF8124" />
          <stop offset="60%" stopColor="#FA640D" />
          <stop offset="100%" stopColor="#E14B00" />
        </linearGradient>
        <linearGradient id={creamGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF5E6" />
          <stop offset="100%" stopColor="#FCDAB0" />
        </linearGradient>
        <linearGradient id={earGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FBE0C4" />
          <stop offset="100%" stopColor="#F0BC90" />
        </linearGradient>
      </defs>

      {/* Dynamic ground shadow reacting to leaps & patrols */}
      <ellipse
        cx="122"
        cy="231"
        rx="64"
        ry="7.5"
        fill="#2A1208"
        opacity="0.16"
        className={shadowAnim}
        style={center(122, 231)}
      />

      {/* Full body Rig */}
      <g className={bodyAnim} style={center(120, 224)}>
        {/* Bushy fluffy orange & cream-tip tail */}
        <g
          className={sad ? '' : 'animate-wag'}
          style={{ ...tailStyle, animationDuration: jumping ? '0.45s' : '1.15s' }}
        >
          <path
            d="M148 188 C178 198 208 186 222 158 C234 132 230 98 214 82 C202 74 180 86 168 110 C158 130 156 164 148 188 Z"
            fill={`url(#${furGrad})`}
            stroke="#3B170A"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <path
            d="M214 82 C226 94 231 112 228 130 L214 118 L206 130 L195 117 L184 128 C189 102 200 84 214 82 Z"
            fill={`url(#${creamGrad})`}
            stroke="#3B170A"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
        </g>

        {/* Legs & dark chocolate paws/boots */}
        <g className={celebrate || patrol ? 'animate-toe-tap' : ''}>
          <path
            d="M84 188 C78 202 79 218 82 224 C86 228 106 228 108 221 C110 214 108 196 106 186 Z"
            fill={`url(#${furGrad})`}
            stroke="#3B170A"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <path
            d="M80 206 C86 202 98 202 106 208 L108 222 C108 230 74 232 70 223 C67 217 73 210 80 206 Z"
            fill="#4A1C0E"
            stroke="#2A1008"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
        </g>
        <g className={celebrate || patrol ? 'animate-toe-tap-right' : ''}>
          <path
            d="M134 186 C132 198 134 216 136 223 C139 229 162 229 164 221 C166 213 160 198 154 188 Z"
            fill={`url(#${furGrad})`}
            stroke="#3B170A"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <path
            d="M136 208 C144 202 154 202 161 206 C168 210 175 217 172 224 C168 232 136 230 136 222 Z"
            fill="#4A1C0E"
            stroke="#2A1008"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
        </g>

        {/* Torso & fluffy scalloped cream chest fur */}
        <path
          d="M86 146 C86 138 154 138 154 146 C158 172 154 202 120 204 C86 202 82 172 86 146 Z"
          fill={`url(#${furGrad})`}
          stroke="#3B170A"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M100 150 L140 150 C142 162 146 168 139 172 L144 185 L134 183 L128 199 L120 191 L112 199 L106 183 L96 185 L101 172 C94 168 98 162 100 150 Z"
          fill={`url(#${creamGrad})`}
        />

        {/* Waving Left Arm + cute paw pads (faithful to reference pose) */}
        <g className={leftArmAnim} style={leftArmStyle}>
          <path
            d="M86 154 C72 154 58 144 50 128"
            fill="none"
            stroke="#3B170A"
            strokeWidth="22"
            strokeLinecap="round"
          />
          <path
            d="M86 154 C72 154 58 144 50 128"
            fill="none"
            stroke={`url(#${furGrad})`}
            strokeWidth="15.5"
            strokeLinecap="round"
          />
          <circle cx="46" cy="122" r="16" fill="#4A1C0E" stroke="#2A1008" strokeWidth="3.2" />
          <circle cx="36" cy="109" r="4.5" fill="#4A1C0E" stroke="#2A1008" strokeWidth="2.4" />
          <circle cx="44" cy="105" r="4.5" fill="#4A1C0E" stroke="#2A1008" strokeWidth="2.4" />
          <circle cx="54" cy="107" r="4.5" fill="#4A1C0E" stroke="#2A1008" strokeWidth="2.4" />
          <circle cx="61" cy="114" r="4.5" fill="#4A1C0E" stroke="#2A1008" strokeWidth="2.4" />
          <ellipse cx="46" cy="124" rx="6" ry="5" fill="#8C5341" />
          <circle cx="38" cy="112" r="2" fill="#8C5341" />
          <circle cx="45" cy="109" r="2" fill="#8C5341" />
          <circle cx="53" cy="111" r="2" fill="#8C5341" />
        </g>

        {/* Right Arm on hip / raises on victory jump */}
        <g className={rightArmAnim} style={rightArmStyle}>
          <path
            d="M148 156 C164 162 170 174 160 184"
            fill="none"
            stroke="#3B170A"
            strokeWidth="22"
            strokeLinecap="round"
          />
          <path
            d="M148 156 C164 162 170 174 160 184"
            fill="none"
            stroke={`url(#${furGrad})`}
            strokeWidth="15.5"
            strokeLinecap="round"
          />
          <circle cx="155" cy="186" r="14" fill="#4A1C0E" stroke="#2A1008" strokeWidth="3.2" />
        </g>

        {/* Bandana or Shop Green Scarf (trailing knot lags body jump cleanly) */}
        {scarfMode === 'green' ? (
          <g>
            <path
              d="M84 139 C104 150 136 150 156 139 L161 154 C140 165 100 165 79 154 Z"
              fill="#16A34A"
              stroke="#14532D"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path d="M90 147 C110 154 130 154 150 147" fill="none" stroke="#86EFAC" strokeWidth="3" strokeLinecap="round" />
            <g className={scarfFlutterAnim} style={bandanaTailStyle}>
              <path d="M138 148 L164 176 L146 184 L130 158 Z" fill="#15803D" stroke="#14532D" strokeWidth="3" strokeLinejoin="round" />
            </g>
            <path d="M100 156 L120 178 L142 156 Z" fill="#22C55E" stroke="#14532D" strokeWidth="3" strokeLinejoin="round" />
          </g>
        ) : (
          <g>
            <path
              d="M88 139 C104 148 136 148 152 139 L154 150 L120 176 L86 150 Z"
              fill="#009BAE"
              stroke="#094854"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path d="M94 146 L120 168 L146 146" fill="none" stroke="#1CC4D8" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
            <g className={scarfFlutterAnim} style={bandanaTailStyle}>
              <path
                d="M148 143 C162 141 178 146 184 154 L166 156 L176 169 L154 162 Z"
                fill="#008C9E"
                stroke="#094854"
                strokeWidth="2.8"
                strokeLinejoin="round"
              />
              <circle cx="150" cy="147" r="7" fill="#007C8E" stroke="#094854" strokeWidth="2.6" />
            </g>
          </g>
        )}

        {/* Animated Head & Ears + gaze turn */}
        <g style={headGazeStyle}>
        <g className={headAnim} style={headStyle}>
          {/* Pointed ears with dark chocolate tips & warm inner tufts */}
          <g className={sad ? '' : 'animate-ear-flick'} style={leftEarStyle}>
            <path
              d="M60 88 C50 62 50 30 58 20 C68 18 92 34 102 58 Z"
              fill={`url(#${furGrad})`}
              stroke="#3B170A"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            <path d="M52 44 C52 30 54 22 58 20 C66 18 78 24 88 34 L74 36 L65 30 L60 41 Z" fill="#3B170A" />
            <path d="M68 82 C60 62 60 44 64 36 C74 38 86 50 92 64 L80 62 L75 74 Z" fill={`url(#${earGrad})`} />
          </g>
          <g className={sad ? '' : 'animate-ear-flick-right'} style={rightEarStyle}>
            <path
              d="M180 88 C190 62 190 30 182 20 C172 18 148 34 138 58 Z"
              fill={`url(#${furGrad})`}
              stroke="#3B170A"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            <path d="M188 44 C188 30 186 22 182 20 C174 18 162 24 152 34 L166 36 L175 30 L180 41 Z" fill="#3B170A" />
            <path d="M172 82 C180 62 180 44 176 36 C166 38 154 50 148 64 L160 62 L165 74 Z" fill={`url(#${earGrad})`} />
          </g>

          {/* Rounded fox face cranium */}
          <path
            d="M120 42 C158 42 182 66 182 96 C182 128 154 146 120 146 C86 146 58 128 58 96 C58 66 82 42 120 42 Z"
            fill={`url(#${furGrad})`}
            stroke="#3B170A"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Forehead tuft */}
          <path
            d="M104 45 C106 32 114 28 119 37 C124 27 134 30 135 42 C127 38 116 42 104 45 Z"
            fill="#FF8124"
            stroke="#3B170A"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />

          {/* Fluffy cheek fur + cream muzzle */}
          <path
            d="M58 98 L45 104 L57 110 L50 116 C64 132 90 146 120 146 C150 146 176 132 190 116 L183 110 L195 104 L182 98 C168 100 156 108 140 106 C131 104 126 100 120 100 C114 100 109 104 100 106 C84 108 72 100 58 98 Z"
            fill={`url(#${creamGrad})`}
            stroke="#3B170A"
            strokeWidth="3.3"
            strokeLinejoin="round"
          />

          {happy ? (
            <>
              <ellipse cx="75" cy="115" rx="9" ry="5" fill="#FF8C7A" opacity="0.45" />
              <ellipse cx="165" cy="115" rx="9" ry="5" fill="#FF8C7A" opacity="0.45" />
            </>
          ) : null}

          {/* Glossy Expressive Eyes (follow lookAt target cleanly) */}
          <ellipse cx="96" cy="91" rx="16.5" ry="20" fill="#FFFFFF" stroke="#3B170A" strokeWidth="3.2" />
          <ellipse cx="144" cy="91" rx="16.5" ry="20" fill="#FFFFFF" stroke="#3B170A" strokeWidth="3.2" />
          <g style={eyeGazeStyle}>
            <g className={!lookAt && (state.listening || patrol) ? 'animate-pupil-look' : ''}>
              <circle cx="97" cy="92" r="12.5" fill="#3A180B" />
              <circle cx="97" cy="93" r="6.5" fill="#180A05" />
              <circle cx="102" cy="84" r="4.5" fill="#FFFFFF" />
              <circle cx="93" cy="98" r="2.2" fill="#FFFFFF" opacity="0.85" />
            </g>
            <g className={!lookAt && (state.listening || patrol) ? 'animate-pupil-look-right' : ''}>
              <circle cx="143" cy="92" r="12.5" fill="#3A180B" />
              <circle cx="143" cy="93" r="6.5" fill="#180A05" />
              <circle cx="148" cy="84" r="4.5" fill="#FFFFFF" />
              <circle cx="139" cy="98" r="2.2" fill="#FFFFFF" opacity="0.85" />
            </g>
          </g>

          {/* Animated natural blink lids (default scale-y-0 so reduced-motion keeps eyes open) */}
          <ellipse cx="96" cy="91" rx="17" ry="20.5" fill="#FA640D" className="animate-blink scale-y-0 motion-reduce:animate-none" style={leftLidStyle} />
          <ellipse cx="144" cy="91" rx="17" ry="20.5" fill="#FA640D" className="animate-blink scale-y-0 motion-reduce:animate-none" style={rightLidStyle} />

          {/* Expressive Eyebrows */}
          {sad ? (
            <>
              <path d="M81 66 Q94 69 107 62" fill="none" stroke="#3B170A" strokeWidth="4.2" strokeLinecap="round" />
              <path d="M133 62 Q146 69 159 66" fill="none" stroke="#3B170A" strokeWidth="4.2" strokeLinecap="round" />
            </>
          ) : (
            <>
              <path d="M80 65 Q95 57 109 64" fill="none" stroke="#3B170A" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M131 64 Q145 57 160 65" fill="none" stroke="#3B170A" strokeWidth="4.5" strokeLinecap="round" />
            </>
          )}

          {/* Reading glasses cosmetic */}
          {accessory === 'glasses' ? (
            <g className="stroke-bark-800" strokeWidth="3.4" fill="none">
              <circle cx="96" cy="91" r="20" />
              <circle cx="144" cy="91" r="20" />
              <path d="M116 90 Q120 87 124 90" strokeLinecap="round" />
            </g>
          ) : null}

          {/* Party hat perched cleanly atop head (never overlaps eyes) */}
          {accessory === 'hat' ? (
            <g>
              <path d="M98 46 L120 4 L142 46 Z" fill="#1CB0F6" stroke="#0B4A6F" strokeWidth="3" strokeLinejoin="round" />
              <path d="M107 32 L133 32" stroke="#FCD34D" strokeWidth="5" strokeLinecap="round" />
              <circle cx="120" cy="4" r="6" fill="#FDE047" stroke="#0B4A6F" strokeWidth="2.5" />
            </g>
          ) : null}

          {/* Cute Nose + Open Smile / Talking Mouth */}
          <path
            d="M111 108 C115 105 125 105 129 108 C129 114 123 117 120 117 C117 117 111 114 111 108 Z"
            fill="#3B170A"
          />
          <g className={state.speaking ? 'animate-talk' : ''} style={mouthStyle}>
            {sad ? (
              <path d="M110 131 Q120 124 130 131" fill="none" stroke="#3B170A" strokeWidth="3.4" strokeLinecap="round" />
            ) : (
              <>
                <path
                  d="M104 122 Q120 130 136 122 C135 136 128 141 120 141 C112 141 105 136 104 122 Z"
                  fill="#66141A"
                  stroke="#3B170A"
                  strokeWidth="2.8"
                  strokeLinejoin="round"
                />
                <path d="M112 132 Q120 128 128 132 Q124 139 120 139 Q116 139 112 132 Z" fill="#FA7268" />
              </>
            )}
          </g>
        </g>
        </g>

        {/* Celebration / victory jump sparkles (escalate on combos) */}
        {jumping ? (
          <g aria-hidden="true" className="animate-sparkle">
            <path d="M30 56 L33 65 L42 68 L33 71 L30 80 L27 71 L18 68 L27 65 Z" fill="#FBBF24" />
            <path d="M210 56 L213 65 L222 68 L213 71 L210 80 L207 71 L198 68 L207 65 Z" fill="#58CC02" />
            <circle cx="44" cy="40" r="4" fill="#38BDF8" />
            <circle cx="198" cy="42" r="4" fill="#FBBF24" />
            {state.intensity !== 'normal' ? (
              <>
                <path d="M120 12 L123 20 L131 23 L123 26 L120 34 L117 26 L109 23 L117 20 Z" fill="#FBBF24" />
                <circle cx="24" cy="94" r="4.5" fill="#58CC02" />
                <circle cx="216" cy="94" r="4.5" fill="#38BDF8" />
              </>
            ) : null}
          </g>
        ) : null}
      </g>
    </svg>
  );
}

export default Fox;
