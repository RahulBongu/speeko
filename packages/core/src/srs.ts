// Spaced repetition — simplified SM-2 with per-skill ease factors.

export interface SrsCard {
  skillId: string;
  ease: number; // >= 1.3
  intervalDays: number;
  repetitions: number;
  dueAt: number; // epoch ms
  lapses: number;
}

export const DEFAULT_EASE = 2.5;
export const MIN_EASE = 1.3;

export function newCard(skillId: string, now: number): SrsCard {
  return { skillId, ease: DEFAULT_EASE, intervalDays: 0, repetitions: 0, dueAt: now, lapses: 0 };
}

// quality: 0..5 (0=blackout, 5=perfect)
export function review(card: SrsCard, quality: number, now: number): SrsCard {
  const q = Math.max(0, Math.min(5, quality));
  let ease = card.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (ease < MIN_EASE) ease = MIN_EASE;

  let repetitions = card.repetitions;
  let intervalDays = card.intervalDays;
  let lapses = card.lapses;

  if (q < 3) {
    repetitions = 0;
    intervalDays = 1;
    lapses += 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * ease);
  }

  const dueAt = now + intervalDays * 86_400_000;
  return { skillId: card.skillId, ease, intervalDays, repetitions, dueAt, lapses };
}

export function isDue(card: SrsCard, now: number): boolean {
  return card.dueAt <= now;
}
