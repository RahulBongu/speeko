'use client';

import { useEffect, useRef, useState } from 'react';
import type { Exercise, GradeResult, Locale } from '@speeko/core';
import { LOCALE_META } from '@/lib/courses';
import { createRecognizer, recognitionAvailable, speak, type Recognizer } from '@/lib/speech';
import { CheckIcon, MicIcon, SpeakerIcon, XIcon } from '@/components/icons';
import { AudioPrompt } from './AudioPrompt';
import type { DraftAnswer } from './answer';

type ChoiceExercise = Extract<
  Exercise,
  { kind: 'chooseMeaning' | 'listenChoose' | 'chooseImage' | 'fillBlank' }
>;
type TypeExercise = Extract<Exercise, { kind: 'typeTranslation' | 'typeWhatYouHear' }>;
type TokenExercise = Extract<Exercise, { kind: 'wordBank' | 'arrangeSentence' }>;
type PairsExercise = Extract<Exercise, { kind: 'matchPairs' }>;
type SpeakExercise = Extract<Exercise, { kind: 'speak' }>;

interface BaseBoardProps {
  draft: DraftAnswer;
  onChange: (next: DraftAnswer) => void;
  disabled: boolean;
  reveal: GradeResult | null;
  locale: Locale;
}

export interface ExerciseBodyProps extends BaseBoardProps {
  exercise: Exercise;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-bark-500">
      {children}
    </p>
  );
}

function looksLikeImage(value: string): boolean {
  return /^(https?:\/\/|\/)/.test(value);
}

/** Stable shuffle so server and client agree, and revisits don't reshuffle. */
function shuffleIndices(count: number, seed: string): number[] {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash = Math.imul(hash ^ seed.charCodeAt(i), 16777619);
  }
  const indexes = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) {
    hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
    const j = Math.abs(hash) % (i + 1);
    const a = indexes[i];
    const b = indexes[j];
    if (a !== undefined && b !== undefined) {
      indexes[i] = b;
      indexes[j] = a;
    }
  }
  return indexes;
}

// --- Choice boards ---------------------------------------------------------

type ChoiceState = 'default' | 'selected' | 'correct' | 'wrong' | 'muted';

const CHOICE_CLASSES: Record<ChoiceState, string> = {
  default:
    'border-cream-200 bg-white text-bark-700 shadow-card-sm hover:-translate-y-0.5 hover:border-speeko-300 hover:bg-speeko-50 active:scale-[0.97]',
  selected: 'border-speeko-400 bg-speeko-50 text-speeko-800 shadow-green-sm active:scale-[0.97]',
  correct: 'animate-pop border-speeko-500 bg-speeko-100 text-speeko-800 shadow-green-sm',
  wrong: 'animate-shake border-red-400 bg-red-50 text-red-700',
  muted: 'border-cream-200 bg-white text-bark-300 opacity-60',
};

