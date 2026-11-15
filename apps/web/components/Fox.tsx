'use client';

import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const RiveLayer = dynamic(() => import('./RiveLayer').then((module) => module.RiveLayer), {
  ssr: false,
});

export type FoxMood = 'idle' | 'happy' | 'sad' | 'celebrate';

export interface FoxProps {
  mood?: FoxMood;
  className?: string;
  title?: string;
  riveSrc?: string;
}

const MOOD_LABEL: Record<FoxMood, string> = {
  idle: 'Speeko the fox, ready to learn',
  happy: 'Speeko the fox, delighted',
  sad: 'Speeko the fox, a little disappointed',
  celebrate: 'Speeko the fox, celebrating',
};

/**
 * Speeko, the original mascot. Drawn as inline SVG so expressions and motion
 * stay lightweight; a Rive rig can replace this later without touching the
 * surrounding UI.
 */
export function Fox({ mood = 'idle', className, title, riveSrc }: FoxProps) {
  const resolvedRiveSrc = riveSrc ?? process.env.NEXT_PUBLIC_RIVE_FOX_URL;
  const [riveAvailable, setRiveAvailable] = useState(Boolean(resolvedRiveSrc) === false);

  useEffect(() => {
    if (!resolvedRiveSrc) {
      setRiveAvailable(false);
      return;
    }
    let cancelled = false;
    fetch(resolvedRiveSrc, { method: 'HEAD' })
      .then((response) => {
        if (!cancelled) setRiveAvailable(response.ok);
      })
      .catch(() => {
        if (!cancelled) setRiveAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, [resolvedRiveSrc]);

  const happy = mood === 'happy' || mood === 'celebrate';
  const sad = mood === 'sad';
  const celebrate = mood === 'celebrate';

  if (resolvedRiveSrc && riveAvailable) {
    return (
      <div
        className={className}
        role="img"
        aria-label={title ?? MOOD_LABEL[mood]}
      >
        <RiveLayer src={resolvedRiveSrc} />
      </div>
    );
  }

  const leftEarStyle: CSSProperties = {
    transformOrigin: '76px 74px',
    transform: sad ? 'rotate(13deg)' : happy ? 'rotate(-4deg)' : undefined,
    transition: 'transform .3s ease',
  };
  const rightEarStyle: CSSProperties = {
    transformOrigin: '164px 74px',
    transform: sad ? 'rotate(-13deg)' : happy ? 'rotate(4deg)' : undefined,
    transition: 'transform .3s ease',
  };
  const tailStyle: CSSProperties = { transformOrigin: '156px 194px' };

  return (
    <svg
      viewBox="0 0 240 240"
      className={className ?? 'h-40 w-40'}
      role="img"
      aria-label={title ?? MOOD_LABEL[mood]}
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
      </defs>

      <ellipse cx="120" cy="225" rx="68" ry="9" fill="#3b2a1f" opacity="0.09" />

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

      <ellipse
        cx="120"
        cy="181"
        rx="52"
        ry="43"
        fill="url(#speeko-fur)"
        stroke="#a8420f"
        strokeWidth="3"
      />
      <ellipse cx="120" cy="190" rx="34" ry="28" fill="url(#speeko-belly)" />

      <g style={leftEarStyle}>
        <path
          d="M54 83 66 23q2-7 9-2l25 35Z"
          fill="url(#speeko-fur)"
          stroke="#a8420f"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M69 69 76 39l16 20Z" fill="#ffc3a1" />
      </g>
      <g style={rightEarStyle}>
        <path
          d="M186 83 174 23q-2-7-9-2l-25 35Z"
          fill="url(#speeko-fur)"
          stroke="#a8420f"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M171 69 164 39l-16 20Z" fill="#ffc3a1" />
      </g>

      <ellipse
        cx="120"
        cy="108"
        rx="66"
        ry="58"
        fill="url(#speeko-fur)"
        stroke="#a8420f"
        strokeWidth="3"
      />

      <path d="M78 150c13 10 27 15 42 15s29-5 42-15l7 21c-15 10-31 15-49 15s-34-5-49-15Z" fill="#37b02c" />
      <path d="M78 150c13 10 27 15 42 15s29-5 42-15l2 6c-14 10-28 15-44 15s-30-5-44-15Z" fill="#58c94d" />
      <circle cx="120" cy="171" r="8.5" fill="#269020" />
      <circle cx="117.5" cy="168.5" r="2.4" fill="#8add7f" />

      <ellipse cx="120" cy="134" rx="39" ry="30" fill="url(#speeko-belly)" />

      {celebrate ? (
        <>
          <circle cx="76" cy="124" r="9" fill="#ff9d8a" opacity="0.55" />
          <circle cx="164" cy="124" r="9" fill="#ff9d8a" opacity="0.55" />
        </>
      ) : null}

      {happy ? (
        <>
          <path
            d="M85 103q11-14 22 0"
            fill="none"
            stroke="#2d1f18"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M133 103q11-14 22 0"
            fill="none"
            stroke="#2d1f18"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <ellipse cx="96" cy="101" rx="8.5" ry="10.5" fill="#2d1f18" />
          <ellipse cx="144" cy="101" rx="8.5" ry="10.5" fill="#2d1f18" />
          <circle cx="99" cy="97.5" r="2.7" fill="#fff8ee" />
          <circle cx="147" cy="97.5" r="2.7" fill="#fff8ee" />
          {sad ? (
            <>
              <path
                d="M84 86l21 7"
                fill="none"
                stroke="#8a3a12"
                strokeWidth="3.4"
                strokeLinecap="round"
              />
              <path
                d="M156 86l-21 7"
                fill="none"
                stroke="#8a3a12"
                strokeWidth="3.4"
                strokeLinecap="round"
              />
            </>
          ) : null}
        </>
      )}

      <path d="M112 122h16l-8 10Z" fill="#3b2418" stroke="#3b2418" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="116" cy="124.5" r="1.8" fill="#fff8ee" opacity="0.7" />

      {sad ? (
        <path
          d="M106 145q14-10 28 0"
          fill="none"
          stroke="#5c2a12"
          strokeWidth="4"
          strokeLinecap="round"
        />
      ) : happy ? (
        <>
          <path d="M101 133q19 26 38 0Z" fill="#6d2b16" stroke="#5c2a12" strokeWidth="2" strokeLinejoin="round" />
          <path d="M110 148q10 9 20 0q-10 12-20 0Z" fill="#ff8f8f" />
        </>
      ) : (
        <path
          d="M106 137q14 10 28 0"
          fill="none"
          stroke="#5c2a12"
          strokeWidth="4"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
