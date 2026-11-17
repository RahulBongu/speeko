import type { CSSProperties } from 'react';

const COLORS = ['#37b02c', '#58c94d', '#1f741d', '#ff8a3d', '#ef6a1c', '#c84e12', '#fff4e4', '#bcedb4'];

interface Piece {
  left: number;
  delay: number;
  duration: number;
  drift: number;
  size: number;
  rounded: boolean;
  color: string;
}

const PIECES: Piece[] = Array.from({ length: 34 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  delay: (i % 11) * 0.085,
  duration: 2.2 + (i % 5) * 0.28,
  drift: ((i % 7) - 3) * 14,
  size: 7 + (i % 3) * 4,
  rounded: i % 4 === 0,
  color: COLORS[i % COLORS.length] ?? '#37b02c',
}));

export function Confetti() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {PIECES.map((piece, i) => {
        const style: CSSProperties = {
          left: `${piece.left}%`,
          width: piece.size,
          height: piece.rounded ? piece.size : piece.size * 1.7,
          backgroundColor: piece.color,
          animationDelay: `${piece.delay}s`,
          animationDuration: `${piece.duration}s`,
          borderRadius: piece.rounded ? '9999px' : '2px',
          // Custom property consumed by the confetti keyframe.
          ['--drift' as string]: `${piece.drift}px`,
        };
        return <span key={i} className="animate-confetti-fall absolute top-0" style={style} />;
      })}
    </div>
  );
}