function ChoiceBoard({
  exercise,
  draft,
  onChange,
  disabled,
  reveal,
  locale,
}: BaseBoardProps & { exercise: ChoiceExercise }) {
  const meta = LOCALE_META[locale];
  const selected = draft.kind === 'choice' ? draft.index : null;
  const showAnswer = reveal !== null;
  const imageOptions = exercise.kind === 'chooseImage';
  const blank = exercise.kind === 'fillBlank' ? exercise.sentence.split('___') : null;
  const chosenText =
    selected !== null ? (exercise.options[selected] ?? '') : '';

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <Eyebrow>
          {exercise.kind === 'chooseMeaning'
            ? `Choose the ${meta.native} meaning`
            : exercise.kind === 'fillBlank'
              ? 'Fill in the blank'
              : exercise.kind === 'listenChoose'
                ? 'What do you hear?'
                : 'Which one is it?'}
        </Eyebrow>

        {exercise.kind === 'chooseMeaning' || exercise.kind === 'chooseImage' ? (
          <h2 className="font-display text-4xl font-extrabold leading-tight text-bark-800 sm:text-5xl">
            {exercise.prompt}
          </h2>
        ) : null}

        {blank ? (
          <p className="font-display text-2xl font-bold leading-relaxed text-bark-800 sm:text-3xl">
            {blank[0]}
            <span className="mx-1 inline-block min-w-[5.5rem] rounded-xl border-b-4 border-dashed border-speeko-300 bg-cream-50 px-2 text-center align-baseline text-speeko-700">
              {chosenText || '\u00A0'}
            </span>
            {blank.slice(1).join('___')}
          </p>
        ) : null}

        {exercise.kind === 'listenChoose' ? (
          <div className="pt-2">
            <AudioPrompt
              text={exercise.options[exercise.answerIndex] ?? ''}
              locale={locale}
              audioUrl={exercise.audioUrl}
              autoPlay
            />
          </div>
        ) : null}

        {exercise.kind === 'fillBlank' && exercise.prompt !== 'Fill in the blank' ? (
          <p className="text-sm font-semibold text-bark-400">{exercise.prompt}</p>
        ) : null}
        {exercise.hint ? <p className="text-sm font-semibold text-bark-400">{exercise.hint}</p> : null}
      </div>

      <div className={`grid gap-3 ${imageOptions ? 'grid-cols-2 sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        {exercise.options.map((option, index) => {
          const isSelected = selected === index;
          const state: ChoiceState = showAnswer
            ? index === exercise.answerIndex
              ? 'correct'
              : isSelected
                ? 'wrong'
                : 'muted'
            : isSelected
              ? 'selected'
              : 'default';
          const showImage = imageOptions && looksLikeImage(option);

          return (
            <button
              key={`${option}-${index}`}
              type="button"
              disabled={disabled}
              aria-pressed={isSelected}
              onClick={() => onChange({ kind: 'choice', index })}
              className={`focus-ring group flex min-h-[68px] items-center justify-between gap-3 rounded-2xl border-2 px-5 py-4 text-left font-display text-xl font-bold transition duration-150 disabled:cursor-default ${CHOICE_CLASSES[state]}`}
            >
              {showImage ? (
                <img
                  src={option}
                  alt={`Option ${index + 1}`}
                  className="h-24 w-full rounded-xl object-cover"
                />
              ) : (
                <span className="script-text" lang={locale}>
                  {option}
                </span>
              )}
              {state === 'correct' ? <CheckIcon className="h-5 w-5 shrink-0" /> : null}
              {state === 'wrong' ? <XIcon className="h-5 w-5 shrink-0" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --- Typing boards ---------------------------------------------------------

function TypeBoard({
  exercise,
  draft,
  onChange,
  disabled,
  locale,
}: BaseBoardProps & { exercise: TypeExercise }) {
  const meta = LOCALE_META[locale];
  const typed = draft.kind === 'text' ? draft.value : '';
  const expected = exercise.expected[0] ?? '';

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <Eyebrow>
          {exercise.kind === 'typeTranslation' ? `Write in ${meta.native}` : 'Listen, then write it'}
        </Eyebrow>
        <h2 className="font-display text-3xl font-extrabold leading-tight text-bark-800">
          {exercise.prompt}
        </h2>
      </div>

      {exercise.kind === 'typeWhatYouHear' ? (
        <AudioPrompt text={expected} locale={locale} audioUrl={exercise.audioUrl} autoPlay />
      ) : null}

      <div>
        <input
          type="text"
          value={typed}
          onChange={(event) => onChange({ kind: 'text', value: event.target.value })}
          disabled={disabled}
          lang={locale}
          dir="auto"
          autoFocus
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={`Type in ${meta.native}…`}
          aria-label={`Answer in ${meta.native}`}
          className="focus-ring w-full rounded-2xl border-2 border-cream-200 bg-white px-5 py-4 font-display text-2xl font-bold text-bark-800 shadow-card-sm outline-none transition placeholder:font-semibold placeholder:text-bark-300 focus:border-speeko-400 disabled:cursor-default disabled:bg-cream-50"
        />
        <p className="mt-2 text-xs font-semibold text-bark-400">
          Switch your device keyboard to {meta.native} to type in script.
        </p>
      </div>
    </div>
  );
}

// --- Word bank / arrange sentence ------------------------------------------

function TokenBoard({
  exercise,
  draft,
  onChange,
  disabled,
  locale,
}: BaseBoardProps & { exercise: TokenExercise }) {
  const pool = exercise.kind === 'wordBank' ? exercise.words : exercise.tiles;
  const selected = draft.kind === 'tokens' ? draft.value : [];
  const order = shuffleIndices(pool.length, exercise.id);

  const selectedTokens = selected
    .map((poolIndex) => ({ poolIndex, text: pool[poolIndex] }))
    .filter((token): token is { poolIndex: number; text: string } => Boolean(token.text));

  const add = (poolIndex: number) => {
    if (disabled || selected.includes(poolIndex)) return;
    onChange({ kind: 'tokens', value: [...selected, poolIndex] });
  };

  const removeAt = (position: number) => {
    if (disabled) return;
    onChange({
      kind: 'tokens',
      value: selected.filter((_, index) => index !== position),
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Eyebrow>{exercise.kind === 'wordBank' ? 'Build the translation' : 'Arrange the sentence'}</Eyebrow>
        <h2 className="font-display text-3xl font-extrabold leading-tight text-bark-800">
          {exercise.prompt}
        </h2>
      </div>

      <div
        className="flex min-h-[88px] flex-wrap content-start items-center gap-2 rounded-2xl border-2 border-dashed border-cream-300 bg-cream-50 p-3"
        aria-label="Your answer"
      >
        {selectedTokens.length === 0 ? (
          <p className="px-2 text-sm font-semibold text-bark-400">
            Tap the words below to build your answer.
          </p>
        ) : (
          selectedTokens.map((token, position) => (
            <button
              key={`${token.poolIndex}-${position}`}
              type="button"
              disabled={disabled}
              onClick={() => removeAt(position)}
              className="focus-ring flex items-center gap-1.5 rounded-xl border-2 border-cream-200 bg-white px-3 py-2 font-display text-lg font-bold text-bark-700 shadow-card-sm transition hover:border-fox-300 hover:text-fox-700 disabled:cursor-default"
              aria-label={`Remove ${token.text}`}
            >
              <span className="script-text" lang={locale}>
                {token.text}
              </span>
              <XIcon className="h-3.5 w-3.5 text-bark-300" />
            </button>
          ))
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {order.map((poolIndex) => {
          const text = pool[poolIndex];
          if (text === undefined || selected.includes(poolIndex)) return null;
          return (
            <button
              key={`${poolIndex}-${text}`}
              type="button"
              disabled={disabled}
              onClick={() => add(poolIndex)}
              className="focus-ring rounded-xl border-2 border-cream-200 bg-white px-4 py-2.5 font-display text-lg font-bold text-bark-700 shadow-card-sm transition hover:-translate-y-0.5 hover:border-speeko-300 hover:bg-speeko-50 active:translate-y-0 active:shadow-none disabled:cursor-default disabled:opacity-50"
            >
              <span className="script-text" lang={locale}>
                {text}
              </span>
            </button>
          );
        })}
      </div>

      {selectedTokens.length > 0 ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange({ kind: 'tokens', value: [] })}
          className="text-xs font-bold text-bark-400 underline decoration-cream-300 underline-offset-2 hover:text-bark-600"
        >
          Clear answer
        </button>
      ) : null}
    </div>
  );
}

// --- Match pairs ------------------------------------------------------------

interface PairSelection {
  side: 'left' | 'right';
  index: number;
}

function PairsBoard({
  exercise,
  onChange,
  disabled,
  locale,
}: BaseBoardProps & { exercise: PairsExercise }) {
  const shuffledRight = shuffleIndices(exercise.pairs.length, `${exercise.id}:right`);
  const [selected, setSelected] = useState<PairSelection | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [mismatches, setMismatches] = useState(0);
  const [flash, setFlash] = useState<PairSelection[]>([]);
  const [rightOrder, setRightOrder] = useState<number[]>(shuffledRight);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const complete = matched.length === exercise.pairs.length;

  const tap = (side: 'left' | 'right', index: number) => {
    if (disabled || matched.includes(index)) return;
    if (!selected) {
      setSelected({ side, index });
      return;
    }
    if (selected.side === side) {
      setSelected({ side, index });
      return;
    }

    const left = side === 'left' ? index : selected.index;
    const right = side === 'right' ? index : selected.index;

    if (left === right) {
      const nextMatched = [...matched, left];
      setMatched(nextMatched);
      setSelected(null);
      // Slide the matched translation into the same row as its prompt so the
      // finished board reads as pairs rather than two independent columns.
      setRightOrder((order) => {
        const from = order.indexOf(left);
        const occupying = order[left];
        if (from < 0 || from === left || occupying === undefined) return order;
        const next = [...order];
        next[left] = left;
        next[from] = occupying;
        return next;
      });
      onChange({ kind: 'pairs', mismatches, matched: nextMatched.length });
      return;
    }

    const nextMismatches = mismatches + 1;
    setMismatches(nextMismatches);
    setSelected(null);
    setFlash([
      { side: 'left', index: left },
      { side: 'right', index: right },
    ]);
    onChange({ kind: 'pairs', mismatches: nextMismatches, matched: matched.length });
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setFlash([]), 480);
  };

  const reset = () => {
    setMatched([]);
    setMismatches(0);
    setSelected(null);
    setFlash([]);
    setRightOrder(shuffledRight);
    onChange({ kind: 'pairs', mismatches: 0, matched: 0 });
  };

  const buttonClass = (side: 'left' | 'right', index: number) => {
    const isMatched = matched.includes(index);
    const isSelected = selected?.side === side && selected.index === index;
    const isFlashing = flash.some((item) => item.side === side && item.index === index);
    if (isMatched) {
      return 'border-speeko-300 bg-speeko-50 text-speeko-700 opacity-80';
    }
    if (isFlashing) return 'animate-shake border-red-400 bg-red-50 text-red-700';
    if (isSelected) return 'border-speeko-400 bg-speeko-50 text-speeko-800 shadow-green-sm';
    return 'border-cream-200 bg-white text-bark-700 shadow-card-sm hover:-translate-y-0.5 hover:border-speeko-300 hover:bg-speeko-50';
  };

  const renderColumn = (side: 'left' | 'right', order: number[]) => (
    <div className="space-y-2.5">
      {order.map((pairIndex) => {
        const pair = exercise.pairs[pairIndex];
        if (!pair) return null;
        const text = side === 'left' ? pair[0] : pair[1];
        const isMatched = matched.includes(pairIndex);
        return (
          <button
            key={`${side}-${pairIndex}`}
            type="button"
            disabled={disabled || isMatched}
            aria-pressed={selected?.side === side && selected.index === pairIndex}
            onClick={() => tap(side, pairIndex)}
            className={`focus-ring flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3 text-center font-display text-lg font-bold transition duration-150 disabled:cursor-default ${buttonClass(side, pairIndex)}`}
          >
            <span className="script-text" lang={locale}>
              {text}
            </span>
            {isMatched ? <CheckIcon className="h-4 w-4 shrink-0" /> : null}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Eyebrow>Match the pairs</Eyebrow>
        <h2 className="font-display text-3xl font-extrabold leading-tight text-bark-800">
          {exercise.prompt}
        </h2>
        <p className="text-sm font-semibold text-bark-400">
          Tap a word, then tap its match. {matched.length} of {exercise.pairs.length} matched.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {renderColumn('left', exercise.pairs.map((_, index) => index))}
        {renderColumn('right', rightOrder)}
      </div>

      {complete && mismatches > 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-gold-200 bg-gold-100 p-4 text-center">
          <p className="text-sm font-bold text-gold-700">
            One pair didn&apos;t match, so this attempt won&apos;t count. Reset and try again — no
            heart lost.
          </p>
          <button type="button" onClick={reset} className="btn-secondary py-2 text-xs">
            Reset the board
          </button>
        </div>
      ) : complete ? (
        <p className="text-center text-sm font-bold text-speeko-700" role="status">
          All pairs matched. Nice!
        </p>
      ) : null}
    </div>
  );
}

// --- Speaking ---------------------------------------------------------------

function SpeakBoard({
  exercise,
  draft,
  onChange,
  disabled,
  locale,
}: BaseBoardProps & { exercise: SpeakExercise }) {
  const meta = LOCALE_META[locale];
  const expected = exercise.expected[0] ?? '';
  const transcript = draft.kind === 'speak' ? draft.transcript : '';
  const selfReported = draft.kind === 'speak' ? draft.selfReported : false;
  const [supported, setSupported] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const recognizerRef = useRef<Recognizer | null>(null);

  useEffect(() => {
    setSupported(recognitionAvailable());
    return () => {
      recognizerRef.current?.stop();
    };
  }, []);

  const toggleListening = () => {
    if (disabled) return;
    if (listening) {
      recognizerRef.current?.stop();
      setListening(false);
      return;
    }
    const recognizer = createRecognizer(
      locale,
      (value) => onChange({ kind: 'speak', transcript: value, selfReported: false }),
      () => setListening(false),
    );
    if (!recognizer) {
      setSupported(false);
      return;
    }
    recognizerRef.current = recognizer;
    setListening(true);
    recognizer.start();
  };

  const setTranscript = (value: string) => {
    onChange({ kind: 'speak', transcript: value, selfReported: false });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Eyebrow>Speaking practice</Eyebrow>
        <h2 className="font-display text-3xl font-extrabold leading-tight text-bark-800">
          {exercise.prompt}
        </h2>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-cream-200 bg-cream-50 px-5 py-6 text-center">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-bark-500">
          Say this in {meta.native}
        </p>
        <p
          lang={locale}
          className="script-text text-3xl font-extrabold leading-snug text-bark-800 sm:text-4xl"
        >
          {expected}
        </p>
        <button
          type="button"
          onClick={() => speak(expected, locale)}
          className="btn-ghost text-speeko-700"
        >
          <SpeakerIcon className="h-5 w-5" /> Hear it
        </button>
      </div>

      {supported ? (
        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={toggleListening}
            disabled={disabled}
            className={`focus-ring relative flex h-28 w-28 items-center justify-center rounded-full text-white shadow-green transition active:translate-y-[2px] active:shadow-green-sm disabled:opacity-50 ${
              listening ? 'bg-fox-500 shadow-fox' : 'bg-speeko-500 hover:bg-speeko-400'
            }`}
            aria-label={listening ? 'Stop listening' : 'Start speaking'}
            aria-pressed={listening}
          >
            {listening ? (
              <>
                <span className="absolute inset-0 animate-pulse-ring rounded-full bg-fox-300" />
                <span
                  className="absolute inset-0 animate-pulse-ring rounded-full bg-fox-200"
                  style={{ animationDelay: '0.45s' }}
                />
              </>
            ) : null}
            <MicIcon className="relative h-12 w-12" />
          </button>
          <p className="font-display text-sm font-bold text-bark-500" role="status">
            {listening ? 'Listening… tap to stop' : 'Tap the mic and say it'}
          </p>
        </div>
      ) : supported === false ? (
        <div className="space-y-2">
          <p className="rounded-2xl border-2 border-gold-200 bg-gold-100 px-4 py-3 text-sm font-semibold text-gold-700">
            Speech recognition isn&apos;t available in this browser. Type what you said to keep
            practicing.
          </p>
          <label className="block">
            <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-[0.16em] text-bark-500">
              Type what you said
            </span>
            <input
              type="text"
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              disabled={disabled}
              lang={locale}
              dir="auto"
              autoComplete="off"
              spellCheck={false}
              placeholder={`Type in ${meta.native}…`}
              className="focus-ring w-full rounded-2xl border-2 border-cream-200 bg-white px-4 py-3 font-display text-xl font-bold text-bark-800 shadow-card-sm outline-none focus:border-speeko-400 disabled:bg-cream-50"
            />
          </label>
        </div>
      ) : null}

      {transcript ? (
        <div className="rounded-2xl border-2 border-speeko-200 bg-speeko-50 px-4 py-3 text-center">
          <p className="eyebrow">
            We heard
          </p>
          <p lang={locale} className="script-text mt-1 text-xl font-bold text-speeko-800">
            {transcript}
          </p>
        </div>
      ) : null}

      {exercise.softScore ? (
        <div className="text-center">
          <button
            type="button"
            onClick={() =>
              onChange({ kind: 'speak', transcript, selfReported: !selfReported })
            }
            disabled={disabled}
            className={`focus-ring inline-flex items-center gap-2 rounded-2xl border-2 px-4 py-2.5 font-display text-sm font-bold transition ${
              selfReported
                ? 'border-speeko-400 bg-speeko-50 text-speeko-700'
                : 'border-cream-200 bg-white text-bark-500 shadow-card-sm hover:border-speeko-300'
            }`}
            aria-pressed={selfReported}
          >
            {selfReported ? <CheckIcon className="h-4 w-4" /> : null}
            {selfReported ? 'Marked as said' : 'I said it out loud'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

// --- Router -----------------------------------------------------------------

export function ExerciseBody(props: ExerciseBodyProps) {
  const { exercise } = props;
  switch (exercise.kind) {
    case 'chooseMeaning':
    case 'listenChoose':
    case 'chooseImage':
    case 'fillBlank':
      return <ChoiceBoard {...props} exercise={exercise} />;
    case 'typeTranslation':
    case 'typeWhatYouHear':
      return <TypeBoard {...props} exercise={exercise} />;
    case 'wordBank':
    case 'arrangeSentence':
      return <TokenBoard {...props} exercise={exercise} />;
    case 'matchPairs':
      return <PairsBoard {...props} exercise={exercise} />;
    case 'speak':
      return <SpeakBoard {...props} exercise={exercise} />;
    default:
      return null;
  }
}
