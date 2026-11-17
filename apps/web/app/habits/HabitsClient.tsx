'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  DAILY_GOAL_OPTIONS,
  type AchievementProgress,
  type CalendarDay,
  type HabitReport,
  type QuestProgress,
} from '@speeko/core';
import { SiteHeader } from '@/components/AppHeader';
import { Fox } from '@/components/Fox';
import { ProgressBar } from '@/components/ProgressBar';
import {
  BoltIcon,
  CalendarIcon,
  CheckIcon,
  FlameIcon,
  LockIcon,
  SnowflakeIcon,
  StarIcon,
  TrophyIcon,
} from '@/components/icons';
import { authClient } from '@/lib/auth-client';
import { fetchHabits, guestHabitReport } from '@/lib/habits';
import { browserTimeZone, loadProgress, saveProgress } from '@/lib/progress';
import { pushCloudProgress } from '@/lib/sync';
import { useProgress } from '@/lib/use-progress';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

function formatDay(day: string, options: Intl.DateTimeFormatOptions = {}): string {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString('en-IN', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

function calendarTone(day: CalendarDay): string {
  if (day.status === 'future') return 'border border-dashed border-cream-300 bg-white/70';
  if (day.status === 'frozen') return 'bg-ice-200 ring-1 ring-inset ring-ice-400';
  if (day.status === 'active') {
    const tones = [
      'bg-speeko-100',
      'bg-speeko-200',
      'bg-speeko-300',
      'bg-speeko-400',
      'bg-speeko-600',
    ] as const;
    return tones[day.intensity] ?? tones[1];
  }
  return 'bg-cream-100';
}

function calendarLabel(day: CalendarDay): string {
  const date = formatDay(day.day, { weekday: 'short', month: 'short', day: 'numeric' });
  if (day.status === 'future') return `${date}: upcoming`;
  if (day.status === 'frozen') return `${date}: streak freeze used`;
  if (day.status === 'empty') return `${date}: no lessons`;
  return `${date}: ${day.xp} XP, ${day.lessons} lesson${day.lessons === 1 ? '' : 's'}`;
}

function GoalPicker({
  selected,
  status,
  signedIn,
  onChoose,
}: {
  selected: number;
  status: 'idle' | 'saving' | 'saved' | 'error';
  signedIn: boolean;
  onChoose: (goal: number) => void;
}) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-bark-500">
            Daily goal
          </p>
          <h2 className="mt-1 font-display text-2xl font-extrabold text-bark-800">
            {selected} XP a day
          </h2>
        </div>
        <span className="rounded-xl bg-speeko-50 px-3 py-1.5 font-display text-[11px] font-extrabold uppercase tracking-wide text-speeko-700">
          Motivation, not a cap
        </span>
      </div>

      <div
        role="group"
        aria-label="Choose a daily XP goal"
        className="mt-4 grid grid-cols-5 gap-1.5 sm:gap-2"
      >
        {DAILY_GOAL_OPTIONS.map((goal) => {
          const active = goal === selected;
          return (
            <button
              key={goal}
              type="button"
              aria-pressed={active}
              onClick={() => onChoose(goal)}
              className={`focus-ring rounded-2xl border-2 px-1 py-2.5 text-center transition ${
                active
                  ? 'border-speeko-500 bg-speeko-50 text-speeko-700 shadow-speeko-200'
                  : 'border-cream-200 bg-white text-bark-500 hover:-translate-y-0.5 hover:border-speeko-300 hover:text-bark-700'
              }`}
            >
              <span className="block font-display text-xl font-extrabold leading-none">{goal}</span>
              <span className="mt-1 block text-[9px] font-extrabold uppercase tracking-[0.1em] opacity-70">
                XP
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-sm font-semibold text-bark-500">
        Passing the goal marks the day complete on your calendar. Extra XP still counts.
      </p>
      <p
        role="status"
        className={`mt-2 min-h-5 text-xs font-extrabold uppercase tracking-[0.1em] ${
          status === 'error' ? 'text-fox-700' : 'text-speeko-700'
        }`}
      >
        {status === 'saving'
          ? 'Saving…'
          : status === 'saved'
            ? signedIn
              ? 'Saved to your account.'
              : 'Saved on this device.'
            : status === 'error'
              ? 'Saved here, but the server did not confirm it. Tap the goal to retry.'
              : ''}
      </p>
    </section>
  );
}

function FreezeCard({ report }: { report: HabitReport }) {
  const { freezesAvailable, maxFreezes } = report.streak;
  return (
    <section className="card flex flex-col p-5 sm:p-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-bark-500">
            Streak freezes
          </p>
          <h2 className="mt-1 font-display text-2xl font-extrabold text-bark-800">
            {freezesAvailable} of {maxFreezes}
          </h2>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ice-100 text-ice-600">
          <SnowflakeIcon className="h-6 w-6" />
        </span>
      </div>

      <div className="mt-3 flex gap-2" aria-hidden="true">
        {Array.from({ length: maxFreezes }, (_, index) => (
          <span
            key={index}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border-2 ${
              index < freezesAvailable
                ? 'border-ice-300 bg-ice-200 text-ice-700'
                : 'border-cream-200 bg-cream-50 text-bark-300'
            }`}
          >
            <SnowflakeIcon className="h-5 w-5" />
          </span>
        ))}
      </div>

      <p className="mt-3 flex-1 text-sm font-semibold leading-relaxed text-bark-500">
        Earn one at every 7-day streak. If you miss exactly one day, a freeze is spent
        automatically and the streak survives. Miss two or more and it starts over.
      </p>
      <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.1em] text-bark-500">
        {freezesAvailable === 0
          ? report.streak.current >= 7
            ? 'Next freeze at the next 7-day milestone'
            : 'First freeze at a 7-day streak'
          : 'Held freezes are spent automatically'}
      </p>
    </section>
  );
}

function QuestRow({ quest }: { quest: QuestProgress }) {
  return (
    <div className="rounded-2xl border-2 border-cream-200 bg-cream-50/60 p-3.5">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            quest.complete ? 'bg-speeko-500 text-white' : 'bg-white text-speeko-700'
          }`}
        >
          {quest.complete ? <CheckIcon className="h-5 w-5" /> : <BoltIcon className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-display text-sm font-extrabold text-bark-800">{quest.title}</p>
            <p className="shrink-0 font-display text-xs font-extrabold text-bark-500">
              {quest.progress} / {quest.target}
            </p>
          </div>
          <ProgressBar
            value={quest.target === 0 ? 0 : quest.progress / quest.target}
            className="mt-1.5 h-2"
            barClassName={quest.complete ? 'bg-speeko-500' : 'bg-speeko-300'}
            label={quest.title}
          />
        </div>
      </div>
      <p className="mt-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-bark-500">
        {quest.period === 'day' ? 'Daily' : 'Weekly'} · progress only
      </p>
    </div>
  );
}

function AchievementTile({ achievement }: { achievement: AchievementProgress }) {
  return (
    <div
      className={`rounded-2xl border-2 p-3 ${
        achievement.complete
          ? 'border-speeko-200 bg-speeko-50'
          : 'border-cream-200 bg-white opacity-80'
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
            achievement.complete ? 'bg-speeko-500 text-white' : 'bg-cream-100 text-bark-300'
          }`}
        >
          {achievement.complete ? (
            <TrophyIcon className="h-4 w-4" />
          ) : (
            <LockIcon className="h-3.5 w-3.5" />
          )}
        </span>
        <p className="min-w-0 font-display text-xs font-extrabold leading-tight text-bark-700">
          {achievement.title}
        </p>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <ProgressBar
          value={achievement.target === 0 ? 1 : achievement.progress / achievement.target}
          className="h-1.5 flex-1"
          barClassName={achievement.complete ? 'bg-speeko-500' : 'bg-speeko-200'}
          label={achievement.title}
        />
        <span className="font-display text-[10px] font-extrabold text-bark-400">
          {achievement.progress}/{achievement.target}
        </span>
      </div>
    </div>
  );
}

export default function HabitsClient() {
  const { data: session, isPending: authPending } = authClient.useSession();
  const userId = session?.user.id ?? null;
  const progress = useProgress();
  const [serverReport, setServerReport] = useState<HabitReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [goalStatus, setGoalStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (!userId) {
      setServerReport(null);
      setLoading(false);
      setError(null);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    fetchHabits()
      .then((report) => {
        if (!active) return;
        if (!report) {
          setServerReport(null);
          setError('Your session expired. Sign in again to load verified habits.');
          return;
        }
        setServerReport(report);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : 'Habits could not load.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId, reloadKey]);

  const chooseGoal = useCallback(
    async (goal: number) => {
      if (goalStatus === 'saving') return;
      const current = loadProgress();
      const next = {
        ...current,
        dailyGoal: goal,
        timeZone: current.timeZone ?? browserTimeZone(),
      };
      saveProgress(next);
      setGoalStatus('saving');
      if (!userId) {
        setGoalStatus('saved');
        return;
      }
      try {
        await pushCloudProgress(next);
        setGoalStatus('saved');
        setReloadKey((key) => key + 1);
      } catch {
        setGoalStatus('error');
      }
    },
    [goalStatus, userId],
  );

  const report = userId ? serverReport : progress ? guestHabitReport(progress) : null;
  const header = <SiteHeader active="habits" />;

  if (authPending || !progress || (userId && loading && !report)) {
    return (
      <div className="min-h-screen">
        {header}
        <main className="mx-auto flex max-w-2xl flex-col items-center px-5 py-20 text-center">
          <Fox className="h-28 w-28 animate-bob" />
          <p className="mt-3 font-display text-sm font-extrabold uppercase tracking-[0.16em] text-bark-500">
            Reading your habit history…
          </p>
        </main>
      </div>
    );
  }

  if (userId && error) {
    return (
      <div className="min-h-screen">
        {header}
        <main className="mx-auto flex max-w-2xl flex-col items-center px-5 py-20 text-center">
          <Fox mood="sad" className="h-28 w-28" />
          <h1 className="mt-3 font-display text-3xl font-extrabold text-bark-800">
            Habits could not load
          </h1>
          <p className="mt-2 max-w-md text-sm font-semibold text-bark-500">{error}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={() => setReloadKey((key) => key + 1)}
            >
              Try again
            </button>
            <Link href="/learn" className="btn-secondary">
              Keep learning
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen">
        {header}
        <main className="mx-auto flex max-w-2xl flex-col items-center px-5 py-20 text-center">
          <Fox className="h-28 w-28 animate-bob" />
          <p className="mt-3 font-display text-sm font-extrabold uppercase tracking-[0.16em] text-bark-500">
            Reading your habit history…
          </p>
        </main>
      </div>
    );
  }

  const selectedGoal = progress.dailyGoal;
  const unlocked = report.achievements.filter((achievement) => achievement.complete).length;
  const empty = report.totals.lessons === 0;
  const firstDay = report.calendar[0]?.day;
  const lastDay = report.calendar.at(-1)?.day;
  const sourceLabel = userId ? 'Verified server history' : 'This device only';

  return (
    <div className="min-h-screen">
      {header}
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">
              Habits
            </p>
            <h1 className="mt-1 font-display text-4xl font-extrabold tracking-tight text-bark-800 sm:text-5xl">
              One day at a time.
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-bark-500">
              Your goal, quests, streak, and calendar — calculated only from lessons you actually
              finished. Nothing is padded.
            </p>
          </div>
          <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 font-display text-[11px] font-extrabold uppercase tracking-[0.1em] ${
              userId
                ? 'border-speeko-200 bg-speeko-50 text-speeko-700'
                : 'border-cream-200 bg-white text-bark-500'
            }`}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {sourceLabel}
          </span>
        </div>

        {!userId ? (
          <p className="mt-3 rounded-2xl border-2 border-cream-200 bg-white px-4 py-3 text-sm font-semibold text-bark-500">
            This page reads activity saved in this browser. Sign in to have every completed lesson
            verified by the server and synced across devices.{' '}
            <Link href="/sign-up" className="font-extrabold text-speeko-700 underline">
              Create an account
            </Link>
          </p>
        ) : null}

        {empty ? (
          <section className="mt-5 flex flex-col items-center gap-4 rounded-3xl border-2 border-cream-200 bg-white p-6 text-center shadow-card-sm sm:flex-row sm:text-left">
            <Fox mood="idle" className="h-20 w-20 shrink-0" />
            <div className="flex-1">
              <h2 className="font-display text-xl font-extrabold text-bark-800">
                Your calendar starts with one lesson
              </h2>
              <p className="mt-1 text-sm font-semibold text-bark-500">
                There is no history to show yet. Complete a lesson and its real XP lands here,
                on today&apos;s square.
              </p>
            </div>
            <Link href="/learn" className="btn-primary shrink-0">
              Find a course
            </Link>
          </section>
        ) : null}

        <div className="mt-5 grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl border-2 border-fox-200 bg-fox-100 px-3 py-3 text-center text-fox-700">
            <span className="mx-auto flex h-6 w-6 items-center justify-center">
              <FlameIcon className="h-5 w-5" />
            </span>
            <p className="mt-1 font-display text-2xl font-extrabold leading-none">
              {report.streak.current}
            </p>
            <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.12em] opacity-70">
              Day streak
            </p>
          </div>
          <div className="rounded-2xl border-2 border-speeko-200 bg-speeko-50 px-3 py-3 text-center text-speeko-700">
            <span className="mx-auto flex h-6 w-6 items-center justify-center">
              <BoltIcon className="h-5 w-5" />
            </span>
            <p className="mt-1 font-display text-2xl font-extrabold leading-none">
              {report.today.xp}
              <span className="text-sm opacity-70"> / {report.dailyGoal}</span>
            </p>
            <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.12em] opacity-70">
              Today&apos;s XP
            </p>
          </div>
          <div className="rounded-2xl border-2 border-ice-300 bg-ice-100 px-3 py-3 text-center text-ice-700">
            <span className="mx-auto flex h-6 w-6 items-center justify-center">
              <SnowflakeIcon className="h-5 w-5" />
            </span>
            <p className="mt-1 font-display text-2xl font-extrabold leading-none">
              {report.streak.freezesAvailable}
              <span className="text-sm opacity-70"> / {report.streak.maxFreezes}</span>
            </p>
            <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.12em] opacity-70">
              Freezes held
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_0.9fr]">
          <GoalPicker
            selected={selectedGoal}
            status={goalStatus}
            signedIn={Boolean(userId)}
            onChoose={chooseGoal}
          />
          <FreezeCard report={report} />
        </div>

        <section className="card mt-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-bark-500">
                Streak calendar
              </p>
              <h2 className="mt-1 font-display text-2xl font-extrabold text-bark-800">
                Your last 12 weeks
              </h2>
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-bark-500">
              {firstDay && lastDay ? `${formatDay(firstDay)} – ${formatDay(lastDay)}` : ''}
              {report.timeZone ? ` · ${report.timeZone.replace('_', ' ')}` : ''}
            </p>
          </div>

          <div className="mt-4 flex gap-2">
            <div className="grid grid-rows-7 gap-1" aria-hidden="true">
              {DAY_LABELS.map((label, index) => (
                <span
                  key={`${label}-${index}`}
                  className="flex h-5 w-3 items-center text-[8px] font-extrabold uppercase text-bark-300 sm:h-6"
                >
                  {label}
                </span>
              ))}
            </div>
            <div
              className="grid grid-flow-col grid-rows-7 gap-1"
              role="grid"
              aria-label="Daily activity calendar for the last twelve weeks"
            >
              {Array.from({ length: Math.ceil(report.calendar.length / 7) }, (_, weekIndex) => (
                <div key={weekIndex} role="row" className="contents">
                  {report.calendar.slice(weekIndex * 7, weekIndex * 7 + 7).map((day) => (
                <div
                  key={day.day}
                  role="gridcell"
                  aria-label={calendarLabel(day)}
                  title={calendarLabel(day)}
                  className={`h-5 w-5 rounded-[5px] sm:h-6 sm:w-6 ${calendarTone(day)} ${
                    day.day === report.asOfDay ? 'outline outline-2 outline-offset-1 outline-fox-400' : ''
                  }`}
                />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-bark-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-[3px] bg-cream-100" /> No lessons
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-[3px] bg-speeko-200" /> Some XP
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-[3px] bg-speeko-600" /> Goal met
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-[3px] bg-ice-200 ring-1 ring-inset ring-ice-400" />{' '}
              Freeze used
            </span>
          </div>

          <p className="mt-3 text-sm font-semibold text-bark-500">
            {report.streak.current === 0
              ? empty
                ? 'No streak yet. Your first completed lesson starts it.'
                : 'The current run has ended. Finish a lesson today to start the next one.'
              : `${report.streak.current} day${report.streak.current === 1 ? '' : 's'} in a row · longest ${report.streak.longest} day${report.streak.longest === 1 ? '' : 's'}.`}
          </p>
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-bark-500">
                  Quests
                </p>
                <h2 className="mt-1 font-display text-2xl font-extrabold text-bark-800">
                  Keep today moving
                </h2>
              </div>
              <span className="font-display text-[11px] font-extrabold uppercase tracking-[0.1em] text-bark-500">
                Progress only
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {report.quests.map((quest) => (
                <QuestRow key={quest.id} quest={quest} />
              ))}
            </div>
            <p className="mt-3 text-xs font-semibold text-bark-400">
              Quests light up from real XP and lesson counts. Completed daily quests award
              gems.
            </p>
          </section>

          <section className="card p-5 sm:p-6">
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-bark-500">
                  Achievements
                </p>
                <h2 className="mt-1 font-display text-2xl font-extrabold text-bark-800">
                  {unlocked} of {report.achievements.length}
                </h2>
              </div>
              <StarIcon className="h-5 w-5 text-fox-500" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {report.achievements.map((achievement) => (
                <AchievementTile key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Link href="/learn" className="btn-primary">
            Continue learning
          </Link>
          <Link href="/practice" className="btn-secondary">
            Practice instead
          </Link>
        </div>
      </main>
    </div>
  );
}
