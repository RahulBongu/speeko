'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/AppHeader';
import { Fox } from '@/components/Fox';
import { API_URL, authClient } from '@/lib/auth-client';

export default function ConversationPage() {
  const { data: session } = authClient.useSession();
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!session?.user.id) return;
    fetch(`${API_URL}/api/ai/status`, { credentials: 'include' })
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => setAvailable(Boolean(body?.available)))
      .catch(() => setAvailable(false));
  }, [session?.user.id]);

  return (
    <div className="min-h-screen">
      <SiteHeader active="learn" />
      <main className="mx-auto flex max-w-2xl flex-col items-center px-5 py-20 text-center">
        <Fox className="h-28 w-28" />
        <h1 className="mt-3 font-display text-3xl font-extrabold text-bark-800">
          Conversation practice
        </h1>
        <p className="mt-2 max-w-md text-sm font-semibold text-bark-500">
          {session
            ? available === false
              ? 'Conversation practice is unavailable until an AI provider is configured on the server. No pretend conversations are shown.'
              : available === true
                ? 'A provider is configured, but the practice flow is not implemented yet.'
                : 'Checking availability…'
            : 'Sign in to check conversation practice availability.'}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/practice" className="btn-primary">
            Practice instead
          </Link>
          <Link href="/learn" className="btn-secondary">
            Learn
          </Link>
        </div>
      </main>
    </div>
  );
}
