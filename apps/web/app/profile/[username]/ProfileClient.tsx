'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { SiteHeader } from '@/components/AppHeader';
import { Fox } from '@/components/Fox';
import { authClient } from '@/lib/auth-client';

interface Profile {
  userId: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  xp: number;
  streak: number;
  lessons: number;
  followers: number;
  following: number;
  isSelf: boolean;
  isFollowing: boolean;
}

export default function ProfileClient() {
  const params = useParams<{ username: string }>();
  const username = params?.username ?? '';
  const { data: session, isPending: authPending } = authClient.useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [followError, setFollowError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user.id || !username) return;
    let active = true;
    setLoading(true);
    setError(null);
    fetch(`/api/profiles/${encodeURIComponent(username)}`, { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Profile could not load (status ${response.status}).`);
        return (await response.json()) as Profile;
      })
      .then((result) => {
        if (active) {
          setProfile(result);
          setFollowing(result.isFollowing);
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Profile could not load.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session?.user.id, username]);

  async function toggleFollow() {
    if (!profile || profile.isSelf || followBusy) return;
    setFollowBusy(true);
    setFollowError(null);
    try {
      const response = await fetch('/api/follows', {
        method: following ? 'DELETE' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: profile.username }),
      });
      if (!response.ok) {
        setFollowError('Could not update that follow. Check your connection and try again.');
        return;
      }
      setFollowing(!following);
      setProfile((current) =>
        current
          ? {
              ...current,
              followers: current.followers + (following ? -1 : 1),
            }
          : current,
      );
    } catch {
      setFollowError('Could not update that follow. Check your connection and try again.');
    } finally {
      setFollowBusy(false);
    }
  }

  const header = <SiteHeader active="leagues" />;

  if (authPending || (session && loading && !profile)) {
    return (
      <div className="min-h-screen">
        {header}
        <main className="mx-auto flex max-w-2xl flex-col items-center px-5 py-20 text-center">
          <Fox className="h-28 w-28 animate-bob" />
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
          <h1 className="mt-3 font-display text-3xl font-extrabold text-bark-800">Profiles need an account</h1>
          <p className="mt-2 max-w-md text-sm font-semibold text-bark-500">
            Sign in to see learner profiles and follow their progress.
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

  if (error || !profile) {
    return (
      <div className="min-h-screen">
        {header}
        <main className="mx-auto flex max-w-2xl flex-col items-center px-5 py-20 text-center">
          <Fox mood="sad" className="h-28 w-28" />
          <h1 className="mt-3 font-display text-3xl font-extrabold text-bark-800">Profile not found</h1>
          <p className="mt-2 max-w-md text-sm font-semibold text-bark-500">
            {error ?? 'No learner uses that username.'}
          </p>
          <Link href="/people" className="btn-primary mt-6">
            Find people
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {header}
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
        <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-speeko-500 font-display text-2xl font-extrabold text-white">
              {(profile.displayName || profile.username).trim().charAt(0).toUpperCase()}
            </span>
            <div>
              <h1 className="font-display text-2xl font-extrabold text-bark-800">
                {profile.displayName || profile.username}
              </h1>
              <p className="text-sm font-semibold text-bark-400">@{profile.username}</p>
              {profile.bio ? <p className="mt-1 text-sm font-semibold text-bark-500">{profile.bio}</p> : null}
            </div>
          </div>
          {!profile.isSelf ? (
            <button
              type="button"
              className={following ? 'btn-secondary' : 'btn-primary'}
              onClick={toggleFollow}
              disabled={followBusy}
              aria-pressed={following}
            >
              {following ? 'Following' : 'Follow'}
            </button>
          ) : (
            <span className="rounded-xl bg-speeko-50 px-3 py-1.5 font-display text-xs font-extrabold uppercase tracking-wide text-speeko-700">
              You
            </span>
          )}
        </div>

        {followError ? (
          <p
            role="alert"
            className="mt-3 rounded-2xl border-2 border-fox-200 bg-fox-100 px-4 py-3 text-sm font-semibold text-fox-700"
          >
            {followError}
          </p>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-2xl border-2 border-cream-200 bg-white p-4 text-center">
            <p className="font-display text-2xl font-extrabold text-bark-800">{profile.xp}</p>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-bark-500">XP</p>
          </div>
          <div className="rounded-2xl border-2 border-cream-200 bg-white p-4 text-center">
            <p className="font-display text-2xl font-extrabold text-bark-800">{profile.streak}</p>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-bark-500">Streak</p>
          </div>
          <div className="rounded-2xl border-2 border-cream-200 bg-white p-4 text-center">
            <p className="font-display text-2xl font-extrabold text-bark-800">{profile.lessons}</p>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-bark-500">Lessons</p>
          </div>
          <div className="rounded-2xl border-2 border-cream-200 bg-white p-4 text-center">
            <p className="font-display text-2xl font-extrabold text-bark-800">{profile.followers}</p>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-bark-500">Followers</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/leagues" className="btn-primary">
            Weekly leagues
          </Link>
          <Link href="/people" className="btn-secondary">
            Find more people
          </Link>
        </div>
      </main>
    </div>
  );
}