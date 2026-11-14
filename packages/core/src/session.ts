import type { Exercise } from './content.js';
import { xpForExercise } from './gamification.js';

export interface SessionAnswer {
  exerciseId: string;
  correct: boolean;
  ms: number;
}

export interface SessionState {
  lessonId: string;
  exercises: Exercise[];
  index: number;
  hearts: number;
  xp: number;
  answers: SessionAnswer[];
  mistakes: string[];
  combo: number;
  maxCombo: number;
  finished: boolean;
  startedAt: number;
  endedAt: number | null;
}

export type SessionAction =
  | { type: 'start'; lessonId: string; exercises: Exercise[]; hearts: number; now: number }
  | { type: 'answer'; exerciseId: string; correct: boolean; ms: number }
  | { type: 'finish'; now: number }
  | { type: 'abandon' };

export const INITIAL_HEARTS = 5;

export function createSession(
  lessonId: string,
  exercises: Exercise[],
  now: number,
  hearts = INITIAL_HEARTS,
): SessionState {
  return {
    lessonId,
    exercises,
    index: 0,
    hearts,
    xp: 0,
    answers: [],
    mistakes: [],
    combo: 0,
    maxCombo: 0,
    finished: false,
    startedAt: now,
    endedAt: null,
  };
}

export function reduceSession(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'start':
      return createSession(action.lessonId, action.exercises, action.now, action.hearts);
    case 'answer': {
      if (state.finished) return state;
      const ex = state.exercises.find((e) => e.id === action.exerciseId);
      const base = ex ? xpForExercise(ex.kind) : 1;
      const comboBonus = action.correct ? Math.min(state.combo, 4) : 0;
      const gained = action.correct ? base + comboBonus : 0;
      const newCombo = action.correct ? state.combo + 1 : 0;
      const newHearts = action.correct ? state.hearts : Math.max(0, state.hearts - 1);
      const mistakes =
        action.correct || state.mistakes.includes(action.exerciseId)
          ? state.mistakes
          : [...state.mistakes, action.exerciseId];
      return {
        ...state,
        index: Math.min(state.index + 1, state.exercises.length),
        hearts: newHearts,
        xp: state.xp + gained,
        answers: [...state.answers, { exerciseId: action.exerciseId, correct: action.correct, ms: action.ms }],
        mistakes,
        combo: newCombo,
        maxCombo: Math.max(state.maxCombo, newCombo),
        finished: state.index + 1 >= state.exercises.length || newHearts === 0,
      };
    }
    case 'finish':
      return { ...state, finished: true, endedAt: action.now };
    case 'abandon':
      return { ...state, finished: true, endedAt: Date.now() };
    default:
      return state;
  }
}

export function currentExercise(state: SessionState): Exercise | null {
  return state.exercises[state.index] ?? null;
}

export function sessionComplete(state: SessionState): boolean {
  return state.finished || state.index >= state.exercises.length || state.hearts <= 0;
}

export function accuracy(state: SessionState): number {
  if (state.answers.length === 0) return 0;
  const correct = state.answers.filter((a) => a.correct).length;
  return correct / state.answers.length;
}
