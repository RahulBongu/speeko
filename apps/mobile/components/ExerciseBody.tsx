import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import type { Exercise, GradeResult } from '@speeko/core';
import {
  choiceOptions,
  deterministicShuffle,
  getTokenPool,
  isSupportedExercise,
  matchPairOrder,
  type DraftAnswer,
} from '../lib/exercise';
import { TactileCard } from './Tactile';
import { COLORS } from '../lib/theme';
import { hasMobileAudio, playMobileAudio } from '../lib/audio';

interface ExerciseBodyProps {
  exercise: Exercise;
  draft: DraftAnswer;
  onChange: (next: DraftAnswer) => void;
  disabled: boolean;
  reveal: GradeResult | null;
  /** BCP-47 locale of the course, used to mark native-script text. */
  locale?: string | undefined;
}

/**
 * One shared board for every exercise kind the mobile player supports.
 *
 * Lesson and practice runners both render this, so a fillBlank is always a
 * choice board and a listenChoose never pretends to have audio it doesn't.
 * Unsupported kinds are rendered as an honest block instead of a fake input.
 */
export function ExerciseBody({
  exercise,
  draft,
  onChange,
  disabled,
  reveal,
  locale,
}: ExerciseBodyProps) {
  const options = choiceOptions(exercise);
  const pairs = exercise.kind === 'matchPairs' ? exercise.pairs : null;
  const rightOrder = useMemo(
    () => (pairs ? matchPairOrder(pairs, exercise.id) : []),
    [pairs, exercise.id],
  );
  const [leftSelected, setLeftSelected] = useState<number | null>(null);
  const [matchedLeft, setMatchedLeft] = useState<number[]>([]);
  const [playingAudio, setPlayingAudio] = useState(false);

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
        {exercise.kind === 'listenChoose' && hasMobileAudio(exercise.id) ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Play the phrase"
            onPress={async () => {
              setPlayingAudio(true);
              const ok = await playMobileAudio(exercise.id);
              if (!ok) setPlayingAudio(false);
              setTimeout(() => setPlayingAudio(false), 3000);
            }}
            style={{
              alignSelf: 'center',
              width: 64,
              height: 64,
              borderRadius: 32,
              borderWidth: 2,
              borderColor: COLORS.dark,
              backgroundColor: COLORS.green,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 24, color: COLORS.white, fontWeight: '900' }}>
              {playingAudio ? '...' : '>'}
            </Text>
          </Pressable>
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

  if (exercise.kind === 'wordBank' || exercise.kind === 'arrangeSentence') {
    const pool = getTokenPool(exercise) ?? [];
    const selected = draft.kind === 'tokens' ? draft.value : [];
    // Shuffle {text, poolIndex} pairs so duplicate tokens still map back to
    // the right pool position. Deterministic per exercise id.
    const order = deterministicShuffle(
      pool.map((text, poolIndex) => ({ text, poolIndex })),
      exercise.id,
    );
    const selectedTokens = selected
      .map((poolIndex) => ({ poolIndex, text: pool[poolIndex] }))
      .filter(
        (token): token is { poolIndex: number; text: string } => typeof token.text === 'string',
      );
    const pick = (poolIndex: number) => {
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
    const clear = () => {
      if (disabled) return;
      onChange({ kind: 'tokens', value: [] });
    };
    return (
      <View style={{ gap: 10 }}>
        <Text style={{ fontSize: 12, fontWeight: '800', color: COLORS.muted, letterSpacing: 0.5 }}>
          {exercise.kind === 'wordBank' ? 'BUILD THE TRANSLATION' : 'ARRANGE THE SENTENCE'}
        </Text>
        <Text
          accessibilityRole="header"
          style={{ fontSize: 18, fontWeight: '900', color: COLORS.dark }}
        >
          {exercise.prompt}
        </Text>
        <View
          accessibilityLabel="Your answer"
          style={{
            minHeight: 64,
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: COLORS.line,
            borderRadius: 14,
            padding: 10,
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            alignItems: 'center',
            backgroundColor: COLORS.white,
          }}
        >
          {selectedTokens.length === 0 ? (
            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.muted }}>
              {exercise.kind === 'wordBank'
                ? 'Tap the words below to build your answer.'
                : 'Tap the tiles below to build your answer.'}
            </Text>
          ) : (
            selectedTokens.map((token, position) => (
              <Pressable
                key={`${token.poolIndex}-${position}`}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${token.text}`}
                accessibilityState={{ disabled }}
                disabled={disabled}
                onPress={() => removeAt(position)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  borderWidth: 2,
                  borderBottomWidth: 4,
                  borderColor: COLORS.greenDark,
                  borderBottomColor: COLORS.greenDark,
                  backgroundColor: COLORS.greenSoft,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  opacity: disabled ? 0.85 : 1,
                }}
              >
                <Text
                  accessibilityLanguage={locale}
                  style={{ fontSize: 16, fontWeight: '800', color: COLORS.dark }}
                >
                  {token.text}
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '900', color: COLORS.muted }}>✕</Text>
              </Pressable>
            ))
          )}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {order.map(({ text, poolIndex }) => {
            if (selected.includes(poolIndex)) return null;
            return (
              <Pressable
                key={`${poolIndex}-${text}`}
                accessibilityRole="button"
                accessibilityState={{ disabled }}
                disabled={disabled}
                onPress={() => pick(poolIndex)}
                style={{
                  borderWidth: 2,
                  borderBottomWidth: 5,
                  borderColor: COLORS.line,
                  borderBottomColor: '#D8CBB2',
                  backgroundColor: COLORS.white,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  opacity: disabled ? 0.6 : 1,
                }}
              >
                <Text
                  accessibilityLanguage={locale}
                  style={{ fontSize: 17, fontWeight: '800', color: COLORS.dark }}
                >
                  {text}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {selectedTokens.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear answer"
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={clear}
            hitSlop={8}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '800',
                color: COLORS.muted,
                textDecorationLine: 'underline',
              }}
            >
              Clear answer
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  if (exercise.kind === 'typeTranslation' || exercise.kind === 'typeWhatYouHear') {
    const whatYouHear = exercise.kind === 'typeWhatYouHear';
    return (
      <View style={{ gap: 10 }}>
        {whatYouHear ? (
          <View style={{ gap: 6 }}>
            <Text
              style={{ fontSize: 12, fontWeight: '800', color: COLORS.muted, letterSpacing: 0.5 }}
            >
              LISTEN, THEN WRITE IT
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.muted }}>
              Audio is not available on this build — the phrase is shown.
            </Text>
            <View
              style={{
                borderWidth: 2,
                borderColor: COLORS.gold,
                borderRadius: 12,
                padding: 12,
                backgroundColor: COLORS.creamDeep,
              }}
            >
              <Text
                accessibilityLanguage={locale}
                style={{
                  fontSize: 20,
                  fontWeight: '900',
                  color: COLORS.dark,
                  textAlign: 'center',
                }}
              >
                {exercise.expected[0] ?? ''}
              </Text>
            </View>
          </View>
        ) : null}
        <TextInput
          accessibilityLabel={whatYouHear ? 'Type what you hear' : 'Translation answer'}
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
      </View>
    );
  }

  if (exercise.kind === 'speak') {
    const expected = exercise.expected[0] ?? '';
    const transcript = draft.kind === 'speak' ? draft.transcript : '';
    const selfReported = draft.kind === 'speak' ? draft.selfReported : false;
    return (
      <View style={{ gap: 10 }}>
        <Text style={{ fontSize: 12, fontWeight: '800', color: COLORS.muted, letterSpacing: 0.5 }}>
          SPEAKING PRACTICE
        </Text>
        <Text
          accessibilityRole="header"
          style={{ fontSize: 18, fontWeight: '900', color: COLORS.dark }}
        >
          {exercise.prompt}
        </Text>
        <TactileCard tone="cream">
          <Text
            style={{
              fontSize: 11,
              fontWeight: '800',
              color: COLORS.muted,
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              textAlign: 'center',
            }}
          >
            Say this
          </Text>
          <Text
            accessibilityLanguage={locale}
            style={{
              fontSize: 24,
              fontWeight: '900',
              color: COLORS.dark,
              textAlign: 'center',
              marginTop: 4,
            }}
          >
            {expected}
          </Text>
        </TactileCard>
        <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.muted }}>
          Type what you said
        </Text>
        <TextInput
          accessibilityLabel="Type what you said"
          value={transcript}
          onChangeText={(value) => onChange({ kind: 'speak', transcript: value, selfReported: false })}
          editable={!disabled}
          placeholder="Type what you said"
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
        {exercise.softScore !== false ? (
          <Pressable
            accessibilityRole="switch"
            accessibilityLabel="I said it out loud"
            accessibilityState={{ checked: selfReported, disabled }}
            disabled={disabled}
            onPress={() =>
              onChange({ kind: 'speak', transcript, selfReported: !selfReported })
            }
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              borderWidth: 2,
              borderColor: selfReported ? COLORS.greenDark : COLORS.line,
              borderRadius: 14,
              backgroundColor: selfReported ? COLORS.greenSoft : COLORS.white,
              padding: 12,
              opacity: disabled ? 0.85 : 1,
            }}
          >
            <Text style={{ flex: 1, fontSize: 15, fontWeight: '800', color: COLORS.dark }}>
              I said it out loud
            </Text>
            <View
              style={{
                width: 46,
                height: 26,
                borderRadius: 13,
                backgroundColor: selfReported ? COLORS.green : COLORS.disabled,
                padding: 2,
                justifyContent: 'center',
                alignItems: selfReported ? 'flex-end' : 'flex-start',
              }}
            >
              <View
                style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.white }}
              />
            </View>
          </Pressable>
        ) : null}
      </View>
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
