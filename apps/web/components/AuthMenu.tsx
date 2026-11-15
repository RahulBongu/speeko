'use client';

import Link from 'next/link';
import { authClient } from '@/lib/auth-client';

export function AuthMenu() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <span className="h-9 w-20 animate-pulse rounded-xl bg-cream-100" aria-hidden="true" />;
  }

  if (!session) {
    return (
      <Link
        href="/sign-in"
        className="focus-ring rounded-xl px-3 py-2 font-display text-sm font-bold text-bark-500 transition hover:bg-cream-100 hover:text-bark-700"
      >
        Sign in
      </Link>
    );
  }

  const name = session.user.name || session.user.email;
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <Link
      href="/account"
      className="focus-ring flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-cream-100"
      aria-label={`Account for ${name}`}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-speeko-500 font-display text-sm font-extrabold text-white">
        {initial}
      </span>
      <span className="hidden max-w-28 truncate font-display text-sm font-bold text-bark-600 sm:block">
        {name.split(' ')[0]}
      </span>
    </Link>
  );
}
