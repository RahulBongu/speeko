'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { DAILY_GOAL } from '@/lib/progress';
import { useProgress } from '@/lib/use-progress';
import { fetchGems } from '@/lib/shop';
import { Fox } from './Fox';
import { ProgressBar } from './ProgressBar';
import { StatPill } from './AppHeader';
import { BoltIcon, FlameIcon, TrophyIcon, CheckIcon, StarIcon, GemIcon } from './icons';

/**
 * Solo XP milestones. These are not a league: there are no peers and nothing
 * is ranked. Real leagues only ship once enough real players exist.
 */
const MILESTONES = [
  { name: 'Bronze', xp: 0 },
  { name: 'Silver', xp: 80 },
  { name: 'Gold', xp: 200 },
  { name: 'Sapphire', xp: 400 },
  { name: 'Ruby', xp: 800 },
  { name: 'Diamond', xp: 1500 },
] as const;

type Milestone = (typeof MILESTONES)[number];

function milestoneForXp(xp: number): { current: Milestone; next: Milestone | null } {
  let current: Milestone = MILESTONES[0];
  let next: Milestone | null = null;
  for (const milestone of MILESTONES) {
    if (xp >= milestone.xp) current = milestone;
    else {
      next = milestone;
      break;
    }
  }
  return { current, next };
}

interface VerifiedStats {
  xp: number;
  streak: number;
  lessons: number;
  todayXp: number;
  dailyGoal: number;
}

