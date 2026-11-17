import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import type { AttemptAnswer, Course, Exercise, GradeResult, Lesson } from '@speeko/core';
import {
  applyReviews,
  eligibleExercises,
  gradeExercise,
  recordCompletion,
  reviewsForAttempt,
} from '@speeko/core';
import { apiFetch, ORIGIN } from '../../../lib/api';
import { loadProgress, saveProgress } from '../../../lib/progress';
import { ExerciseBody } from '../../../components/ExerciseBody';
import { Screen } from '../../../components/Screen';
import {
  ProgressTrack,
  TactileButton,
  TactileCard,
} from '../../../components/Tactile';
import {
  canSubmit,
  earnedExerciseXp,
  initialDraft,
  isSupportedExercise,
  toAnswerInput,
  type DraftAnswer,
} from '../../../lib/exercise';
import { COLORS } from '../../../lib/theme';

type Phase = 'loading' | 'error' | 'playing' | 'feedback' | 'summary' | 'hearts';
type SaveState = 'idle' | 'saving' | 'saved' | 'practice' | 'local' | 'error';

// Short instruction ribbons from the Stitch lesson player. Unsupported kinds
// keep a neutral label because they never pretend to be answerable.
const CATEGORY_LABEL: Partial<Record<Exercise['kind'], string>> = {
  chooseMeaning: 'CHOOSE THE MEANING',
  fillBlank: 'FILL IN THE BLANK',
  listenChoose: 'LISTEN AND CHOOSE',
  typeTranslation: 'TYPE THE TRANSLATION',
  matchPairs: 'MATCH THE PAIRS',
  wordBank: 'BUILD THE TRANSLATION',
  arrangeSentence: 'ARRANGE THE SENTENCE',
  typeWhatYouHear: 'LISTEN, THEN WRITE IT',
  speak: 'SPEAKING PRACTICE',
};

