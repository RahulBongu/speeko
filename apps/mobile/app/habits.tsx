import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { CalendarDay, HabitReport, ProgressState } from '@speeko/core';
import {
  DAILY_GOAL_OPTIONS,
  browserTimeZone,
  buildHabitReport,
  dayKeyInTimeZone,
  historyFromActivity,
} from '@speeko/core';
import { ORIGIN, apiFetch, getCookie } from '../lib/api';
import { loadProgress, saveProgress } from '../lib/progress';
import { AppNav } from '../components/AppNav';
import { COLORS } from '../lib/theme';

type GoalStatus = 'idle' | 'saving' | 'saved' | 'error';

function guestReport(progress: ProgressState): HabitReport {
  return buildHabitReport(historyFromActivity(progress.activity), {
    asOfDay: dayKeyInTimeZone(new Date(), progress.timeZone),
    timeZone: progress.timeZone,
    dailyGoal: progress.dailyGoal,
    lifetimeXp: progress.xp,
    lifetimeLessons: Object.keys(progress.completed).length,
  });
}

function calendarLabel(day: CalendarDay): string {
  const date = new Date(`${day.day}T12:00:00Z`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  if (day.status === 'future') return `${date}: upcoming`;
  if (day.status === 'frozen') return `${date}: streak freeze used`;
  if (day.status === 'empty') return `${date}: no lessons`;
  return `${date}: ${day.xp} XP, ${day.lessons} lesson${day.lessons === 1 ? '' : 's'}`;
}

function calendarTone(day: CalendarDay): string {
  if (day.status === 'future') return COLORS.creamDeep;
  if (day.status === 'frozen') return COLORS.blueSoft;
  if (day.status === 'empty') return COLORS.white;
  if (day.intensity >= 4) return COLORS.green;
  if (day.intensity === 3) return '#4ADE80';
  if (day.intensity === 2) return '#86EFAC';
  return '#BBF7D0';
}

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <View style={{ height: 6, borderRadius: 3, backgroundColor: COLORS.creamDeep, overflow: 'hidden' }}>
      <View
        style={{
          height: 6,
          width: `${Math.max(0, Math.min(1, value)) * 100}%`,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

export default function Habits() {
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [report, setReport] = useState<HabitReport | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [goalStatus, setGoalStatus] = useState<GoalStatus>('idle');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const local = await loadProgress();
    setProgress(local);

    try {
      const response = await apiFetch('/api/habits');
      if (response.status === 401) {
        setSignedIn(false);
        setReport(guestReport(local));
        setLoading(false);
        return;
      }
      if (!response.ok) {
        throw new Error(`Habits could not load (status ${response.status}).`);
      }
      const body = (await response.json()) as { habits?: HabitReport };
      if (!body.habits) throw new Error('Habits response was empty.');
      setSignedIn(true);
      setReport(body.habits);
    } catch (cause) {
      // A stored cookie means this device was signed in; fail closed instead of
      // presenting device-only data as verified server history.
      const hadSession = Boolean(await getCookie());
      if (hadSession) {
        setError(
          cause instanceof Error ? cause.message : 'Habits could not load. Check your connection.',
        );
      } else {
        setSignedIn(false);
        setReport(guestReport(local));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const chooseGoal = useCallback(
    async (goal: number) => {
      if (goalStatus === 'saving' || !progress) return;
      const next = {
        ...progress,
        dailyGoal: goal,
        timeZone: progress.timeZone ?? browserTimeZone(),
      };
      await saveProgress(next);
      setProgress(next);
      setReport((current) => (current ? { ...current, dailyGoal: goal } : current));
      setGoalStatus('saving');

      if (!signedIn) {
        setGoalStatus('saved');
        return;
      }

      try {
        const response = await apiFetch('/api/progress', {
          method: 'PUT',
          headers: { origin: ORIGIN },
          body: JSON.stringify({ progress: next }),
        });
        if (!response.ok) {
          setGoalStatus('error');
          return;
        }
        const data = (await response.json()) as { progress?: ProgressState };
        if (data.progress) {
          await saveProgress(data.progress);
          setProgress(data.progress);
        }
        setGoalStatus('saved');
        // The verified report's targets depend on the goal; reload it.
        const habits = await apiFetch('/api/habits');
        if (habits.ok) {
          const body = (await habits.json()) as { habits?: HabitReport };
          if (body.habits) setReport(body.habits);
        }
      } catch {
        setGoalStatus('error');
      }
    },
    [goalStatus, progress, signedIn],
  );

  if (loading) {
    return (
      <View style={{ flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <ActivityIndicator color={COLORS.green} />
        <Text style={{ fontWeight: '700', color: COLORS.muted }}>Reading your habit history…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.dark }}>
          Habits could not load
        </Text>
        <Text style={{ color: COLORS.red }}>{error}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void load()}
          style={{ backgroundColor: COLORS.green, borderRadius: 12, padding: 14, alignItems: 'center' }}
        >
          <Text style={{ color: COLORS.white, fontWeight: '800' }}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (!report || !progress) {
    return (
      <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <Text style={{ color: COLORS.muted }}>No habit history yet.</Text>
      </View>
    );
  }

  const unlocked = report.achievements.filter((achievement) => achievement.complete).length;
  const empty = report.totals.lessons === 0;
  const weeks = Array.from({ length: Math.ceil(report.calendar.length / 7) }, (_, week) =>
    report.calendar.slice(week * 7, week * 7 + 7),
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14, backgroundColor: COLORS.cream }}>
      <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.dark }}>Habits</Text>
      <View
        style={{
          alignSelf: 'flex-start',
          backgroundColor: signedIn ? COLORS.greenSoft : COLORS.creamDeep,
          borderRadius: 20,
          paddingHorizontal: 10,
          paddingVertical: 5,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '800', color: signedIn ? COLORS.greenDark : COLORS.muted }}>
          {signedIn ? 'Verified server history' : 'This device only'}
        </Text>
      </View>

      {empty ? (
        <View style={{ padding: 16, borderRadius: 14, backgroundColor: COLORS.white, gap: 6 }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.dark }}>
            Your calendar starts with one lesson
          </Text>
          <Text style={{ color: COLORS.muted }}>
            There is no history to show yet. Complete a lesson and its real XP lands here, on
            today&apos;s square.
          </Text>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <View style={{ flex: 1, minWidth: 140, padding: 14, borderRadius: 14, backgroundColor: COLORS.green, gap: 2 }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#DCFCE7' }}>TODAY&apos;S XP</Text>
            <Text style={{ fontSize: 26, fontWeight: '900', color: COLORS.white }}>
              {report.today.xp}
              <Text style={{ fontSize: 14, color: '#DCFCE7' }}> / {report.dailyGoal}</Text>
            </Text>
            <Bar value={report.dailyGoal === 0 ? 0 : report.today.xp / report.dailyGoal} color={COLORS.white} />
          </View>
          <View style={{ flex: 1, minWidth: 140, padding: 14, borderRadius: 14, backgroundColor: COLORS.white, gap: 2 }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: COLORS.muted }}>STREAK</Text>
            <Text style={{ fontSize: 26, fontWeight: '900', color: COLORS.dark }}>
              {report.streak.current}
              <Text style={{ fontSize: 14, color: COLORS.muted }}> days</Text>
            </Text>
            <Text style={{ fontSize: 12, color: COLORS.muted }}>
              Longest {report.streak.longest} · Freezes {report.streak.freezesAvailable}/
              {report.streak.maxFreezes}
            </Text>
          </View>
        </View>
      )}

      <View style={{ padding: 14, borderRadius: 14, backgroundColor: COLORS.white, gap: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.dark }}>Daily goal</Text>
        <Text style={{ color: COLORS.muted, fontSize: 12 }}>
          Passing the goal marks the day complete. Extra XP still counts.
        </Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {DAILY_GOAL_OPTIONS.map((goal) => {
            const active = goal === report.dailyGoal;
            return (
              <Pressable
                key={goal}
                accessibilityRole="button"
                accessibilityState={{ selected: active, disabled: goalStatus === 'saving' }}
                disabled={goalStatus === 'saving'}
                onPress={() => void chooseGoal(goal)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  borderWidth: 2,
                  alignItems: 'center',
                  borderColor: active ? COLORS.green : COLORS.line,
                  backgroundColor: active ? COLORS.greenSoft : COLORS.white,
                }}
              >
                <Text style={{ fontWeight: '900', color: active ? COLORS.greenDark : COLORS.dark }}>
                  {goal}
                </Text>
                <Text style={{ fontSize: 9, fontWeight: '800', color: COLORS.muted }}>XP</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={{ fontSize: 12, fontWeight: '800', color: goalStatus === 'error' ? COLORS.red : COLORS.muted }}>
          {goalStatus === 'saving'
            ? 'Saving…'
            : goalStatus === 'saved'
              ? signedIn
                ? 'Goal saved and synced.'
                : 'Goal saved on this device.'
              : goalStatus === 'error'
                ? 'Saved here, but the server did not confirm it. Tap a goal to retry.'
                : ''}
        </Text>
      </View>

      <View style={{ padding: 14, borderRadius: 14, backgroundColor: COLORS.white, gap: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.dark }}>Your last 12 weeks</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 3 }}>
            {weeks.map((week, weekIndex) => (
              <View key={weekIndex} style={{ gap: 3 }}>
                {week.map((day) => (
                  <View
                    key={day.day}
                    accessible
                    accessibilityLabel={calendarLabel(day)}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      backgroundColor: calendarTone(day),
                      borderWidth: day.status === 'future' ? 1 : 0,
                      borderColor: COLORS.line,
                      outlineWidth: day.day === report.asOfDay ? 2 : 0,
                    }}
                  />
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.muted }}>■ Goal met</Text>
          <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.blue }}>■ Freeze used</Text>
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.dark }}>Keep today moving</Text>
        {report.quests.map((quest) => (
          <View key={quest.id} style={{ padding: 12, borderRadius: 12, backgroundColor: COLORS.white, gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Text style={{ fontWeight: '800', color: COLORS.dark, flex: 1 }}>{quest.title}</Text>
              <Text style={{ fontWeight: '800', color: COLORS.muted }}>
                {quest.progress} / {quest.target}
              </Text>
            </View>
            <Bar
              value={quest.target === 0 ? 0 : quest.progress / quest.target}
              color={quest.complete ? COLORS.green : '#86EFAC'}
            />
            <Text style={{ fontSize: 10, fontWeight: '800', color: COLORS.muted }}>
              {quest.period === 'day' ? 'DAILY' : 'WEEKLY'} · PROGRESS ONLY
            </Text>
          </View>
        ))}
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.dark }}>
          Achievements · {unlocked} of {report.achievements.length}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {report.achievements.map((achievement) => (
            <View
              key={achievement.id}
              style={{
                width: '48%',
                padding: 10,
                borderRadius: 12,
                backgroundColor: achievement.complete ? COLORS.greenSoft : COLORS.white,
                borderWidth: 2,
                borderColor: achievement.complete ? '#BBF7D0' : COLORS.line,
                gap: 6,
              }}
            >
              <Text style={{ fontWeight: '800', fontSize: 12, color: COLORS.dark }}>
                {achievement.complete ? '★ ' : '🔒 '}
                {achievement.title}
              </Text>
              <Bar
                value={achievement.target === 0 ? 1 : achievement.progress / achievement.target}
                color={achievement.complete ? COLORS.green : COLORS.disabled}
              />
              <Text style={{ fontSize: 10, fontWeight: '800', color: COLORS.muted }}>
                {achievement.progress}/{achievement.target}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={{ fontSize: 11, color: COLORS.muted }}>
        {signedIn
          ? 'Quests, streaks, and the calendar are derived from verified lesson events.'
          : 'This report uses only activity saved on this device. Sign in for verified history.'}
      </Text>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={{ padding: 8 }}>
        <Text style={{ color: COLORS.dark, fontWeight: '800' }}>Back</Text>
      </Pressable>
      <AppNav active="habits" />
    </ScrollView>
  );
}
