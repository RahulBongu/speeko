import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AttemptAnswer, Course, Exercise, GradeResult, Lesson, MascotState, ProgressState, Unit } from '@speeko/core';
import {
  LOCALE_ENGLISH_NAME,
  applyReviews,
  buildModuleBrief,
  eligibleExercises,
  formatExercisePrompt,
  gradeExercise,
  lessonKey,
  recordCompletion,
  resolveMascotTransition,
  reviewsForAttempt,
} from '@speeko/core';
import { apiFetch, ORIGIN } from '../../../lib/api';
import { loadProgress, saveProgress } from '../../../lib/progress';
import { ExerciseBody } from '../../../components/ExerciseBody';
import { Fox } from '../../../components/Fox';
import { InlineModuleBriefBanner } from '../../../components/ModuleBriefModal';
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
import {
  nextVariedMascotReaction,
  playMascotVoice,
  stopMascotVoice,
  useMascotListening,
  useMascotSpeaking,
} from '../../../lib/mascot';
import { playMobileSound, stopMobileSound } from '../../../lib/sound';
import { stopMobileAudio } from '../../../lib/audio';

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
  const { courseId, lessonId, briefed } = useLocalSearchParams<{
    courseId: string;
    lessonId: string;
    briefed?: string;
  }>();
  const router = useRouter();
  const [briefDismissed, setBriefDismissed] = useState(briefed === '1');

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
  const [cosmetic, setCosmetic] = useState<ProgressState['equippedCosmetic']>(null);
  const [feedbackPhrase, setFeedbackPhrase] = useState('');
  const [summaryPhrase, setSummaryPhrase] = useState('Amazing work! Lesson conquered!');
  const [completedUnitTitle, setCompletedUnitTitle] = useState<string | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [priorProgress, setPriorProgress] = useState<ProgressState | null>(null);
  const [combo, setCombo] = useState(0);
  const [lookAt, setLookAt] = useState<{ x: number; y: number } | null>(null);
  const [greetingIntro, setGreetingIntro] = useState(false);
  const [learnerConsidering, setLearnerConsidering] = useState(false);

  const attemptId = useRef(newAttemptId());
  const shownAt = useRef(Date.now());
  const saving = useRef(false);
  const greetingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const exercise = lesson?.exercises[index] ?? null;
  const mascotSpeaking = useMascotSpeaking();
  const mascotListening = useMascotListening();
  const feedbackMood: MascotState =
    phase === 'feedback' && grade
      ? grade.correct
        ? combo >= 4
          ? 'excited'
          : combo === 3
            ? 'surprise'
            : 'correct_answer'
        : 'incorrect_supportive'
      : 'idle';
  const summaryAccuracy =
    outcomes.length === 0
      ? 0
      : outcomes.filter((outcome) => outcome.correct).length / outcomes.length;
  const foxMood: MascotState =
    phase === 'feedback'
      ? feedbackMood
      : phase === 'summary'
        ? completedUnitTitle || summaryAccuracy >= 1
          ? 'victory_dance'
          : 'lesson_complete'
        : resolveMascotTransition(
            greetingIntro ? 'greeting' : 'idle',
            mascotSpeaking
              ? 'talking'
              : mascotListening
                ? 'listening'
                : learnerConsidering
                  ? 'thinking'
                  : 'idle',
          );

  const load = useCallback(async () => {
    if (!courseId || !lessonId) {
      setLoadError('This lesson link is incomplete.');
      setPhase('error');
      return;
    }
    setPhase('loading');
    setLoadError(null);
    try {
      const [response, savedProgress] = await Promise.all([
        apiFetch(`/api/courses/${courseId}`),
        loadProgress().catch(() => null),
      ]);
      if (savedProgress?.equippedCosmetic) setCosmetic(savedProgress.equippedCosmetic);
      if (!response.ok) throw new Error(`Lesson could not load (${response.status}).`);
      const loaded = (await response.json()) as Course;
      const foundUnit =
        loaded.units?.find((candidateUnit) =>
          (candidateUnit.lessons ?? []).some((candidate) => candidate.id === lessonId),
        ) ?? null;
      const found =
        foundUnit?.lessons?.find((candidate) => candidate.id === lessonId) ?? null;
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
      setUnit(foundUnit);
      setPriorProgress(savedProgress);
      setCompletedUnitTitle(null);
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
      setLearnerConsidering(false);
      setGreetingIntro(true);
      if (greetingTimer.current) clearTimeout(greetingTimer.current);
      greetingTimer.current = setTimeout(() => {
        setGreetingIntro(false);
        greetingTimer.current = null;
      }, 950);
      setPhase('playing');
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Lesson could not load.');
      setPhase('error');
    }
  }, [courseId, lessonId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Stop any lesson audio, SFX, or mascot voice when this screen goes away, so
  // playback never continues behind another screen or after a deep-link exit.
  useEffect(() => {
    return () => {
      if (greetingTimer.current) {
        clearTimeout(greetingTimer.current);
        greetingTimer.current = null;
      }
      void stopMobileAudio();
      void stopMascotVoice();
      void stopMobileSound();
    };
  }, []);

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
    setCombo(0);
    setLearnerConsidering(false);
    setGreetingIntro(false);
    setLookAt(null);
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
    setCombo((current) => (result.correct ? current + 1 : 0));
    setLookAt(null);
    const pick = nextVariedMascotReaction(
      result.correct ? 'correct_answer' : 'incorrect_answer',
    );
    setFeedbackPhrase(pick.phrase);
    void playMobileSound(result.correct ? 'correct' : 'incorrect', pick.sfxKey);
    void playMascotVoice(pick.reactionId, pick.audioKey);
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
      const encouragePick = nextVariedMascotReaction('encouragement');
      void playMascotVoice('encouragement', encouragePick.audioKey);
      setPhase('hearts');
      return;
    }
    if (index + 1 >= lesson.exercises.length) {
      const completesModule =
        Boolean(course && unit && unit.lessons.length > 0) &&
        unit!.lessons.every(
          (entry) =>
            entry.id === lesson.id ||
            Boolean(priorProgress?.completed[lessonKey(course!.id, entry.id)]),
        );
      setCompletedUnitTitle(completesModule && unit ? unit.title : null);
      const completePick = nextVariedMascotReaction(
        completesModule ? 'unit_complete' : 'lesson_complete',
      );
      setSummaryPhrase(completePick.phrase);
      void playMobileSound(
        completesModule ? 'unit_complete' : 'complete',
        completePick.sfxKey,
      );
      void playMascotVoice(completePick.reactionId, completePick.audioKey);
      setPhase('summary');
      return;
    }
    const nextIndex = index + 1;
    const nextExercise = lesson.exercises[nextIndex]!;
    setIndex(nextIndex);
    setDraft(initialDraft(nextExercise));
    setGrade(null);
    setLearnerConsidering(false);
    setGreetingIntro(false);
    setLookAt(null);
    shownAt.current = Date.now();
    setPhase('playing');
  }, [course, hearts, index, lesson, phase, priorProgress, unit]);

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
          <Fox
            mood="sad"
            accessory={cosmetic}
            speaking={mascotSpeaking}
            style={{ width: 112, height: 112 }}
            title="Speeko encouraging you to try again"
          />
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
        <Fox
          mood={foxMood}
          accessory={cosmetic}
          combo={completedUnitTitle ? Math.max(5, combo) : combo}
          speaking={mascotSpeaking}
          style={{ width: 132, height: 132 }}
          title="Speeko celebrating your lesson"
        />
        {completedUnitTitle && saveState !== 'practice' ? (
          <View
            style={{
              borderRadius: 999,
              backgroundColor: COLORS.creamDeep,
              borderWidth: 1.5,
              borderColor: COLORS.gold,
              paddingHorizontal: 14,
              paddingVertical: 5,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '900', color: COLORS.goldInk }}>
              MODULE MASTERED · {completedUnitTitle.toUpperCase()}
            </Text>
          </View>
        ) : null}
        <Text style={{ fontSize: 30, fontWeight: '900', color: COLORS.dark }}>
          {saveState === 'practice' ? 'Practice complete!' : 'Lesson complete!'}
        </Text>
        <Text style={{ color: COLORS.greenDark, fontWeight: '800', fontSize: 15, textAlign: 'center' }}>
          {summaryPhrase}
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

  const actionButton = !supported ? (
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
  );

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          padding: 18,
          paddingBottom: 110,
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

      {phase === 'playing' && course && unit && lesson?.order === 0 && index === 0 && !briefDismissed ? (
        (() => {
          const uIdx = course.units.findIndex((u) => u.id === unit.id);
          const brief = uIdx >= 0 ? buildModuleBrief(course, uIdx) : null;
          return brief ? (
            <InlineModuleBriefBanner
              brief={brief}
              onContinue={() => setBriefDismissed(true)}
            />
          ) : null;
        })()
      ) : null}

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
          {formatExercisePrompt(
            exercise,
            course ? LOCALE_ENGLISH_NAME[course.locale] : 'target language',
          )}
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
        onChange={(nextDraft) => {
          setDraft(nextDraft);
          setGreetingIntro(false);
          setLearnerConsidering(true);
          if (nextDraft.kind === 'choice' && nextDraft.index !== null) {
            setLookAt({ x: nextDraft.index % 2 === 0 ? -0.45 : 0.45, y: -0.65 });
          } else {
            setLookAt({ x: 0, y: -0.6 });
          }
        }}
        disabled={phase !== 'playing'}
        reveal={grade}
        locale={course?.locale}
      />

      {phase === 'playing' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Fox
            mood={foxMood}
            accessory={cosmetic}
            speaking={mascotSpeaking}
            listening={mascotListening}
            lookAt={lookAt}
            combo={combo}
            style={{ width: 52, height: 52 }}
          />
          <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: COLORS.muted }}>
            {mascotListening
              ? 'Speeko is listening carefully…'
              : combo >= 3
                ? `${combo} in a row! Keep that streak burning!`
                : 'Tap an answer — Speeko is cheering you on.'}
          </Text>
        </View>
      ) : null}

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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Fox
              mood={foxMood}
              accessory={cosmetic}
              speaking={mascotSpeaking}
              listening={mascotListening}
              combo={combo}
              style={{ width: 52, height: 52 }}
              title="Speeko reacting to your answer"
            />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontWeight: '900', color: grade.correct ? COLORS.greenDark : COLORS.red }}>
                {grade.correct ? 'Correct!' : 'Not quite'}
              </Text>
              {feedbackPhrase ? (
                <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.dark }}>
                  {feedbackPhrase}
                </Text>
              ) : null}
            </View>
          </View>
          {!grade.correct && grade.expected ? (
            <Text style={{ color: COLORS.dark }}>
              Correct answer: <Text style={{ fontWeight: '800' }}>{grade.expected}</Text>
            </Text>
          ) : null}
        </View>
      ) : null}

      </ScrollView>
      <SafeAreaView edges={['bottom']} style={{ backgroundColor: COLORS.cream }}>
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: COLORS.line,
            paddingHorizontal: 18,
            paddingTop: 10,
            paddingBottom: 6,
            backgroundColor: COLORS.cream,
            gap: 6,
          }}
        >
          {actionButton}
          {phase === 'playing' ? (
            <Text style={{ textAlign: 'center', fontSize: 11, color: COLORS.muted }}>
              Choose an answer, then check.
            </Text>
          ) : null}
        </View>
      </SafeAreaView>
    </Screen>
  );
}
