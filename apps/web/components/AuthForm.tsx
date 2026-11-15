'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Fox } from './Fox';

const fieldClass =
  'focus-ring w-full rounded-2xl border-2 border-cream-200 bg-white px-4 py-3 font-semibold text-bark-700 placeholder:text-bark-300 transition focus:border-speeko-300';

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isSignUp = mode === 'sign-up';

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result = isSignUp
        ? await authClient.signUp.email({ name: name.trim(), email, password })
        : await authClient.signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message ?? 'That did not work. Check your details and try again.');
        return;
      }
      router.push('/learn');
      router.refresh();
    } catch {
      setError('Could not reach the account server. Check that the API is running.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="card overflow-hidden">
        <div className="flex flex-col items-center gap-2 bg-speeko-50 px-6 pb-6 pt-8 text-center">
          <Fox className="h-20 w-20 animate-bob" />
          <h1 className="font-display text-2xl font-extrabold text-bark-800">
            {isSignUp ? 'Save your progress' : 'Welcome back'}
          </h1>
          <p className="max-w-xs text-sm font-semibold text-bark-500">
            {isSignUp
              ? 'Create an account to keep your streak on every device.'
              : 'Sign in to pick up where you left off.'}
          </p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 p-6">
          {isSignUp ? (
            <label className="flex flex-col gap-1.5">
              <span className="font-display text-xs font-extrabold uppercase tracking-wide text-bark-400">
                Name
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                autoComplete="name"
                className={fieldClass}
              />
            </label>
          ) : null}

          <label className="flex flex-col gap-1.5">
            <span className="font-display text-xs font-extrabold uppercase tracking-wide text-bark-400">
              Email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className={fieldClass}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-display text-xs font-extrabold uppercase tracking-wide text-bark-400">
              Password
            </span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={isSignUp ? 'At least 8 characters' : 'Your password'}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              className={fieldClass}
            />
          </label>

          {error ? (
            <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={busy} className="btn-primary mt-1 w-full">
            {busy ? 'One moment…' : isSignUp ? 'Create account' : 'Sign in'}
          </button>

          <p className="text-center text-sm font-semibold text-bark-500">
            {isSignUp ? 'Already have an account? ' : 'New to Speeko? '}
            <Link
              href={isSignUp ? '/sign-in' : '/sign-up'}
              className="font-display font-extrabold text-speeko-600 hover:text-speeko-700"
            >
              {isSignUp ? 'Sign in' : 'Create one'}
            </Link>
          </p>
        </form>
      </div>

      <p className="mt-4 text-center text-xs font-semibold text-bark-400">
        Your local progress is merged into your account the first time you sign in.
      </p>
      <p className="mt-2 text-center">
        <Link href="/learn" className="btn-ghost">
          Keep learning as a guest
        </Link>
      </p>
    </div>
  );
}