export function AccountPanel() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const progress = useProgress();
  const [gemBalance, setGemBalance] = useState<number | null>(null);
  const [verified, setVerified] = useState<VerifiedStats | null>(null);
  const [syncFailed, setSyncFailed] = useState(false);

  useEffect(() => {
    if (!session) {
      setGemBalance(null);
      setVerified(null);
      setSyncFailed(false);
      return;
    }
    let active = true;
    fetchGems()
      .then((result) => {
        if (active && result) setGemBalance(result.balance);
      })
      .catch(() => {
        if (active) setGemBalance(null);
      });
    fetch('/api/habits', { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Habits failed with ${response.status}`);
        return (await response.json()) as {
          habits?: {
            today?: { xp?: number };
            streak?: { current?: number };
            totals?: { xp?: number; lessons?: number };
            dailyGoal?: number;
          };
        };
      })
      .then((data) => {
        const habits = data.habits;
        if (!habits) throw new Error('Habits response was empty.');
        setVerified({
          xp: habits.totals?.xp ?? 0,
          streak: habits.streak?.current ?? 0,
          lessons: habits.totals?.lessons ?? 0,
          todayXp: habits.today?.xp ?? 0,
          dailyGoal: habits.dailyGoal ?? DAILY_GOAL,
        });
        setSyncFailed(false);
      })
      .catch(() => {
        if (!active) return;
        setVerified(null);
        setSyncFailed(true);
      });
    return () => {
      active = false;
    };
  }, [session]);

  if (isPending) {
    return (
      <div className="card flex min-h-56 items-center justify-center p-8">
        <Fox className="h-16 w-16 animate-bob" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="card flex flex-col items-center gap-4 p-8 text-center">
        <Fox className="h-20 w-20" />
        <h1 className="font-display text-2xl font-extrabold text-bark-800">You are learning as a guest</h1>
        <p className="max-w-sm text-sm font-semibold text-bark-500">
          Your progress lives in this browser. Create an account to keep it on every device.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/sign-up" className="btn-primary">
            Create account
          </Link>
          <Link href="/sign-in" className="btn-secondary">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  // Signed-in learners see event-derived numbers. The local snapshot only
  // stands in when the habits endpoint cannot be reached, and then it is
  // labelled as this device, never as the cloud account.
  const lifetime = verified ?? null;
  const effectiveXp = verified?.xp ?? progress?.xp ?? 0;
  const effectiveStreak = verified?.streak ?? progress?.streak ?? 0;
  const completed = verified?.lessons ?? (progress ? Object.keys(progress.completed).length : 0);
  const todayXp = lifetime?.todayXp ?? progress?.todayXp ?? 0;
  const dailyGoal = lifetime?.dailyGoal ?? progress?.dailyGoal ?? DAILY_GOAL;
  const milestone = milestoneForXp(effectiveXp);

  return (
    <div className="flex flex-col gap-5">
      <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-speeko-500 font-display text-2xl font-extrabold text-white">
            {(session.user.name || session.user.email).trim().charAt(0).toUpperCase()}
          </span>
          <div>
            <h1 className="font-display text-xl font-extrabold text-bark-800">{session.user.name}</h1>
            <p className="text-sm font-semibold text-bark-400">{session.user.email}</p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-display text-xs font-extrabold uppercase tracking-wide ${
            syncFailed ? 'bg-fox-100 text-fox-700' : 'bg-speeko-50 text-speeko-700'
          }`}
        >
          <CheckIcon className="h-4 w-4" />
          {syncFailed ? 'Account sync unreachable' : verified ? 'Verified account' : 'Cloud sync on'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {[
          {
            key: 'streak',
            node: <StatPill icon={<FlameIcon className="h-4 w-4 animate-bob" />} value={<span className="inline-block animate-pop">{effectiveStreak}</span>} label="Day streak" tone="streak" />,
          },
          {
            key: 'xp',
            node: <StatPill icon={<BoltIcon className="h-4 w-4" />} value={<span className="inline-block animate-pop [animation-delay:120ms]">{`${effectiveXp} XP`}</span>} label="Total XP" tone="xp" />,
          },
          {
            key: 'lessons',
            node: <StatPill icon={<TrophyIcon className="h-4 w-4" />} value={<span className="inline-block animate-pop [animation-delay:240ms]">{completed}</span>} label="Lessons completed" />,
          },
          {
            key: 'goal',
            node: (
              <StatPill
                icon={<BoltIcon className="h-4 w-4" />}
                value={<span className="inline-block animate-pop [animation-delay:360ms]">{`${Math.min(todayXp, dailyGoal)}/${dailyGoal} XP`}</span>}
                label="Daily XP goal"
                tone="goal"
              />
            ),
          },
          {
            key: 'gems',
            node: (
              <StatPill
                icon={<GemIcon className="h-4 w-4" />}
                value={<span className="inline-block animate-pop [animation-delay:440ms]">{gemBalance ?? '—'}</span>}
                label="Gems"
                tone="xp"
              />
            ),
          },
        ].map(({ key, node }, index) => (
          <div
            key={key}
            className="animate-rise"
            style={{ animationDelay: `${index * 80 + 80}ms` }}
          >
            {node}
          </div>
        ))}
      </div>

      {syncFailed ? (
        <p className="rounded-2xl border border-fox-200 bg-fox-100 px-4 py-3 text-xs font-semibold text-fox-700">
          Your account could not be reached, so the numbers above come from this device, not the
          cloud. Sign in again or retry later for verified totals.
        </p>
      ) : null}

      <div className="card flex flex-col gap-3 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-extrabold text-bark-800">
            Your milestones
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-gold-100 px-3 py-1.5 font-display text-xs font-extrabold uppercase tracking-wide text-gold-700">
            <StarIcon className="h-4 w-4" />
            {milestone.current.name}
          </span>
        </div>
        <p className="text-sm font-semibold text-bark-500">
          {milestone.next
            ? `Earn ${milestone.next.xp - effectiveXp} more XP to reach ${milestone.next.name}.`
            : 'You have reached the summit. Diamond tier — enjoy the view.'}
        </p>
        <ProgressBar
          value={milestone.next ? effectiveXp / milestone.next.xp : 1}
          className="h-3.5"
          barClassName="bg-gradient-to-r from-fox-400 to-fox-600"
          label="Milestone progress"
        />
        <div className="mt-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-bark-500">
          <GemIcon className="h-3.5 w-3.5" />
          Your next milestone awaits in the shop — every gem earned
        </div>
      </div>

      <div className="card flex flex-col gap-3 p-6">
        <h2 className="font-display text-lg font-extrabold text-bark-800">Account</h2>
        <p className="text-sm font-semibold text-bark-500">
          Completed lessons, XP, and streaks sync after every lesson. If a save
          cannot reach the server, the lesson shows Retry before it can be
          counted for your account.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link href="/shop" className="btn-secondary">
            Shop
          </Link>
          <Link href="/habits" className="btn-secondary">
            Habits &amp; calendar
          </Link>
          <Link href="/learn" className="btn-primary">
            Continue learning
          </Link>
          <button
            type="button"
            className="btn-secondary"
            onClick={async () => {
              await authClient.signOut();
              router.push('/');
              router.refresh();
            }}
          >
            Sign out
          </button>
          <button
            type="button"
            className="btn-secondary border-red-200 text-red-600 hover:bg-red-50"
            onClick={async () => {
              const confirmed = window.confirm(
                'Delete your account permanently? This removes your progress, rewards, and shop purchases. This cannot be undone.',
              );
              if (!confirmed) return;
              const response = await fetch('/api/account', {
                method: 'DELETE',
                credentials: 'include',
              });
              if (!response.ok) {
                alert('Could not delete the account. Please try again.');
                return;
              }
              try {
                window.localStorage.removeItem('speeko.progress.v2');
              } catch {
                // ignore storage failures
              }
              await authClient.signOut();
              router.push('/');
              router.refresh();
            }}
          >
            Delete account
          </button>
        </div>
      </div>
    </div>
  );
}
