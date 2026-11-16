// Gamification rules for Speeko. Pure functions; no I/O.

export { DAILY_GOAL_DEFAULT as DAILY_XP_GOAL_DEFAULT } from './config.js';

export const MAX_ENERGY = 5;
export const ENERGY_REGEN_MINUTES = 25;

export type LeagueTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'champion';

export const LEAGUE_ORDER: readonly LeagueTier[] = [
  'bronze', 'silver', 'gold', 'platinum', 'diamond', 'champion',
] as const;

export const LEAGUE_PROMOTION_THRESHOLD: Record<LeagueTier, number> = {
  bronze: 50,
  silver: 100,
  gold: 150,
  platinum: 200,
  diamond: 250,
  champion: Number.POSITIVE_INFINITY,
};

export const LEAGUE_DEMOTION_THRESHOLD: Record<LeagueTier, number> = {
  bronze: 0,
  silver: 30,
  gold: 60,
  platinum: 100,
  diamond: 150,
  champion: 200,
};

export function nextLeague(tier: LeagueTier): LeagueTier | null {
  const idx = LEAGUE_ORDER.indexOf(tier);
  return idx < 0 || idx === LEAGUE_ORDER.length - 1 ? null : LEAGUE_ORDER[idx + 1]!;
}

export function prevLeague(tier: LeagueTier): LeagueTier | null {
  const idx = LEAGUE_ORDER.indexOf(tier);
  return idx <= 0 ? null : LEAGUE_ORDER[idx - 1]!;
}

// XP per exercise type (base). Streak multipliers applied by caller.
export const XP_PER_EXERCISE: Record<string, number> = {
  chooseMeaning: 2,
  wordBank: 3,
  typeTranslation: 4,
  listenChoose: 2,
  typeWhatYouHear: 4,
  matchPairs: 3,
  arrangeSentence: 4,
  fillBlank: 2,
  speak: 5,
  chooseImage: 2,
};

export function xpForExercise(kind: string): number {
  return XP_PER_EXERCISE[kind] ?? 1;
}

// Level curve: XP needed to reach level n (cumulative). Quadratic-ish.
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(50 * (level - 1) * (level - 1) + 50 * (level - 1));
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  return level;
}

// Streak: returns new streak given last activity date and today (ISO YYYY-MM-DD).
export function updateStreak(
  lastActiveDate: string | null,
  today: string,
  currentStreak: number,
  freezeAvailable: boolean,
): { streak: number; freezeUsed: boolean } {
  if (!lastActiveDate) return { streak: 1, freezeUsed: false };
  const last = new Date(lastActiveDate + 'T00:00:00Z').getTime();
  const now = new Date(today + 'T00:00:00Z').getTime();
  const days = Math.round((now - last) / 86_400_000);
  if (days <= 0) return { streak: currentStreak, freezeUsed: false };
  if (days === 1) return { streak: currentStreak + 1, freezeUsed: false };
  if (days === 2 && freezeAvailable) return { streak: currentStreak + 1, freezeUsed: true };
  return { streak: 1, freezeUsed: false };
}

// Energy: returns energy + next regen timestamp after `now` ms.
export function regenEnergy(
  energy: number,
  lastRegenAt: number,
  now: number,
): { energy: number; lastRegenAt: number } {
  if (energy >= MAX_ENERGY) return { energy: MAX_ENERGY, lastRegenAt: now };
  const elapsed = now - lastRegenAt;
  const slots = Math.floor(elapsed / (ENERGY_REGEN_MINUTES * 60_000));
  if (slots <= 0) return { energy, lastRegenAt };
  const gained = Math.min(MAX_ENERGY - energy, slots);
  const newEnergy = energy + gained;
  const consumed = gained * ENERGY_REGEN_MINUTES * 60_000;
  return { energy: newEnergy, lastRegenAt: lastRegenAt + consumed };
}
