'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { DAILY_GOAL } from '@/lib/progress';
import { useProgress } from '@/lib/use-progress';
import { Fox } from './Fox';
import { ProgressBar } from './ProgressBar';
import { StatPill } from './AppHeader';
import { BoltIcon, FlameIcon, TrophyIcon, CheckIcon, StarIcon, LockIcon } from './icons';

/** Local league thresholds — climbs solely on the learner's own XP. */
const LEAGUES = [
  { name: 'Bronze', xp: 0 },
  { name: 'Silver', xp: 80 },
  { name: 'Gold', xp: 200 },
  { name: 'Sapphire', xp: 400 },
  { name: 'Ruby', xp: 800 },
  { name: 'Diamond', xp: 1500 },
] as const;

type League = (typeof LEAGUES)[number];

function leagueForXp(xp: number): { current: League; next: League | null } {
  let current: League = LEAGUES[0];
  let next: League | null = null;
  for (const league of LEAGUES) {
    if (xp >= league.xp) current = league;
    else {
      next = league;
      break;
    }
  }
  return { current, next };
}

export function AccountPanel() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const progress = useProgress();

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

  const completed = progress ? Object.keys(progress.completed).length : 0;
  const todayXp = progress?.todayXp ?? 0;
  const league = leagueForXp(progress?.xp ?? 0);

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
        <span className="inline-flex items-center gap-1.5 rounded-xl bg-speeko-50 px-3 py-1.5 font-display text-xs font-extrabold uppercase tracking-wide text-speeko-700">
          <CheckIcon className="h-4 w-4" />
          Cloud sync on
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          <StatPill key="streak" icon={<FlameIcon className="h-4 w-4 animate-bob" />} value={<span className="inline-block animate-pop">{progress?.streak ?? 0}</span>} label="Day streak" tone="streak" />,
          <StatPill key="xp" icon={<BoltIcon className="h-4 w-4" />} value={<span className="inline-block animate-pop [animation-delay:120ms]">{`${progress?.xp ?? 0} XP`}</span>} label="Total XP" tone="xp" />,
          <StatPill key="lessons" icon={<TrophyIcon className="h-4 w-4" />} value={<span className="inline-block animate-pop [animation-delay:240ms]">{completed}</span>} label="Lessons completed" />,
          <StatPill
            key="goal"
            icon={<BoltIcon className="h-4 w-4" />}
            value={<span className="inline-block animate-pop [animation-delay:360ms]">{`${Math.min(todayXp, DAILY_GOAL)}/${DAILY_GOAL} XP`}</span>}
            label="Daily XP goal"
            tone="goal"
          />,
        ].map((pill, index) => (
          <div
            key={index}
            className="animate-rise"
            style={{ animationDelay: `${index * 80 + 80}ms` }}
          >
            {pill}
          </div>
        ))}
      </div>

      <div className="card flex flex-col gap-3 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-extrabold text-bark-800">
            Weekly League
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#fff9e0] px-3 py-1.5 font-display text-xs font-extrabold uppercase tracking-wide text-[#a06b00]">
            <StarIcon className="h-4 w-4" />
            {league.current.name}
          </span>
        </div>
        <p className="text-sm font-semibold text-bark-500">
          {league.next
            ? `Earn ${league.next.xp - (progress?.xp ?? 0)} more XP to reach ${league.next.name}.`
            : 'You have reached the summit. Diamond league — enjoy the view.'}
        </p>
        <ProgressBar
          value={league.next ? (progress?.xp ?? 0) / league.next.xp : 1}
          className="h-3.5"
          barClassName="bg-gradient-to-r from-fox-400 to-fox-600"
          label="League progress"
        />
        <div className="mt-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-bark-300">
          <LockIcon className="h-3.5 w-3.5" />
          Shop &amp; full league ladder — coming soon
        </div>
      </div>

      <div className="card flex flex-col gap-3 p-6">
        <h2 className="font-display text-lg font-extrabold text-bark-800">Account</h2>
        <p className="text-sm font-semibold text-bark-500">
          Completed lessons, XP, and streaks sync after every lesson. You can keep learning offline and the
          next save catches up.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
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
        </div>
      </div>
    </div>
  );
}
