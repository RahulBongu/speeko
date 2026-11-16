// Spaced repetition — Leitner boxes with 1/2/4/8/16 day intervals.
//
// Older snapshots stored simplified SM-2 cards (ease / repetitions /
// intervalDays). Those cards remain readable forever: the schema below
// normalises them to the nearest Leitner box on read, preserving their due
// date. Nothing writes the legacy shape again.

import { z } from 'zod';

export const MAX_BOX = 5;

/** Days until the next review, indexed by box. Box 0 is new / due now. */
export const LEITNER_INTERVALS = [0, 1, 2, 4, 8, 16] as const;

/** The five learning-box intervals shown to learners. */
export const LEITNER_BOX_DAYS = [1, 2, 4, 8, 16] as const;

export interface SrsCard {
  skillId: string;
  /** 0 = new, 1..5 = Leitner box. */
  box: number;
  dueAt: number; // epoch ms
  lapses: number;
}

const LeitnerCardSchema = z.object({
  skillId: z.string().min(1),
  box: z.number().int().min(0).max(MAX_BOX),
  dueAt: z.number().finite(),
  lapses: z.number().int().min(0).default(0),
});

/** Historical SM-2 card written before P5. Read-only; never written again. */
const LegacySm2CardSchema = z.object({
  skillId: z.string().min(1),
  ease: z.number().min(1.3).finite(),
  intervalDays: z.number().min(0).finite(),
  repetitions: z.number().int().min(0),
  dueAt: z.number().finite(),
  lapses: z.number().int().min(0).default(0),
});

/**
 * Maps a legacy SM-2 card to a Leitner box without changing its due date.
 * The mapping uses the old interval, which is the closest observable proxy
 * for how well the item was known.
 */
export function leitnerBoxForLegacy(card: {
  intervalDays: number;
  repetitions: number;
}): number {
  if (card.repetitions === 0 && card.intervalDays <= 0) return 0;
  if (card.intervalDays <= 1) return 1;
  if (card.intervalDays <= 2) return 2;
  if (card.intervalDays <= 4) return 3;
  if (card.intervalDays <= 8) return 4;
  return 5;
}

/**
 * Zod schema for an SRS card. Accepts the current Leitner shape and the
 * legacy SM-2 shape, but always returns a Leitner card.
 */
export const SrsCardSchema = z
  .union([LeitnerCardSchema, LegacySm2CardSchema])
  .transform((card): SrsCard => {
    if ('box' in card) {
      return {
        skillId: card.skillId,
        box: card.box,
        dueAt: card.dueAt,
        lapses: card.lapses,
      };
    }
    return {
      skillId: card.skillId,
      box: leitnerBoxForLegacy(card),
      dueAt: card.dueAt,
      lapses: card.lapses,
    };
  });

export function newCard(skillId: string, now: number): SrsCard {
  return { skillId, box: 0, dueAt: now, lapses: 0 };
}

/**
 * Applies one answer to a card. A miss returns it to box 1 and schedules it
 * for tomorrow; a correct answer moves it one box forward, capped at box 5.
 */
export function review(card: SrsCard, quality: number, now: number): SrsCard {
  const q = Math.max(0, Math.min(5, quality));
  if (q < 3) {
    return {
      skillId: card.skillId,
      box: 1,
      dueAt: now + 86_400_000,
      lapses: card.lapses + 1,
    };
  }
  const box = Math.min(MAX_BOX, card.box + 1);
  const intervalDays = LEITNER_INTERVALS[box] ?? 16;
  return {
    skillId: card.skillId,
    box,
    dueAt: now + intervalDays * 86_400_000,
    lapses: card.lapses,
  };
}

export function isDue(card: SrsCard, now: number): boolean {
  return card.dueAt <= now;
}
