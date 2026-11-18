import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import type { Course, Exercise, GradeResult, ProgressState } from '@speeko/core';
import {
  applyReviews,
  buildDuePracticePlan,
  gradeExercise,
  practiceOverview,
  reviewsForAttempt,
} from '@speeko/core';
import { apiFetch } from '../../lib/api';
import { loadProgress, saveProgress } from '../../lib/progress';
import { syncProgressIfSignedIn } from '../../lib/sync';
import { ExerciseBody } from '../../components/ExerciseBody';
import { Screen } from '../../components/Screen';
import { TactileButton, TactileCard } from '../../components/Tactile';
import {
  canSubmit,
  initialDraft,
  isSupportedExercise,
  toAnswerInput,
  type DraftAnswer,
} from '../../lib/exercise';
import { COLORS } from '../../lib/theme';

type Phase = 'loading' | 'error' | 'empty' | 'playing' | 'feedback' | 'summary';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function formatDue(timestamp: number | null): string {
  if (!timestamp) return 'Complete a lesson to start building your review queue.';
  const days = Math.max(0, Math.ceil((timestamp - Date.now()) / 86_400_000));
  if (days <= 0) return 'Cards are due now — reopen practice to start.';
  return `Next review in ${days} day${days === 1 ? '' : 's'}.`;
}