function newAttemptId() {
  return `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function LessonPlayer() {
  const { courseId, lessonId } = useLocalSearchParams<{ courseId: string; lessonId: string }>();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [draft, setDraft] = useState<DraftAnswer>({ kind: 'choice', index: null });
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [answers, setAnswers] = useState<AttemptAnswer[]>([]);
  const [outcomes, setOutcomes] = useState<{ exerciseId: string; correct: boolean }[]>([]);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [awardedXp, setAwardedXp] = useState(0);

  const attemptId = useRef(newAttemptId());
  const shownAt = useRef(Date.now());
  const saving = useRef(false);

  const exercise = lesson?.exercises[index] ?? null;

  const load = useCallback(async () => {
    if (!courseId || !lessonId) {
      setLoadError('This lesson link is incomplete.');
      setPhase('error');
      return;
    }
    setPhase('loading');
    setLoadError(null);
    try {
      const response = await apiFetch(`/api/courses/${courseId}`);
      if (!response.ok) throw new Error(`Lesson could not load (${response.status}).`);
      const loaded = (await response.json()) as Course;
      const found =
        loaded.units
          ?.flatMap((unit) => unit.lessons ?? [])
          .find((candidate) => candidate.id === lessonId) ?? null;
      if (!found) {
        throw new Error('That lesson does not exist in this course.');
      }
      // An empty-audio listenChoose is not a listening task; skip it until
      // an audio asset exists. The source record, ID and draft status stay
      // untouched; only the playable queue differs.
      const playable = eligibleExercises(found.exercises ?? []);
      if (playable.length === 0) {
        throw new Error('This lesson has no playable exercises yet.');
      }
      setCourse(loaded);
      setLesson({ ...found, exercises: playable });
      setIndex(0);
      setHearts(5);
      setAnswers([]);
      setOutcomes([]);
      setGrade(null);
      setDraft(initialDraft(playable[0]!));
      setSaveState('idle');
      setSaveError(null);
      setAwardedXp(0);
      attemptId.current = newAttemptId();
      shownAt.current = Date.now();
      setPhase('playing');
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Lesson could not load.');
      setPhase('error');
    }
  }, [courseId, lessonId]);

  useEffect(() => {
    void load();
  }, [load]);

  const restart = useCallback(() => {
    if (!lesson) return;
    setIndex(0);
    setHearts(5);
    setAnswers([]);
    setOutcomes([]);
    setGrade(null);
    setDraft(initialDraft(lesson.exercises[0]!));
    setSaveState('idle');
    setSaveError(null);
    setAwardedXp(0);
    attemptId.current = newAttemptId();
    shownAt.current = Date.now();
    setPhase('playing');
  }, [lesson]);

  const check = useCallback(() => {
    if (phase !== 'playing' || !exercise) return;
    const input = toAnswerInput(exercise, draft);
    if (!input) return;

    const result = gradeExercise(exercise, input);
    const elapsed = Math.max(0, Date.now() - shownAt.current);
    setAnswers((previous) => [...previous, { exerciseId: exercise.id, input, ms: elapsed }]);
    setOutcomes((previous) => [...previous, { exerciseId: exercise.id, correct: result.correct }]);
    setGrade(result);
    if (!result.correct) {
      setHearts((current) => Math.max(0, current - 1));
    }
    setPhase('feedback');
  }, [draft, exercise, phase]);

  const saveAttempt = useCallback(async () => {
    if (!lesson || !course || saving.current) return;
    saving.current = true;
    setSaveState('saving');
    setSaveError(null);
    try {
      const response = await apiFetch('/api/lesson-completions', {
        method: 'POST',
        headers: { origin: ORIGIN },
        body: JSON.stringify({
          attemptId: attemptId.current,
          courseId: course.id,
          lessonId: lesson.id,
          answers,
        }),
      });

      if (response.status === 401) {
        // The web player treats a signed-out learner as a local guest. Mirror
        // that, and label the award as device-only so no verified XP is claimed.
        const localXp =
          lesson.xpReward + earnedExerciseXp(lesson.exercises, outcomes);
        const reviews = reviewsForAttempt(course.locale, lesson.exercises, outcomes);
        const current = await loadProgress();
        const completed = recordCompletion(current, {
          courseId: course.id,
          lessonId: lesson.id,
          xp: localXp,
          accuracy:
            outcomes.length === 0
              ? 0
              : outcomes.filter((outcome) => outcome.correct).length / outcomes.length,
        });
        await saveProgress(applyReviews(completed, reviews, Date.now()));
        setAwardedXp(localXp);
        setSaveState('local');
        return;
      }

      if (!response.ok) {
        let message = `Your reward was not saved (status ${response.status}).`;
        try {
          const body = (await response.json()) as { error?: unknown; reason?: unknown };
          if (typeof body.error === 'string') message = body.error;
          if (typeof body.reason === 'string') message = `${message} ${body.reason}`;
        } catch {
          // Keep the status-based message.
        }
        setSaveError(message);
        setSaveState('error');
        return;
      }

      const data = (await response.json()) as {
        event?: { xp?: number };
        completion?: { rewarded?: boolean; xp?: number };
        progress?: Parameters<typeof saveProgress>[0];
      };
      if (data.progress) await saveProgress(data.progress);
      const rewarded = data.completion?.rewarded ?? true;
      setAwardedXp(
        typeof data.completion?.xp === 'number'
          ? data.completion.xp
          : typeof data.event?.xp === 'number'
            ? data.event.xp
            : lesson.xpReward,
      );
      setSaveState(rewarded ? 'saved' : 'practice');
    } catch {
      setSaveError('Could not reach Speeko. The lesson is finished, but your reward was not saved yet.');
      setSaveState('error');
    } finally {
      saving.current = false;
    }
  }, [answers, course, lesson, outcomes]);

  useEffect(() => {
    if (phase !== 'summary' || saveState !== 'idle') return;
    void saveAttempt();
  }, [phase, saveState, saveAttempt]);

  const retrySave = useCallback(() => {
    if (saveState === 'saving') return;
    void saveAttempt();
  }, [saveAttempt, saveState]);

  const next = useCallback(() => {
    if (phase !== 'feedback' || !lesson) return;
    if (hearts <= 0) {
      setPhase('hearts');
      return;
    }
    if (index + 1 >= lesson.exercises.length) {
      setPhase('summary');
      return;
    }
    const nextIndex = index + 1;
    const nextExercise = lesson.exercises[nextIndex]!;
    setIndex(nextIndex);
    setDraft(initialDraft(nextExercise));
    setGrade(null);
    shownAt.current = Date.now();
    setPhase('playing');
  }, [hearts, index, lesson, phase]);

  if (phase === 'loading') {
    return (
      <Screen>
        <View style={{ flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator color={COLORS.green} />
          <Text style={{ fontWeight: '700', color: COLORS.muted }}>Loading lesson…</Text>
        </View>
      </Screen>
    );
  }

  if (phase === 'error') {
    return (
      <Screen>
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.dark }}>
            Lesson unavailable
          </Text>
          <Text accessibilityRole="alert" style={{ color: COLORS.red }}>{loadError}</Text>
          <TactileButton label="Try again" onPress={() => void load()} />
          <TactileButton label="Back" tone="cream" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  if (phase === 'hearts') {
    return (
      <Screen>
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.dark }}>Out of hearts</Text>
          <Text style={{ textAlign: 'center', color: COLORS.muted }}>
            This attempt is over and awarded no XP. Look at what tripped you up, then try again.
          </Text>
          <TactileButton
            label="Try the lesson again"
            onPress={restart}
            style={{ alignSelf: 'stretch' }}
          />
          <TactileButton label="Back" tone="cream" onPress={() => router.back()} style={{ alignSelf: 'stretch' }} />
        </View>
      </Screen>
    );
  }

  if (phase === 'summary' && lesson) {
    const accuracy =
      outcomes.length === 0
        ? 0
        : outcomes.filter((outcome) => outcome.correct).length / outcomes.length;
    return (
      <Screen>
        <ScrollView
          contentContainerStyle={{
            padding: 24,
            gap: 14,
            backgroundColor: COLORS.cream,
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
        <Text style={{ fontSize: 30, fontWeight: '900', color: COLORS.dark }}>
          {saveState === 'practice' ? 'Practice complete!' : 'Lesson complete!'}
        </Text>
        <TactileCard style={{ alignSelf: 'stretch' }} tone="white">
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.dark }}>
              {Math.round(accuracy * 100)}% accuracy
            </Text>
            <Text style={{ color: COLORS.muted }}>
              {outcomes.filter((outcome) => outcome.correct).length} of {outcomes.length} correct
            </Text>
          </View>
        </TactileCard>

        {saveState === 'saving' ? (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <ActivityIndicator color={COLORS.green} />
            <Text style={{ fontWeight: '700', color: COLORS.muted }}>Saving your reward…</Text>
          </View>
        ) : null}

        {saveState === 'saved' ? (
          <Text accessibilityRole="text" style={{ fontSize: 18, fontWeight: '800', color: COLORS.greenDark }}>
            +{awardedXp} XP saved to your account
          </Text>
        ) : null}

        {saveState === 'practice' ? (
          <Text accessibilityRole="text" style={{ fontSize: 18, fontWeight: '800', color: COLORS.greenDark }}>
            Lesson saved — practice only, no new completion XP.
          </Text>
        ) : null}

        {saveState === 'local' ? (
          <View style={{ gap: 4, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.greenDark }}>
              +{awardedXp} XP saved on this device
            </Text>
            <Text style={{ textAlign: 'center', color: COLORS.muted, fontSize: 12 }}>
              Sign in to earn verified XP and gems that sync across devices.
            </Text>
          </View>
        ) : null}

        {saveState === 'error' ? (
          <View style={{ gap: 8, alignSelf: 'stretch', alignItems: 'center' }}>
            <Text accessibilityRole="alert" style={{ fontWeight: '800', color: COLORS.red, textAlign: 'center' }}>
              The lesson is finished, but your reward wasn&apos;t saved.
            </Text>
            <Text style={{ textAlign: 'center', color: COLORS.muted }}>{saveError}</Text>
            <TactileButton
              label="Try saving again"
              onPress={retrySave}
              style={{ alignSelf: 'stretch' }}
            />
          </View>
        ) : null}

        <TactileButton
          label="Done"
          onPress={() => router.back()}
          disabled={saveState === 'saving'}
          style={{ alignSelf: 'stretch', marginTop: 6 }}
        />
        </ScrollView>
      </Screen>
    );
  }

  if (!exercise) {
    return (
      <Screen>
        <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
          <Text accessibilityRole="alert" style={{ color: COLORS.red }}>This lesson has no exercises to show.</Text>
        </View>
      </Screen>
    );
  }

  const supported = isSupportedExercise(exercise);
  const ready = phase === 'playing' && supported && canSubmit(exercise, draft);
  const progressLabel = `Question ${index + 1} of ${lesson?.exercises.length ?? 0}`;
  const total = lesson?.exercises.length ?? 0;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          padding: 18,
          gap: 14,
          backgroundColor: COLORS.cream,
          flexGrow: 1,
        }}
      >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Exit lesson"
          onPress={() => router.back()}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            borderWidth: 2,
            borderColor: COLORS.dark,
            backgroundColor: COLORS.white,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontWeight: '900', color: COLORS.dark, fontSize: 16 }}>✕</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <ProgressTrack
            value={total === 0 ? 0 : (index + (phase === 'feedback' ? 1 : 0)) / total}
            height={16}
          />
        </View>
        <View
          accessible
          accessibilityRole="text"
          accessibilityLabel={`${hearts} of 5 hearts left`}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            borderWidth: 2,
            borderBottomWidth: 4,
            borderColor: COLORS.red,
            backgroundColor: COLORS.white,
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Text style={{ color: COLORS.red, fontWeight: '900', fontSize: 14 }}>♥ {hearts}</Text>
        </View>
      </View>

      <Text style={{ fontWeight: '800', color: COLORS.muted, fontSize: 12 }}>{progressLabel}</Text>

      <TactileCard tone="white">
        <View
          style={{
            alignSelf: 'flex-start',
            borderRadius: 999,
            borderWidth: 1.5,
            borderColor: '#C2410C',
            backgroundColor: '#FFE3D3',
            paddingHorizontal: 9,
            paddingVertical: 3,
            marginBottom: 8,
          }}
        >
          <Text style={{ fontSize: 9, fontWeight: '900', color: '#9D4300', letterSpacing: 0.5 }}>
            {CATEGORY_LABEL[exercise.kind] ?? 'EXERCISE'}
          </Text>
        </View>
        <Text style={{ fontSize: 12, fontWeight: '800', color: COLORS.muted, marginBottom: 2 }}>
          {lesson?.title}
        </Text>
        <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.dark }}>
          {exercise.prompt}
        </Text>
        {exercise.transliteration ? (
          <Text style={{ color: COLORS.muted, fontWeight: '600', marginTop: 2 }}>
            {exercise.transliteration}
          </Text>
        ) : null}
      </TactileCard>

      <ExerciseBody
        key={exercise.id}
        exercise={exercise}
        draft={draft}
        onChange={setDraft}
        disabled={phase !== 'playing'}
        reveal={grade}
        locale={course?.locale}
      />

      {phase === 'feedback' && grade ? (
        <View
          accessibilityRole="alert"
          style={{
            padding: 14,
            borderRadius: 14,
            borderWidth: 2,
            borderColor: grade.correct ? COLORS.green : COLORS.red,
            backgroundColor: grade.correct ? COLORS.greenSoft : COLORS.redSoft,
            gap: 4,
          }}
        >
          <Text style={{ fontWeight: '900', color: grade.correct ? COLORS.greenDark : COLORS.red }}>
            {grade.correct ? 'Correct!' : 'Not quite'}
          </Text>
          {!grade.correct && grade.expected ? (
            <Text style={{ color: COLORS.dark }}>
              Correct answer: <Text style={{ fontWeight: '800' }}>{grade.expected}</Text>
            </Text>
          ) : null}
        </View>
      ) : null}

      {!supported ? (
        <TactileButton label="Back to lessons" tone="cream" onPress={() => router.back()} />
      ) : phase === 'feedback' ? (
        <TactileButton
          label={
            hearts <= 0
              ? 'See result'
              : index + 1 >= (lesson?.exercises.length ?? 0)
                ? 'See results'
                : 'Continue'
          }
          onPress={next}
        />
      ) : (
        <TactileButton
          label="Check"
          onPress={check}
          disabled={!ready}
          accessibilityState={{ disabled: !ready }}
        />
      )}
      </ScrollView>
    </Screen>
  );
}
