'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SiteHeader } from '@/components/AppHeader';
import { Fox } from '@/components/Fox';
import { authClient } from '@/lib/auth-client';
import { SearchIcon } from '@/components/icons';

interface SearchResult {
  username: string;
  displayName: string | null;
}

export default function PeoplePage() {
  const { data: session, isPending: authPending } = authClient.useSession();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [following, setFollowing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!session?.user.id || query.trim().length < 2) {
      setResults([]);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    fetch(`/api/profiles/search?q=${encodeURIComponent(query.trim())}`, { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Search failed (status ${response.status}).`);
        return (await response.json()) as { results: SearchResult[] };
      })
      .then((body) => {
        if (active) setResults(body.results);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Search failed.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [query, session?.user.id]);

  async function toggleFollow(username: string, isFollowing: boolean) {
    const response = await fetch('/api/follows', {
      method: isFollowing ? 'DELETE' : 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    if (!response.ok) return;
    setFollowing((current) => ({ ...current, [username]: !isFollowing }));
  }

  const header = <SiteHeader active="leagues" />;

  if (authPending) {
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
          <h1 className="mt-3 font-display text-3xl font-extrabold text-bark-800">People need an account</h1>
          <p className="mt-2 max-w-md text-sm font-semibold text-bark-500">
            Sign in to search for learners and follow their progress.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {header}
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-speeko-600">
            People
          </p>
          <h1 className="mt-1 font-display text-4xl font-extrabold tracking-tight text-bark-800">
            Find learners.
          </h1>
          <p className="mt-2 text-sm font-semibold text-bark-500">
            Search by username or display name. Following only changes what you see; nothing is
            fabricated.
          </p>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-2xl border-2 border-cream-200 bg-white px-3 py-2">
          <SearchIcon className="h-5 w-5 text-bark-300" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search username or name"
            className="w-full bg-transparent font-semibold text-bark-700 outline-none placeholder:text-bark-300"
            aria-label="Search learners"
          />
        </div>

        {loading ? (
          <p className="mt-4 text-sm font-semibold text-bark-400">Searching…</p>
        ) : null}
        {error ? <p className="mt-4 text-sm font-semibold text-fox-700">{error}</p> : null}

        <ul className="mt-4 space-y-2">
          {results.map((result) => (
            <li
              key={result.username}
              className="flex items-center justify-between gap-3 rounded-2xl border-2 border-cream-200 bg-white p-4"
            >
              <div className="min-w-0">
                <Link
                  href={`/profile/${result.username}`}
                  className="font-display text-sm font-extrabold text-bark-800 hover:text-speeko-700"
                >
                  {result.displayName || result.username}
                </Link>
                <p className="text-xs font-semibold text-bark-400">@{result.username}</p>
              </div>
              <button
                type="button"
                className="btn-secondary shrink-0"
                onClick={() => toggleFollow(result.username, Boolean(following[result.username]))}
              >
                {following[result.username] ? 'Following' : 'Follow'}
              </button>
            </li>
          ))}
          {query.trim().length >= 2 && !loading && results.length === 0 ? (
            <li className="rounded-2xl border-2 border-dashed border-cream-200 p-6 text-center text-sm font-semibold text-bark-400">
              No learners found.
            </li>
          ) : null}
        </ul>
      </main>
    </div>
  );
}