export default function PracticeRunner() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [emptyMessage, setEmptyMessage] = useState('');
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState<DraftAnswer>({ kind: 'choice', index: null });
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [outcomes, setOutcomes] = useState<{ exerciseId: string; correct: boolean }[]>([]);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  const exercise = exercises[index] ?? null;

  const load = useCallback(async () => {
    if (!courseId) {
      setLoadError('This practice link is incomplete.');
      setPhase('error');
      return;
    }
    setPhase('loading');
    setLoadError(null);
    try {
      const [synced, courseResponse] = await Promise.all([
        syncProgressIfSignedIn().catch(() => null),
        apiFetch(`/api/courses/${courseId}`),
      ]);
      const saved = synced?.progress ?? (await loadProgress());
      if (!courseResponse.ok) {
        throw new Error(`Practice could not load (${courseResponse.status}).`);
      }
      const loaded = (await courseResponse.json()) as Course;
      const plan = buildDuePracticePlan(loaded, saved, Date.now(), 10);
      setCourse(loaded);
      setProgress(saved);
      setOutcomes([]);
      setGrade(null);
      setSaveState('idle');
      setSaveError(null);
      setIndex(0);

      if (plan.exercises.length === 0) {
        const overview = practiceOverview(loaded, saved);
        if (overview.learnedCount === 0) {
          setEmptyMessage('Finish a lesson first. Practice only reviews words you have already learned.');
        } else {
          setEmptyMessage(`Nothing is due right now. ${formatDue(overview.nextDueAt)}`);
        }
        setExercises([]);
        setPhase('empty');
        return;
      }

      setExercises(plan.exercises);
      setDraft(initialDraft(plan.exercises[0]!));
      setPhase('playing');
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Practice could not load.');
      setPhase('error');
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const check = useCallback(() => {
    if (phase !== 'playing' || !exercise) return;
    const input = toAnswerInput(exercise, draft);
    if (!input) return;
    const result = gradeExercise(exercise, input);
    setOutcomes((previous) => [...previous, { exerciseId: exercise.id, correct: result.correct }]);
    setGrade(result);
    setPhase('feedback');
  }, [draft, exercise, phase]);

  const next = useCallback(() => {
    if (phase !== 'feedback') return;
    if (index + 1 >= exercises.length) {
      setPhase('summary');
      return;
    }
    const nextIndex = index + 1;
    setIndex(nextIndex);
    setDraft(initialDraft(exercises[nextIndex]!));
    setGrade(null);
    setPhase('playing');
  }, [exercises, index, phase]);

  const saveReviews = useCallback(async () => {
    if (!course || !progress) return;
    setSaveState('saving');
    setSaveError(null);
    try {
      const reviews = reviewsForAttempt(course.locale, exercises, outcomes);
      // Reload before writing so reviews are not applied on a stale snapshot.
      const current = await loadProgress();
      const updated = applyReviews(current, reviews, Date.now());
      await saveProgress(updated);
      setProgress(updated);
      // Push the updated review schedule to the signed-in account. Best-effort:
      // an offline device keeps the local schedule and syncs on the next visit.
      void syncProgressIfSignedIn().catch(() => {});
      setSaveState('saved');
    } catch {
      setSaveError('Your answers were graded, but the review schedule could not be saved.');
      setSaveState('error');
    }
  }, [course, exercises, outcomes, progress]);

  useEffect(() => {
    if (phase !== 'summary' || saveState !== 'idle') return;
    void saveReviews();
  }, [phase, saveReviews, saveState]);

  if (phase === 'loading') {
    return (
      <Screen>
        <View style={{ flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator color={COLORS.green} />
          <Text style={{ fontWeight: '700', color: COLORS.muted }}>Building your review…</Text>
        </View>
      </Screen>
    );
  }

  if (phase === 'error') {
    return (
      <Screen>
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 12 }}>
          <TactileCard tone="white">
            <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.dark }}>
              Practice unavailable
            </Text>
            <Text accessibilityRole="alert" style={{ color: COLORS.red, marginTop: 4 }}>{loadError}</Text>
          </TactileCard>
          <TactileButton label="Try again" onPress={() => void load()} />
          <TactileButton label="Back" tone="cream" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  if (phase === 'empty') {
    return (
      <Screen>
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <TactileCard tone="white" style={{ alignSelf: 'stretch' }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.dark, textAlign: 'center' }}>
              Nothing to review
            </Text>
            <Text style={{ textAlign: 'center', color: COLORS.muted, marginTop: 4 }}>
              {emptyMessage}
            </Text>
          </TactileCard>
          <TactileButton
            label="Back to practice"
            onPress={() => router.back()}
            style={{ alignSelf: 'stretch' }}
          />
        </View>
      </Screen>
    );
  }

  if (phase === 'summary') {
    const correct = outcomes.filter((outcome) => outcome.correct).length;
    return (
      <Screen>
        <ScrollView
          contentContainerStyle={{
            padding: 24,
            gap: 14,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: COLORS.cream,
            flexGrow: 1,
          }}
        >
          <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.dark }}>Review complete!</Text>
          <TactileCard tone="white" style={{ alignSelf: 'stretch' }}>
            <View style={{ alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.dark }}>
                {correct} of {outcomes.length} correct
              </Text>
              <Text style={{ textAlign: 'center', color: COLORS.muted }}>
                No XP is awarded in practice. Your answers move each word through its review box.
              </Text>
            </View>
          </TactileCard>

        {saveState === 'saving' ? (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <ActivityIndicator color={COLORS.green} />
            <Text style={{ fontWeight: '700', color: COLORS.muted }}>Saving review schedule…</Text>
          </View>
        ) : null}
        {saveState === 'saved' ? (
          <Text style={{ fontWeight: '800', color: COLORS.greenDark }}>
            Review schedule saved on this device
          </Text>
        ) : null}
        {saveState === 'error' ? (
          <View style={{ gap: 8, alignItems: 'center' }}>
            <Text accessibilityRole="alert" style={{ fontWeight: '800', color: COLORS.red }}>{saveError}</Text>
            <TactileButton
              label="Try saving again"
              onPress={() => void saveReviews()}
              style={{ alignSelf: 'stretch', minWidth: 180 }}
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
          <Text accessibilityRole="alert" style={{ color: COLORS.red }}>This review has no exercises.</Text>
        </View>
      </Screen>
    );
  }

  const supported = isSupportedExercise(exercise);
  const ready = phase === 'playing' && supported && canSubmit(exercise, draft);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, backgroundColor: COLORS.cream, flexGrow: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Exit practice"
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
          <Text style={{ flex: 1, fontWeight: '800', color: COLORS.muted }}>
            Card {index + 1} of {exercises.length}
          </Text>
          <Text style={{ fontWeight: '800', color: COLORS.muted }}>Practice · no XP</Text>
        </View>
      <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.dark }}>{exercise.prompt}</Text>
      {exercise.transliteration ? (
        <Text style={{ color: COLORS.muted, fontWeight: '600' }}>{exercise.transliteration}</Text>
      ) : null}

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
        <TactileButton label="Back to practice" tone="cream" onPress={() => router.back()} />
      ) : phase === 'feedback' ? (
        <TactileButton
          label={index + 1 >= exercises.length ? 'See results' : 'Continue'}
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
