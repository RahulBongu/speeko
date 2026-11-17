import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import type { Exercise, GradeResult } from '@speeko/core';
import {
  choiceOptions,
  isSupportedExercise,
  matchPairOrder,
  type DraftAnswer,
} from '../lib/exercise';
import { COLORS } from '../lib/theme';

interface ExerciseBodyProps {
  exercise: Exercise;
  draft: DraftAnswer;
  onChange: (next: DraftAnswer) => void;
  disabled: boolean;
  reveal: GradeResult | null;
}

/**
 * One shared board for every exercise kind the mobile player supports.
 *
 * Lesson and practice runners both render this, so a fillBlank is always a
 * choice board and a listenChoose never pretends to have audio it doesn't.
 * Unsupported kinds are rendered as an honest block instead of a fake input.
 */
export function ExerciseBody({ exercise, draft, onChange, disabled, reveal }: ExerciseBodyProps) {
  const options = choiceOptions(exercise);
  const pairs = exercise.kind === 'matchPairs' ? exercise.pairs : null;
  const rightOrder = useMemo(
    () => (pairs ? matchPairOrder(pairs, exercise.id) : []),
    [pairs, exercise.id],
  );
  const [leftSelected, setLeftSelected] = useState<number | null>(null);
  const [matchedLeft, setMatchedLeft] = useState<number[]>([]);

  if (!isSupportedExercise(exercise)) {
    return (
      <View style={{ padding: 16, borderRadius: 14, backgroundColor: COLORS.redSoft, gap: 6 }}>
        <Text style={{ fontWeight: '800', color: COLORS.red }}>
          This exercise type isn&apos;t available in the mobile app yet.
        </Text>
        <Text style={{ color: COLORS.dark }}>
          The lesson can&apos;t be finished here. Update the app or continue on the web player.
        </Text>
      </View>
    );
  }

  if (options) {
    const selected = draft.kind === 'choice' ? draft.index : null;
    const expected = reveal?.expected ?? null;
    return (
      <View style={{ gap: 10 }}>
        {exercise.kind === 'fillBlank' ? (
          <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.dark }}>
            {exercise.sentence}
          </Text>
        ) : null}
        {exercise.kind === 'listenChoose' && !exercise.audioUrl ? (
          <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.muted }}>
            Audio isn&apos;t available for this exercise yet. Choose the option that matches the
            prompt.
          </Text>
        ) : null}
        {options.map((option, index) => {
          const isSelected = selected === index;
          const isExpected = reveal !== null && expected === option;
          const wrongPick = reveal !== null && isSelected && !reveal.correct;
          const borderColor = isExpected
            ? COLORS.green
            : wrongPick
              ? COLORS.red
              : isSelected
                ? COLORS.green
                : COLORS.line;
          const backgroundColor = isExpected
            ? COLORS.greenSoft
            : wrongPick
              ? COLORS.redSoft
              : isSelected
                ? COLORS.greenSoft
                : COLORS.white;
          return (
            <Pressable
              key={`${exercise.id}-option-${index}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled }}
              disabled={disabled}
              onPress={() => onChange({ kind: 'choice', index })}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 12,
                borderRadius: 14,
                borderWidth: 2,
                borderBottomWidth: 5,
                borderColor,
                borderBottomColor: isExpected
                  ? COLORS.greenDark
                  : wrongPick
                    ? '#991B1B'
                    : isSelected
                      ? COLORS.greenDark
                      : '#D8CBB2',
                backgroundColor,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                opacity: disabled ? 0.85 : 1,
              }}
            >
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  borderWidth: 1.5,
                  borderColor: isSelected || isExpected ? COLORS.greenDark : COLORS.line,
                  backgroundColor: isSelected || isExpected ? COLORS.green : COLORS.creamDeep,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '900',
                    color: isSelected || isExpected ? COLORS.white : COLORS.muted,
                  }}
                >
                  {index + 1}
                </Text>
              </View>
              <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: COLORS.dark }}>
                {option}
              </Text>
              {isExpected ? (
                <Text style={{ fontWeight: '900', color: COLORS.greenDark }}>✓</Text>
              ) : wrongPick ? (
                <Text style={{ fontWeight: '900', color: COLORS.red }}>✕</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    );
  }

  if (exercise.kind === 'typeTranslation') {
    return (
      <TextInput
        accessibilityLabel="Translation answer"
        value={draft.kind === 'text' ? draft.value : ''}
        onChangeText={(value) => onChange({ kind: 'text', value })}
        editable={!disabled}
        placeholder="Type your answer"
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          borderWidth: 2,
          borderBottomWidth: 5,
          borderColor: COLORS.line,
          borderBottomColor: '#D8CBB2',
          borderRadius: 14,
          padding: 14,
          fontSize: 16,
          color: COLORS.dark,
          backgroundColor: COLORS.white,
        }}
      />
    );
  }

  if (exercise.kind === 'matchPairs') {
    const matchedCount = draft.kind === 'pairs' ? draft.matched : 0;
    return (
      <View style={{ gap: 10 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.muted }}>
          Tap a word on the left, then its match on the right.
        </Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, gap: 8 }}>
            {exercise.pairs.map((pair, index) => {
              const isMatched = matchedLeft.includes(index);
              return (
                <Pressable
                  key={`${exercise.id}-left-${index}`}
                  accessibilityRole="button"
                  disabled={disabled || isMatched}
                  onPress={() => setLeftSelected(index)}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderBottomWidth: 5,
                    borderColor: isMatched
                      ? COLORS.green
                      : leftSelected === index
                        ? COLORS.fox
                        : COLORS.line,
                    borderBottomColor: isMatched
                      ? COLORS.greenDark
                      : leftSelected === index
                        ? '#C2410C'
                        : '#D8CBB2',
                    backgroundColor: isMatched ? COLORS.greenSoft : COLORS.white,
                    opacity: isMatched ? 0.6 : 1,
                  }}
                >
                  <Text style={{ fontWeight: '700', color: COLORS.dark }}>{pair[0]}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={{ flex: 1, gap: 8 }}>
            {rightOrder.map((originalIndex) => {
              const pair = exercise.pairs[originalIndex];
              const isMatched = matchedLeft.includes(originalIndex);
              return (
                <Pressable
                  key={`${exercise.id}-right-${originalIndex}`}
                  accessibilityRole="button"
                  disabled={disabled || isMatched}
                  onPress={() => {
                    if (leftSelected === null || draft.kind !== 'pairs') return;
                    if (leftSelected === originalIndex) {
                      const nextMatched = [...matchedLeft, leftSelected];
                      setMatchedLeft(nextMatched);
                      setLeftSelected(null);
                      onChange({ ...draft, matched: nextMatched.length });
                    } else {
                      setLeftSelected(null);
                      onChange({ ...draft, mismatches: draft.mismatches + 1 });
                    }
                  }}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderBottomWidth: 5,
                    borderColor: isMatched ? COLORS.green : COLORS.line,
                    borderBottomColor: isMatched ? COLORS.greenDark : '#D8CBB2',
                    backgroundColor: isMatched ? COLORS.greenSoft : COLORS.white,
                    opacity: isMatched ? 0.6 : 1,
                  }}
                >
                  <Text style={{ fontWeight: '700', color: COLORS.dark }}>{pair?.[1]}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <Text style={{ fontSize: 12, fontWeight: '800', color: COLORS.muted }}>
          Matched {matchedCount} / {exercise.pairs.length} · Mismatches{' '}
          {draft.kind === 'pairs' ? draft.mismatches : 0}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 14, borderRadius: 12, backgroundColor: COLORS.creamDeep }}>
      <Text style={{ fontWeight: '700', color: COLORS.muted }}>
        This exercise can&apos;t be answered on mobile yet.
      </Text>
    </View>
  );
}
