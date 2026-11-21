export interface SingingFoxProps {
  /** Size and spacing utilities. Defaults to a 40px mark. */
  className?: string;
  /** Accessible name. Omit when the surrounding text already names the brand. */
  title?: string;
  /** Turn off the looping notes for print, small static contexts, or tests. */
  animated?: boolean;
}

/**
 * Speeko's singing fox mark: the same head as the app icon, mid-song.
 *
 * The eyes are closed happy arcs and the muzzle is open around a small tongue —
 * readable as "singing" rather than "surprised" even at 24–48px. Two green
 * notes drift out of the right side on a loop. The whole mark sways a degree or
 * two, so it feels alive without wobbling.
 *
 * The geometry intentionally mirrors `assets/icon.svg` in the mobile app and
 * the standalone brand asset. Keep the ears, muzzle, bindi, and stroke weights
 * in sync when either changes.
 */
export function SingingFox({
  className = 'h-10 w-10',
  title,
  animated = true,
}: SingingFoxProps) {
  return (
    <span
      className={`relative inline-block shrink-0 ${className}`}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
        <g transform="translate(-4 0)">
          <g
            className={animated ? 'animate-logo-sway motion-reduce:animate-none' : undefined}
            style={{ transformBox: 'view-box', transformOrigin: '50px 85px' }}
          >
            <g transform="rotate(-5 50 55)">
              {/* Ears, behind the head. */}
              <polygon
                points="22,48 13,12 44,30"
                fill="#F97316"
                stroke="#3F2A1D"
                strokeWidth="4"
                strokeLinejoin="round"
              />
              <polygon
                points="24.2,39 19.7,21 35.2,30"
                fill="#FED7AA"
                stroke="#3F2A1D"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <polygon
                points="78,48 87,12 56,30"
                fill="#F97316"
                stroke="#3F2A1D"
                strokeWidth="4"
                strokeLinejoin="round"
              />
              <polygon
                points="75.8,39 80.3,21 64.8,30"
                fill="#FED7AA"
                stroke="#3F2A1D"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />

              {/* Head. */}
              <ellipse
                cx="50"
                cy="55"
                rx="35"
                ry="30"
                fill="#F97316"
                stroke="#3F2A1D"
                strokeWidth="5"
              />

              {/* Muzzle sits above the mouth and stays clear of the eyes. */}
              <path
                d="M 26,63 C 26,77 36,83 50,83 C 64,83 74,77 74,63 C 74,56.5 64,54 50,54 C 36,54 26,56.5 26,63 Z"
                fill="#FFFDF6"
                stroke="#3F2A1D"
                strokeWidth="4"
                strokeLinejoin="round"
              />

              {/* Bindi. */}
              <circle cx="50" cy="31.5" r="3.4" fill="#DC2626" />

              {/* Closed, smiling eyes with a small outer lash. */}
              <path
                d="M 31.5,45 Q 38,38.5 44.5,45"
                fill="none"
                stroke="#3F2A1D"
                strokeWidth="4.6"
                strokeLinecap="round"
              />
              <path
                d="M 55.5,45 Q 62,38.5 68.5,45"
                fill="none"
                stroke="#3F2A1D"
                strokeWidth="4.6"
                strokeLinecap="round"
              />
              <path
                d="M 31.5,45 L 29.3,47.6"
                fill="none"
                stroke="#3F2A1D"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <path
                d="M 68.5,45 L 70.7,47.6"
                fill="none"
                stroke="#3F2A1D"
                strokeWidth="3.2"
                strokeLinecap="round"
              />

              {/* Nose and open singing mouth. */}
              <path
                d="M 45.2,60.2 Q 50,57.2 54.8,60.2 Q 52.7,63.8 50,63.8 Q 47.3,63.8 45.2,60.2 Z"
                fill="#3F2A1D"
              />
              <path
                d="M 41,66 Q 50,62 59,66 Q 59,77 50,79 Q 41,77 41,66 Z"
                fill="#3F2A1D"
              />
              <path
                d="M 45,73.5 Q 50,70 55,73.5 Q 53.3,77.6 50,78.4 Q 46.7,77.6 45,73.5 Z"
                fill="#DC2626"
              />
            </g>
          </g>
        </g>
      </svg>

      {animated ? (
        <svg
          viewBox="0 0 24 32"
          className="pointer-events-none absolute right-0 top-0 h-[40%] w-[24%] overflow-visible"
          aria-hidden="true"
        >
          <g transform="translate(2 10)">
            <g
              className="animate-logo-note-a opacity-0 motion-reduce:animate-none"
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            >
              <Note fill="#16A34A" />
            </g>
          </g>
          <g transform="translate(12 3) scale(.72)">
            <g
              className="animate-logo-note-b opacity-0 motion-reduce:animate-none"
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            >
              <Note fill="#16A34A" />
            </g>
          </g>
        </svg>
      ) : null}
    </span>
  );
}

function Note({ fill }: { fill: string }) {
  return (
    <>
      <ellipse cx="4" cy="14" rx="4" ry="2.9" transform="rotate(-20 4 14)" fill={fill} />
      <path d="M7.4 13.4V2.2" stroke={fill} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M7.4 2.4c2.6.5 3.8 2.3 3.4 4.8-1-1.4-2-2-3.4-2.2Z" fill={fill} />
    </>
  );
}
