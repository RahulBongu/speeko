/**
 * Exercise eligibility.
 *
 * A small number of published exercises cannot be presented honestly as
 * learnable tasks right now. The known example is `listenChoose` shipped
 * with an empty `audioUrl`: without recorded audio there is nothing for the
 * learner to listen to, so the exercise degrades to a guess. We exclude it
 * from the *playable* queue until an audio asset exists — the original
 * content record, ID, and review status are all preserved unchanged.
 *
 * The filter is symmetric across every caller (web, mobile, API grading), so
 * the same eligible list is used for scoring, sequencing, and completion.
 */

import type { Exercise } from './content.js';

/** True when the exercise can be presented as its intended task today. */
export function isExerciseEligible(exercise: Exercise): boolean {
  if (exercise.kind === 'listenChoose') {
    const audioUrl = (exercise as { audioUrl?: string }).audioUrl;
    return typeof audioUrl === 'string' && audioUrl.trim().length > 0;
  }
  return true;
}

/** Playable exercises in the same order as the source lesson. */
export function eligibleExercises(exercises: readonly Exercise[]): Exercise[] {
  return exercises.filter(isExerciseEligible);
}
