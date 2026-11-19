import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import type { Course, Lesson, ProgressState } from '@speeko/core';
import { LOCALE_LABEL, eligibleExercises, lessonKey } from '@speeko/core';
import { apiFetch } from '../../lib/api';
import { loadProgress } from '../../lib/progress';
import { AppNav } from '../../components/AppNav';
import { Screen } from '../../components/Screen';
import {
  ProgressTrack,
  SpeekoAppBar,
  TactileButton,
  TactileCard,
  TactilePressable,
} from '../../components/Tactile';
import { COLORS } from '../../lib/theme';

type LessonState = 'completed' | 'current' | 'locked';

// The Stitch path snakes down the screen. Offsets repeat every four lessons so
// the trail keeps winding without drifting off a narrow phone.
const OFFSETS = [0, -56, 0, 56] as const;

function PathNode({
  lesson,
  index,
  state,
  onPress,
  onCurrentLayout,
}: {
  lesson: Lesson;
  index: number;
  state: LessonState;
  onPress: () => void;
  onCurrentLayout?: ((y: number) => void) | undefined;
}) {
  const locked = state === 'locked';
  const current = state === 'current';
  const size = current ? 76 : 64;
  const edge = locked ? '#CFC6B8' : COLORS.greenDark;
  const face = locked ? '#E7E0D4' : COLORS.green;

  return (
    <View
      onLayout={
        current && onCurrentLayout
          ? (event) => onCurrentLayout(event.nativeEvent.layout.y)
          : undefined
      }
      style={{
        alignItems: 'center',
        alignSelf: 'center',
        marginVertical: 8,
        transform: [{ translateX: OFFSETS[index % OFFSETS.length]! }],
        maxWidth: 220,
      }}
    >
      {current ? (
        <View
          style={{
            marginBottom: 6,
            borderRadius: 999,
            backgroundColor: COLORS.fox,
            borderWidth: 2,
            borderColor: '#C2410C',
            paddingHorizontal: 12,
            paddingVertical: 4,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: '900', color: COLORS.white }}>
            START · LESSON {index + 1}
          </Text>
        </View>
      ) : null}

      <View
        style={{
          borderRadius: 999,
          backgroundColor: edge,
          paddingBottom: current ? 6 : 5,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            locked
              ? `${lesson.title}: locked, finish the previous lesson first`
              : `${lesson.title}: ${state === 'completed' ? 'completed, replay' : 'start lesson'}`
          }
          accessibilityState={{ disabled: locked }}
          disabled={locked}
          onPress={onPress}
          style={({ pressed }) => ({
            width: size,
            height: size,
            borderRadius: 999,
            borderWidth: 2,
            borderColor: locked ? '#B6AB9A' : COLORS.dark,
            backgroundColor: face,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: pressed ? 1 : current ? 6 : 5,
            marginTop: pressed ? 5 : 0,
            opacity: locked ? 0.8 : 1,
          })}
        >
          <Text
            style={{
              fontSize: current ? 28 : 24,
              fontWeight: '900',
              color: locked ? COLORS.muted : COLORS.white,
            }}
          >
            {state === 'completed' ? '✓' : locked ? '🔒' : '▶'}
          </Text>
        </Pressable>
      </View>

      <Text
        style={{
          marginTop: 6,
          textAlign: 'center',
          fontSize: current ? 16 : 14,
          fontWeight: '900',
          color: locked ? COLORS.muted : current ? COLORS.greenDark : COLORS.dark,
        }}
      >
        {lesson.title}
      </Text>
      <Text style={{ fontSize: 10, fontWeight: '700', color: COLORS.muted, textAlign: 'center' }}>
        {eligibleExercises(lesson.exercises).length} exercises · {lesson.xpReward} XP
        {state === 'completed' ? ' · Replay' : ''}
      </Text>
    </View>
  );
}

export default function Path() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // The path climbs upward, so the first lesson renders at the bottom. These
  // refs remember where the current lesson landed and scroll it into view once
  // after the first layout.
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const unitOffsets = useRef<Record<string, number>>({});
  const scrollTarget = useRef<{ unitId: string; nodeY: number } | null>(null);
  const didScroll = useRef(false);

  function tryScrollToCurrent() {
    if (didScroll.current || !scrollTarget.current) return;
    const unitY = unitOffsets.current[scrollTarget.current.unitId];
    if (unitY === undefined) return;
    didScroll.current = true;
    scrollRef.current?.scrollTo({
      y: Math.max(0, unitY + scrollTarget.current.nodeY - 160),
      animated: false,
    });
  }

  const load = useCallback(async () => {
    if (!courseId) {
      setError('This course link is incomplete.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [response, saved] = await Promise.all([
        apiFetch(`/api/courses/${courseId}`),
        loadProgress(),
      ]);
      if (!response.ok) {
        throw new Error(
          response.status === 404
            ? 'That course does not exist.'
            : `Course could not load (${response.status}).`,
        );
      }
      setCourse((await response.json()) as Course);
      setProgress(saved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load course.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <Screen>
        <View style={{ flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator color={COLORS.green} />
          <Text style={{ fontWeight: '700', color: COLORS.muted }}>Opening the path…</Text>
        </View>
      </Screen>
    );
  }

  if (error || !course) {
    return (
      <Screen>
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.dark }}>
            Course unavailable
          </Text>
          <Text accessibilityRole="alert" style={{ color: COLORS.red }}>{error ?? 'Course could not load.'}</Text>
          <TactileButton label="Try again" onPress={() => void load()} />
          <TactileButton label="Back" tone="cream" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  // Only the first lesson is open, then each lesson unlocks when the previous
  // one is completed. This mirrors the web path exactly.
  const flat = course.units.flatMap((unit) => unit.lessons);
  const completedCount = flat.filter(
    (lesson) => Boolean(progress?.completed[lessonKey(course.id, lesson.id)]),
  ).length;
  const firstIncomplete = flat.find(
    (lesson) => !progress?.completed[lessonKey(course.id, lesson.id)],
  );
  const currentId = firstIncomplete?.id ?? flat[flat.length - 1]?.id ?? null;

  function statusOf(lessonId: string): LessonState {
    if (progress?.completed[lessonKey(course!.id, lessonId)]) return 'completed';
    if (lessonId === currentId) return 'current';
    return 'locked';
  }

  return (
    <Screen>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 16, gap: 12, backgroundColor: COLORS.cream, flexGrow: 1 }}
      >
        <SpeekoAppBar
        subtitle={`${LOCALE_LABEL[course.locale]} · ${course.difficulty}`}
        streak={progress?.streak ?? 0}
        xp={progress?.xp ?? 0}
      />

      <Pressable accessibilityRole="button" onPress={() => router.back()} style={{ alignSelf: 'flex-start' }}>
        <Text style={{ fontWeight: '800', color: COLORS.muted }}>← Learn</Text>
      </Pressable>

      <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.dark }}>{course.title}</Text>
      <Text style={{ color: COLORS.muted }}>
        {LOCALE_LABEL[course.locale]} · {course.difficulty} · {completedCount} of {flat.length}{' '}
        lessons complete
      </Text>

      {course.reviewStatus === 'draft' ? (
        <View
          style={{
            padding: 12,
            borderRadius: 12,
            borderWidth: 1.5,
            borderColor: COLORS.line,
            backgroundColor: COLORS.creamDeep,
          }}
        >
          <Text style={{ fontSize: 12, color: COLORS.muted, fontWeight: '600' }}>
            This course is marked draft. It is playable, but the translations have not been reviewed
            by a native speaker yet. If something looks wrong, trust your teacher — not the app.
          </Text>
        </View>
      ) : null}

      {course.units
        .map((unit, unitIndex) => ({ unit, unitIndex }))
        .reverse()
        .map(({ unit, unitIndex }) => {
        const unitDone = unit.lessons.filter((lesson) =>
          Boolean(progress?.completed[lessonKey(course.id, lesson.id)]),
        ).length;
        return (
          <View
            key={unit.id}
            onLayout={(event) => {
              unitOffsets.current[unit.id] = event.nativeEvent.layout.y;
              tryScrollToCurrent();
            }}
            style={{ gap: 4, marginTop: 10 }}
          >
            {unitIndex > 0 ? (
              <Text
                style={{
                  textAlign: 'center',
                  fontSize: 10,
                  fontWeight: '900',
                  color: COLORS.muted,
                  letterSpacing: 1.6,
                  marginBottom: 2,
                }}
              >
                ↑ CLIMB TO THE NEXT UNIT
              </Text>
            ) : null}
            <TactileCard tone="green" style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <View
                  style={{
                    alignSelf: 'flex-start',
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.4)',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    marginBottom: 6,
                  }}
                >
                  <Text style={{ fontSize: 9, fontWeight: '900', color: COLORS.white }}>
                    UNIT {unitIndex + 1}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Open the unit ${unitIndex + 1} guidebook`}
                  onPress={() => router.push(`/guidebook/${course.id}/${unitIndex + 1}`)}
                  style={{
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: 'rgba(255,255,255,0.5)',
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '900', color: COLORS.white }}>
                    📖 Guidebook
                  </Text>
                </Pressable>
              </View>
              <Text style={{ fontSize: 21, fontWeight: '900', color: COLORS.white }}>
                {unit.title}
              </Text>
              {unit.description ? (
                <Text style={{ fontSize: 12, color: COLORS.greenSoft, marginTop: 2 }}>
                  {unit.description}
                </Text>
              ) : null}
              <Text style={{ fontSize: 11, fontWeight: '800', color: COLORS.white, marginTop: 8 }}>
                {unitDone}/{unit.lessons.length} lessons done
              </Text>
              <View style={{ marginTop: 6 }}>
                <ProgressTrack
                  value={unit.lessons.length === 0 ? 0 : unitDone / unit.lessons.length}
                  onGreen
                  height={12}
                />
              </View>
            </TactileCard>

            {[...unit.lessons]
              .reverse()
              .map((lesson) => {
              // Global index keeps the winding trail continuous across units.
              const globalIndex = flat.findIndex((entry) => entry.id === lesson.id);
              return (
                <PathNode
                  key={lesson.id}
                  lesson={lesson}
                  index={globalIndex < 0 ? 0 : globalIndex}
                  state={statusOf(lesson.id)}
                  onPress={() => router.push(`/lesson/${course.id}/${lesson.id}`)}
                  onCurrentLayout={
                    lesson.id === currentId
                      ? (nodeY) => {
                          scrollTarget.current = { unitId: unit.id, nodeY };
                          tryScrollToCurrent();
                        }
                      : undefined
                  }
                />
              );
            })}
          </View>
        );
      })}

      <TactilePressable
        onPress={() => router.push(`/practice/${course.id}`)}
        tone="white"
        style={{ marginTop: 10 }}
      >
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Text style={{ fontWeight: '900', color: COLORS.dark }}>Practice this course</Text>
          <Text style={{ fontSize: 11, color: COLORS.muted }}>
            Due reviews only · no XP
          </Text>
        </View>
      </TactilePressable>

      <AppNav active="learn" />
      </ScrollView>
    </Screen>
  );
}
