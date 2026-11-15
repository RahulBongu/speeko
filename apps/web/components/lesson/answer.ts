import type { AnswerInput, Exercise } from '@speeko/core';

export type DraftAnswer =
  | { kind: 'choice'; index: number | null }
  | { kind: 'text'; value: string }
  | { kind: 'tokens'; value: number[] }
  | { kind: 'pairs'; mismatches: number; matched: number }
  | { kind: 'speak'; transcript: string; selfReported: boolean };

export function initialDraft(exercise: Exercise): DraftAnswer {
  switch (exercise.kind) {
    case 'chooseMeaning':
    case 'listenChoose':
    case 'fillBlank':
    case 'chooseImage':
      return { kind: 'choice', index: null };
    case 'typeTranslation':
    case 'typeWhatYouHear':
      return { kind: 'text', value: '' };
    case 'wordBank':
    case 'arrangeSentence':
      return { kind: 'tokens', value: [] };
    case 'matchPairs':
      return { kind: 'pairs', mismatches: 0, matched: 0 };
    case 'speak':
      return { kind: 'speak', transcript: '', selfReported: false };
    default:
      return { kind: 'text', value: '' };
  }
}

export function choiceOptions(exercise: Exercise): string[] | null {
  switch (exercise.kind) {
    case 'chooseMeaning':
    case 'listenChoose':
    case 'fillBlank':
    case 'chooseImage':
      return exercise.options;
    default:
      return null;
  }
}

export function tokenPool(exercise: Exercise): string[] | null {
  if (exercise.kind === 'wordBank') return exercise.words;
  if (exercise.kind === 'arrangeSentence') return exercise.tiles;
  return null;
}

export function toAnswerInput(exercise: Exercise, draft: DraftAnswer): AnswerInput | null {
  switch (draft.kind) {
    case 'choice':
      return draft.index === null ? null : { kind: 'choice', index: draft.index };
    case 'text':
      return draft.value.trim().length === 0 ? null : { kind: 'text', value: draft.value };
    case 'tokens': {
      const pool = tokenPool(exercise);
      if (!pool) return null;
      const value = draft.value
        .map((index) => pool[index])
        .filter((token): token is string => typeof token === 'string');
      if (value.length !== draft.value.length || value.length === 0) return null;
      return { kind: 'tokens', value };
    }
    case 'pairs':
      return { kind: 'pairs', mismatches: draft.mismatches };
    case 'speak':
      return {
        kind: 'speak',
        transcript: draft.transcript,
        selfReported: draft.selfReported,
      };
    default:
      return null;
  }
}

export function canSubmit(exercise: Exercise, draft: DraftAnswer): boolean {
  switch (draft.kind) {
    case 'choice':
      return draft.index !== null;
    case 'text':
      return draft.value.trim().length > 0;
    case 'tokens':
      return draft.value.length > 0;
    case 'pairs':
      return (
        exercise.kind === 'matchPairs' &&
        draft.mismatches === 0 &&
        draft.matched >= exercise.pairs.length
      );
    case 'speak':
      return draft.transcript.trim().length > 0 || draft.selfReported;
    default:
      return false;
  }
}
