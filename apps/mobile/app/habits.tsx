import { useCallback, useState } from 'react';
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
import { useOnFocus } from '../lib/useOnFocus';
import { AppNav } from '../components/AppNav';
import { Screen } from '../components/Screen';
import { Fox } from '../components/Fox';
import { Icon } from '../components/Icons';
import {
  SpeekoAppBar,
  TactileButton,
  TactileCard,
} from '../components/Tactile';
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
  if (day.status === 'future') return COLORS.sand;
  if (day.status === 'frozen') return COLORS.blueSoft;
  if (day.status === 'empty') return COLORS.white;
  if (day.intensity >= 4) return COLORS.green;
  if (day.intensity === 3) return '#4ADE80';
  if (day.intensity === 2) return '#86EFAC';
  return '#BBF7D0';
}

function Bar({ value, color }: { value: number; color: string }) {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={{ height: 8, borderRadius: 4, backgroundColor: COLORS.sand, overflow: 'hidden' }}
    >
      <View style={{ height: 8, width: `${clamped * 100}%`, backgroundColor: color, borderRadius: 4 }} />
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
      if (!response.ok) throw new Error(`Habits could not load (status ${response.status}).`);
      const body = (await response.json()) as { habits?: HabitReport };
      if (!body.habits) throw new Error('Habits response was empty.');
      setSignedIn(true);
      setReport(body.habits);
    } catch (cause) {
      const hadSession = Boolean(await getCookie());
      if (hadSession) {
        setError(cause instanceof Error ? cause.message : 'Habits could not load. Check your connection.');
      } else {
        setSignedIn(false);
        setReport(guestReport(local));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useOnFocus(load);

  const chooseGoal = useCallback(async (goal: number) => {
    if (goalStatus === 'saving' || !progress) return;
    const next = { ...progress, dailyGoal: goal, timeZone: progress.timeZone ?? browserTimeZone() };
    await saveProgress(next);
    setProgress(next);
    setReport((current) => (current ? { ...current, dailyGoal: goal } : current));
    setGoalStatus('saving');
    if (!signedIn) { setGoalStatus('saved'); return; }
    try {
      const response = await apiFetch('/api/progress', {
        method: 'PUT',
        headers: { origin: ORIGIN },
        body: JSON.stringify({ progress: next }),
      });
      if (!response.ok) { setGoalStatus('error'); return; }
      const data = (await response.json()) as { progress?: ProgressState };
      if (data.progress) { await saveProgress(data.progress); setProgress(data.progress); }
      setGoalStatus('saved');
      const habits = await apiFetch('/api/habits');
      if (habits.ok) {
        const body = (await habits.json()) as { habits?: HabitReport };
        if (body.habits) setReport(body.habits);
      }
    } catch { setGoalStatus('error'); }
  }, [goalStatus, progress, signedIn]);

  if (loading) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator color={COLORS.green} />
          <Text style={{ color: COLORS.muted, fontWeight: '700' }}>Reading your habit history…</Text>
        </View>
        <AppNav active="habits" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 12 }}>
          <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.dark }}>Habits could not load</Text>
          <Text accessibilityRole="alert" style={{ color: COLORS.red }}>{error}</Text>
          <TactileButton label="Try again" onPress={() => void load()} />
          <TactileButton label="Back" tone="cream" onPress={() => router.back()} />
        </View>
        <AppNav active="habits" />
      </Screen>
    );
  }

  if (!report || !progress) {
    return (
      <Screen>
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 12 }}>
          <Text style={{ color: COLORS.muted }}>No habit history yet.</Text>
          <TactileButton label="Back" tone="cream" onPress={() => router.back()} />
        </View>
        <AppNav active="habits" />
      </Screen>
    );
  }

  const unlocked = report.achievements.filter((a) => a.complete).length;
  const empty = report.totals.lessons === 0;
  const weeks = Array.from({ length: Math.ceil(report.calendar.length / 7) }, (_, week) =>
    report.calendar.slice(week * 7, week * 7 + 7),
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, backgroundColor: COLORS.cream, flexGrow: 1 }}>
        <SpeekoAppBar
          subtitle={signedIn ? 'Verified server history' : 'This device only'}
          streak={progress.streak}
          xp={progress.xp}
        />
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.dark }}>Habits</Text>
          <Text style={{ color: COLORS.muted, fontSize: 13, lineHeight: 18 }}>
            Your goal, quests, streak and calendar — calculated only from lessons you actually finished.
            Nothing is padded.
          </Text>
        </View>

        {empty ? (
          <TactileCard tone="white">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ fontSize: 19, fontWeight: '900', color: COLORS.dark }}>
                  Your calendar starts with one lesson
                </Text>
                <Text style={{ color: COLORS.muted, fontSize: 13, lineHeight: 18 }}>
                  There is no history to show yet. Complete a lesson and its real XP lands here, on
                  today&apos;s square.
                </Text>
              </View>
              <Fox
                mood="happy"
                accessory={progress.equippedCosmetic ?? null}
                patrol
                style={{ width: 72, height: 72 }}
                title="Speeko waiting for your first lesson"
              />
            </View>
            <TactileButton label="Find a course" tone="green" onPress={() => router.push('/learn')} style={{ marginTop: 12, alignSelf: 'stretch' }} />
          </TactileCard>
        ) : (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TactileCard tone="green" style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, fontWeight: '900', color: COLORS.greenSoft, letterSpacing: 0.6 }}>TODAY&apos;S XP</Text>
              <Text style={{ fontSize: 26, fontWeight: '900', color: COLORS.white }}>
                {report.today.xp}
                <Text style={{ fontSize: 14, color: COLORS.greenSoft }}> / {report.dailyGoal}</Text>
              </Text>
              <View style={{ marginTop: 8 }}>
                <Bar value={report.dailyGoal === 0 ? 0 : report.today.xp / report.dailyGoal} color={COLORS.white} />
              </View>
            </TactileCard>
            <TactileCard tone="white" style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Icon name="flame" size={14} color={COLORS.fox} />
                <Text style={{ fontSize: 10, fontWeight: '900', color: COLORS.muted, letterSpacing: 0.6 }}>STREAK</Text>
              </View>
              <Text style={{ fontSize: 26, fontWeight: '900', color: COLORS.dark }}>
                {report.streak.current}
                <Text style={{ fontSize: 14, color: COLORS.muted }}> days</Text>
              </Text>
              <Text style={{ fontSize: 11, color: COLORS.muted }}>
                Longest {report.streak.longest} · Freezes {report.streak.freezesAvailable}/{report.streak.maxFreezes}
              </Text>
            </TactileCard>
          </View>
        )}

        <TactileCard tone="white">
          <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.dark }}>Daily goal</Text>
          <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 2, marginBottom: 10 }}>
            Passing the goal marks the day complete. Extra XP still counts.
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
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
                    paddingVertical: 12,
                    borderRadius: 14,
                    borderWidth: 2,
                    alignItems: 'center',
                    borderColor: active ? COLORS.green : COLORS.line,
                    backgroundColor: active ? COLORS.greenSoft : COLORS.white,
                  }}
                >
                  <Text style={{ fontWeight: '900', color: active ? COLORS.greenDark : COLORS.dark }}>{goal}</Text>
                  <Text style={{ fontSize: 9, fontWeight: '800', color: COLORS.muted }}>XP</Text>
                </Pressable>
              );
            })}
          </View>
          {goalStatus !== 'idle' ? (
            <Text style={{ fontSize: 11, fontWeight: '800', marginTop: 8, color: goalStatus === 'error' ? COLORS.red : COLORS.greenDark }}>
              {goalStatus === 'saving' ? 'Saving…' : goalStatus === 'saved' ? (signedIn ? 'Goal saved and synced.' : 'Goal saved on this device.') : 'Saved here, but the server did not confirm it. Tap a goal to retry.'}
            </Text>
          ) : null}
        </TactileCard>

        <TactileCard tone="white">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="habits" size={16} color={COLORS.green} />
            <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.dark }}>Your last 12 weeks</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
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
                        borderRadius: 5,
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
          <View style={{ flexDirection: 'row', gap: 14, marginTop: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.muted }}>■ Goal met</Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.blue }}>■ Freeze used</Text>
          </View>
        </TactileCard>

        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.dark }}>Keep today moving</Text>
          {report.quests.map((quest) => (
            <TactileCard key={quest.id} tone="white">
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                <Text style={{ fontWeight: '800', color: COLORS.dark, flex: 1 }}>{quest.title}</Text>
                <Text style={{ fontWeight: '800', color: COLORS.muted }}>{quest.progress} / {quest.target}</Text>
              </View>
              <View style={{ marginTop: 8 }}>
                <Bar value={quest.target === 0 ? 0 : quest.progress / quest.target} color={quest.complete ? COLORS.green : '#86EFAC'} />
              </View>
              <Text style={{ fontSize: 10, fontWeight: '800', color: COLORS.muted, marginTop: 6 }}>
                {quest.period === 'day' ? 'DAILY' : 'WEEKLY'} · PROGRESS ONLY
              </Text>
            </TactileCard>
          ))}
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.dark }}>Achievements · {unlocked} of {report.achievements.length}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {report.achievements.map((achievement) => (
              <TactileCard
                key={achievement.id}
                tone={achievement.complete ? 'green' : 'white'}
                style={{ width: '48%' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Icon name={achievement.complete ? 'trophy' : 'lock'} size={14} color={achievement.complete ? COLORS.white : COLORS.muted} />
                  <Text style={{ fontWeight: '800', fontSize: 12, color: achievement.complete ? COLORS.white : COLORS.dark, flex: 1 }}>
                    {achievement.title}
                  </Text>
                </View>
                <View style={{ marginTop: 8 }}>
                  <Bar value={achievement.target === 0 ? 1 : achievement.progress / achievement.target} color={achievement.complete ? COLORS.white : COLORS.disabled} />
                </View>
                <Text style={{ fontSize: 10, fontWeight: '800', color: achievement.complete ? COLORS.greenSoft : COLORS.muted, marginTop: 6 }}>
                  {achievement.progress}/{achievement.target}
                </Text>
              </TactileCard>
            ))}
          </View>
        </View>

        <Text style={{ fontSize: 11, color: COLORS.muted }}>
          {signedIn
            ? 'Quests, streaks, and the calendar are derived from verified lesson events.'
            : 'This report uses only activity saved on this device. Sign in for verified history.'}
        </Text>
      </ScrollView>
      <AppNav active="habits" />
    </Screen>
  );
}
