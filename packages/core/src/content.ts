import { z } from 'zod';
import type { Locale } from './locale.js';

export const LocaleSchema = z.enum([
  'en', 'hi', 'bn', 'mr', 'te', 'ta', 'kn', 'ml', 'gu', 'pa', 'or',
]);

export const DifficultySchema = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);

// --- Exercise variants -----------------------------------------------------

const baseExercise = z.object({
  id: z.string().min(1),
  kind: z.string(),
  prompt: z.string(),
  audioUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  hint: z.string().optional(),
});

export const ChooseMeaningExercise = baseExercise.extend({
  kind: z.literal('chooseMeaning'),
  options: z.array(z.string()).min(2).max(6),
  answerIndex: z.number().int().min(0),
});

export const WordBankExercise = baseExercise.extend({
  kind: z.literal('wordBank'),
  words: z.array(z.string()).min(2),
  answer: z.array(z.string()).min(1),
});

export const TypeTranslationExercise = baseExercise.extend({
  kind: z.literal('typeTranslation'),
  expected: z.array(z.string()).min(1),
  acceptTypos: z.boolean().default(true),
});

export const ListenChooseExercise = baseExercise.extend({
  kind: z.literal('listenChoose'),
  options: z.array(z.string()).min(2).max(6),
  answerIndex: z.number().int().min(0),
});

export const TypeWhatYouHearExercise = baseExercise.extend({
  kind: z.literal('typeWhatYouHear'),
  expected: z.array(z.string()).min(1),
});

export const MatchPairsExercise = baseExercise.extend({
  kind: z.literal('matchPairs'),
  pairs: z.array(z.tuple([z.string(), z.string()])).min(2).max(8),
});

export const ArrangeSentenceExercise = baseExercise.extend({
  kind: z.literal('arrangeSentence'),
  tiles: z.array(z.string()).min(2),
  answer: z.array(z.string()).min(1),
});

export const FillBlankExercise = baseExercise.extend({
  kind: z.literal('fillBlank'),
  sentence: z.string(),
  options: z.array(z.string()).min(2).max(6),
  answerIndex: z.number().int().min(0),
});

export const SpeakExercise = baseExercise.extend({
  kind: z.literal('speak'),
  expected: z.array(z.string()).min(1),
  softScore: z.boolean().default(true),
});

export const ChooseImageExercise = baseExercise.extend({
  kind: z.literal('chooseImage'),
  options: z.array(z.string()).min(2).max(6),
  answerIndex: z.number().int().min(0),
});

export const ExerciseSchema = z.discriminatedUnion('kind', [
  ChooseMeaningExercise,
  WordBankExercise,
  TypeTranslationExercise,
  ListenChooseExercise,
  TypeWhatYouHearExercise,
  MatchPairsExercise,
  ArrangeSentenceExercise,
  FillBlankExercise,
  SpeakExercise,
  ChooseImageExercise,
]);

export type Exercise = z.infer<typeof ExerciseSchema>;

export const LessonSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  description: z.string().optional(),
  order: z.number().int().min(0),
  difficulty: DifficultySchema,
  xpReward: z.number().int().min(0).default(10),
  exercises: z.array(ExerciseSchema).min(1),
});

export type Lesson = z.infer<typeof LessonSchema>;

export const UnitSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  description: z.string().optional(),
  order: z.number().int().min(0),
  lessons: z.array(LessonSchema).min(1),
  crownLevel: z.number().int().min(0).max(5).default(0),
});

export type Unit = z.infer<typeof UnitSchema>;

export const CourseSchema = z.object({
  id: z.string().min(1),
  locale: LocaleSchema,
  sourceLocale: LocaleSchema.default('en'),
  title: z.string(),
  description: z.string().optional(),
  difficulty: DifficultySchema,
  units: z.array(UnitSchema).min(1),
  version: z.string().default('1.0.0'),
});

export type Course = z.infer<typeof CourseSchema>;

export function validateCourse(input: unknown): Course {
  return CourseSchema.parse(input);
}
