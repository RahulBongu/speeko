'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { DAILY_GOAL } from '@/lib/progress';
import { useProgress } from '@/lib/use-progress';
import { Fox } from './Fox';
import { StatPill } from './AppHeader';
import { BoltIcon, FlameIcon, TrophyIcon, CheckIcon } from './icons';

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
        <StatPill icon={<FlameIcon className="h-4 w-4" />} value={progress?.streak ?? 0} label="Day streak" tone="streak" />
        <StatPill icon={<BoltIcon className="h-4 w-4" />} value={`${progress?.xp ?? 0} XP`} label="Total XP" tone="xp" />
        <StatPill icon={<TrophyIcon className="h-4 w-4" />} value={completed} label="Lessons completed" />
        <StatPill
          icon={<BoltIcon className="h-4 w-4" />}
          value={`${Math.min(todayXp, DAILY_GOAL)}/${DAILY_GOAL} XP`}
          label="Daily XP goal"
          tone="goal"
        />
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
