'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SiteHeader } from '@/components/AppHeader';
import { Fox } from '@/components/Fox';
import { authClient } from '@/lib/auth-client';
import { ArrowRightIcon } from '@/components/icons';

interface Standing {
  rank: number;
  userId: string;
  username: string;
  displayName: string | null;
  weeklyXp: number;
  lessons: number;
}

interface LeaguesState {
  earlyCommunity: boolean;
  minimumPlayers: number;
  activeUsers: number;
  weekStart: string;
  standings: Standing[];
  me: { rank: number; zone: 'promotion' | 'safe' | 'demotion' } | null;
}

export default function LeaguesClient() {
  const { data: session, isPending: authPending } = authClient.useSession();
  const [state, setState] = useState<LeaguesState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!session?.user.id) {
      setState(null);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    fetch('/api/leagues', { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Leagues could not load (status ${response.status}).`);
        return (await response.json()) as LeaguesState;
      })
      .then((result) => {
        if (active) setState(result);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Leagues could not load.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session?.user.id, reloadKey]);

  const header = <SiteHeader active="leagues" />;

  if (authPending) {
    return (
      <div className="min-h-screen">
        {header}
        <main className="mx-auto flex max-w-2xl flex-col items-center px-5 py-20 text-center">
          <Fox className="h-28 w-28 animate-bob" />
          <p className="mt-3 font-display text-sm font-extrabold uppercase tracking-[0.16em] text-bark-500">
            Checking your account…
          </p>
        </main>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen">
        {header}
        <main className="mx-auto flex max-w-2xl flex-col items-center px-5 py-20 text-center">
          <Fox className="h-28 w-28" />
          <h1 className="mt-3 font-display text-3xl font-extrabold text-bark-800">Leagues need an account</h1>
          <p className="mt-2 max-w-md text-sm font-semibold text-bark-500">
            Weekly standings come from verified lessons. Sign in to see where you stand.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/sign-in" className="btn-primary">
              Sign in
            </Link>
            <Link href="/sign-up" className="btn-secondary">
              Create account
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (loading && !state) {
    return (
      <div className="min-h-screen">
        {header}
        <main className="mx-auto flex max-w-2xl flex-col items-center px-5 py-20 text-center">
          <Fox className="h-28 w-28 animate-bob" />
          <p className="mt-3 font-display text-sm font-extrabold uppercase tracking-[0.16em] text-bark-500">
            Reading this week&apos;s standings…
          </p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        {header}
        <main className="mx-auto flex max-w-2xl flex-col items-center px-5 py-20 text-center">
          <Fox mood="sad" className="h-28 w-28" />
          <h1 className="mt-3 font-display text-3xl font-extrabold text-bark-800">Leagues could not load</h1>
          <p className="mt-2 max-w-md text-sm font-semibold text-bark-500">{error}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button type="button" className="btn-primary" onClick={() => setReloadKey((key) => key + 1)}>
              Try again
            </button>
            <Link href="/practice" className="btn-secondary">
              Back to practice
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="min-h-screen">
        {header}
        <main className="mx-auto flex max-w-2xl flex-col items-center px-5 py-20 text-center">
          <Fox className="h-28 w-28 animate-bob" />
          <p className="mt-3 font-display text-sm font-extrabold uppercase tracking-[0.16em] text-bark-500">
            Reading this week&apos;s standings…
          </p>
        </main>
      </div>
    );
  }

  const weekStartLabel = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${state.weekStart}T12:00:00Z`));

  return (
    <div className="min-h-screen">
      {header}
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">
              Leagues
            </p>
            <h1 className="mt-1 font-display text-4xl font-extrabold tracking-tight text-bark-800 sm:text-5xl">
              This week&apos;s race.
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-bark-500">
              Standings come from verified lessons finished since {weekStartLabel}. No fabricated
              players, no pretend ranks.
            </p>
          </div>
          <Link href="/people" className="btn-secondary shrink-0">
            Find people
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        {state.earlyCommunity ? (
          <section className="mt-5 flex flex-col items-center gap-4 rounded-3xl border-2 border-cream-200 bg-white p-6 text-center shadow-card-sm sm:flex-row sm:text-left">
            <Fox mood="idle" className="h-20 w-20 shrink-0" />
            <div className="flex-1">
              <h2 className="font-display text-xl font-extrabold text-bark-800">
                Early community — {state.activeUsers} of {state.minimumPlayers} learners
              </h2>
              <p className="mt-1 text-sm font-semibold text-bark-500">
                Leagues open once at least {state.minimumPlayers} real learners have finished a lesson
                this week. Until then, your weekly XP still counts toward the standings below.
              </p>
            </div>
          </section>
        ) : null}

        <section className="card mt-5 overflow-hidden p-0">
          <div className="border-b border-cream-200 px-5 py-4">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-bark-500">
              Weekly XP
            </p>
            <h2 className="mt-1 font-display text-2xl font-extrabold text-bark-800">
              {state.standings.length} learner{state.standings.length === 1 ? '' : 's'} this week
            </h2>
          </div>
          <ol className="divide-y divide-cream-200">
            {state.standings.map((entry) => {
              const isMe = entry.userId === session?.user.id;
              return (
                <li
                  key={entry.userId}
                  className={`flex items-center gap-3 px-5 py-3 ${isMe ? 'bg-speeko-50' : ''}`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cream-100 font-display text-sm font-extrabold text-bark-600">
                    {entry.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/profile/${entry.username}`}
                      className="font-display text-sm font-extrabold text-bark-800 hover:text-speeko-700"
                    >
                      {entry.displayName || entry.username}
                    </Link>
                    <p className="text-xs font-semibold text-bark-400">
                      @{entry.username} · {entry.lessons} lesson{entry.lessons === 1 ? '' : 's'}
                    </p>
                  </div>
                  <span className="font-display text-sm font-extrabold text-speeko-700">
                    {entry.weeklyXp} XP
                  </span>
                  {isMe && state.me ? (
                    <span
                      className={`rounded-xl px-2.5 py-1 font-display text-[11px] font-extrabold uppercase tracking-wide ${
                        state.me.zone === 'promotion'
                          ? 'bg-speeko-50 text-speeko-700'
                          : state.me.zone === 'demotion'
                            ? 'bg-fox-100 text-fox-700'
                            : 'bg-cream-100 text-bark-500'
                      }`}
                    >
                      {state.me.zone === 'promotion'
                        ? 'Promotion zone'
                        : state.me.zone === 'demotion'
                          ? 'Demotion zone'
                          : 'Safe zone'}
                    </span>
                  ) : null}
                </li>
              );
            })}
            {state.standings.length === 0 ? (
              <li className="px-5 py-8 text-center text-sm font-semibold text-bark-500">
                No verified lessons this week yet. Finish one to start the standings.
              </li>
            ) : null}
          </ol>
        </section>

        {state.me ? (
          <p className="mt-4 text-center text-sm font-semibold text-bark-500">
            You are rank {state.me.rank} of {state.activeUsers} this week.
          </p>
        ) : null}
      </main>
    </div>
  );
}