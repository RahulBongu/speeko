import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { ProgressState } from '@speeko/core';
import * as Haptics from 'expo-haptics';
import { ORIGIN, apiFetch, setCookie } from '../lib/api';
import { clearProgress, loadProgress } from '../lib/progress';
import { syncProgress } from '../lib/sync';
import { AppNav } from '../components/AppNav';
import { Screen } from '../components/Screen';
import { Fox } from '../components/Fox';
import {
  SpeekoAppBar,
  TactilePressable,
} from '../components/Tactile';
import { COLORS } from '../lib/theme';

interface SessionUser {
  email?: string;
  name?: string;
}

/** Event-derived stats, the same numbers the public profile sees. */
interface VerifiedStats {
  xp: number;
  streak: number;
  lessons: number;
  dailyGoal: number;
}

interface VerifiedResult {
  stats: VerifiedStats | null;
  failed: boolean;
}

export default function Account() {
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [verified, setVerified] = useState<VerifiedStats | null>(null);
  const [verifiedFailed, setVerifiedFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sessionResponse = await apiFetch('/api/auth/get-session');
      let signedInUser: SessionUser | null = null;
      if (sessionResponse.ok) {
        const session = (await sessionResponse.json()) as {
          user?: SessionUser | null;
        } | null;
        signedInUser = session?.user ?? null;
      }
      setSignedIn(Boolean(signedInUser));
      setEmail(signedInUser?.email ?? signedInUser?.name ?? null);

      if (signedInUser) {
        const [habitsResult, synced] = await Promise.allSettled([
          apiFetch('/api/habits'),
          syncProgress(),
        ]);
        if (habitsResult.status === 'fulfilled' && habitsResult.value.ok) {
          try {
            const body = (await habitsResult.value.json()) as {
              habits?: {
                dailyGoal?: number;
                totals?: { xp?: number; lessons?: number };
                streak?: { current?: number };
              };
            };
            const habits = body.habits;
            if (!habits) throw new Error('Habits response was empty.');
            setVerified({
              xp: habits.totals?.xp ?? 0,
              streak: habits.streak?.current ?? 0,
              lessons: habits.totals?.lessons ?? 0,
              dailyGoal: habits.dailyGoal ?? 50,
            });
            setVerifiedFailed(false);
          } catch {
            setVerified(null);
            setVerifiedFailed(true);
          }
        } else {
          setVerified(null);
          setVerifiedFailed(true);
        }
        setProgress(
          synced.status === 'fulfilled' ? synced.value.progress : await loadProgress(),
        );
      } else {
        setVerified(null);
        setVerifiedFailed(false);
        setProgress(await loadProgress());
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Account details could not load.');
      setProgress(await loadProgress());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function signOut() {
    if (busy) return;
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const response = await apiFetch('/api/auth/sign-out', {
        method: 'POST',
        headers: { origin: ORIGIN },
      });
      if (!response.ok && response.status !== 401) {
        throw new Error(`Sign out failed (${response.status}).`);
      }
      // Clear both the credential and the snapshot so the next person on this
      // device cannot see this account's XP, SRS cards, or cosmetics.
      await setCookie(null);
      await clearProgress();
      setSignedIn(false);
      setEmail(null);
      setProgress(await loadProgress());
      setStatus('Signed out. Local progress was cleared from this device.');
      // Confirm the sign-out with a success haptic. Never let it block the redirect.
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Intentionally non-fatal.
      }
      router.replace('/');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not sign out. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ padding: 18, gap: 14, backgroundColor: COLORS.cream, flexGrow: 1 }}
      >
        <SpeekoAppBar
        subtitle={
          signedIn
            ? verified
              ? 'Verified account'
              : 'Account sync unreachable'
            : 'This device'
        }
        streak={verified?.streak ?? progress?.streak ?? 0}
        xp={verified?.xp ?? progress?.xp ?? 0}
      />

      <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.dark }}>Account</Text>

      {loading ? (
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <ActivityIndicator color={COLORS.green} />
          <Text style={{ color: COLORS.muted, fontWeight: '700' }}>Loading…</Text>
        </View>
      ) : null}
      {error ? <Text accessibilityRole="alert" style={{ color: COLORS.red }}>{error}</Text> : null}
      {status ? (
        <Text style={{ color: COLORS.greenDark, fontWeight: '700' }}>{status}</Text>
      ) : null}

      {/* Profile header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          padding: 16,
          borderRadius: 20,
          borderWidth: 2,
          borderColor: COLORS.line,
          backgroundColor: COLORS.white,
        }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            borderWidth: 3,
            borderColor: COLORS.dark,
            backgroundColor: COLORS.creamDeep,
            overflow: 'hidden',
          }}
        >
          <Fox
            mood="idle"
            title="Speeko the fox"
            style={{ width: '100%', height: '100%' }}
          />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 11, fontWeight: '900', color: COLORS.muted, letterSpacing: 0.5 }}>
            {signedIn ? (verified ? 'VERIFIED ACCOUNT' : 'DEVICE ONLY') : 'DEVICE ONLY'}
          </Text>
          <Text
            style={{ fontSize: 16, fontWeight: '900', color: COLORS.dark }}
            numberOfLines={1}
          >
            {signedIn ? email ?? 'Signed in' : 'Not signed in · this device only'}
          </Text>
        </View>
      </View>

      {verifiedFailed ? (
        <View
          accessibilityRole="alert"
          style={{
            padding: 12,
            borderRadius: 14,
            borderWidth: 2,
            borderColor: '#F59E0B',
            backgroundColor: '#FEF3C7',
            gap: 4,
          }}
        >
          <Text style={{ fontWeight: '800', color: '#92400E' }}>
            Account sync could not be reached.
          </Text>
          <Text style={{ fontSize: 12, color: '#92400E' }}>
            The numbers below come from this device, not the cloud. Sign in again or retry later
            for verified totals.
          </Text>
        </View>
      ) : null}

      {progress || verified ? (
        <View
          style={{
            padding: 16,
            borderRadius: 16,
            borderWidth: 2,
            borderColor: COLORS.line,
            backgroundColor: COLORS.white,
            gap: 6,
          }}
        >
          <Text style={{ fontWeight: '900', fontSize: 16, color: COLORS.dark }}>
            {verified ? 'Verified account progress' : 'Device progress'}
          </Text>
          <Text style={{ color: COLORS.dark }}>
            XP: {verified?.xp ?? progress?.xp ?? 0}
          </Text>
          <Text style={{ color: COLORS.dark }}>
            Streak: {verified?.streak ?? progress?.streak ?? 0} days
          </Text>
          <Text style={{ color: COLORS.dark }}>
            Daily goal: {verified?.dailyGoal ?? progress?.dailyGoal ?? 0} XP
          </Text>
          <Text style={{ color: COLORS.dark }}>
            Lessons completed:{' '}
            {verified?.lessons ?? Object.keys(progress?.completed ?? {}).length}
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 12 }}>
            {verified
              ? 'XP, streak, and lessons below come from server-verified attempts. A forged snapshot cannot change them.'
              : 'Complete lessons and sign in later to merge this device progress into your account.'}
          </Text>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TactilePressable
          onPress={() => router.push('/leagues')}
          tone="white"
          style={{ flex: 1 }}
        >
          <Text style={{ fontWeight: '800', color: COLORS.dark }}>Leagues</Text>
        </TactilePressable>
        <TactilePressable
          onPress={() => router.push('/people')}
          tone="white"
          style={{ flex: 1 }}
        >
          <Text style={{ fontWeight: '800', color: COLORS.dark }}>Find people</Text>
        </TactilePressable>
      </View>

      <TactilePressable
        onPress={() => router.push('/licenses')}
        tone="white"
        accessibilityHint="Opens the bundled license and attribution texts"
      >
        <Text style={{ fontWeight: '800', color: COLORS.dark }}>
          Licenses and attributions
        </Text>
      </TactilePressable>

      {signedIn ? (
        <TactilePressable
          onPress={() => void signOut()}
          disabled={busy}
          tone="cream"
          accessibilityHint="Clears this device's saved progress"
        >
          <Text style={{ fontWeight: '800', color: COLORS.dark }}>
            {busy ? 'Signing out…' : 'Sign out and clear this device'}
          </Text>
        </TactilePressable>
      ) : (
        <>
          <TactilePressable
            onPress={() => router.push('/sign-in')}
            tone="green"
          >
            <Text style={{ color: COLORS.white, fontWeight: '800' }}>Sign in</Text>
          </TactilePressable>
          <TactilePressable
            onPress={() => router.push('/sign-up')}
            tone="cream"
          >
            <Text style={{ color: COLORS.dark, fontWeight: '800' }}>Create account</Text>
          </TactilePressable>
        </>
      )}

      <AppNav active="account" />
      </ScrollView>
    </Screen>
  );
}
