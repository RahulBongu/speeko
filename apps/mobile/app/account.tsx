import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { ProgressState } from '@speeko/core';
import * as Haptics from 'expo-haptics';
import { ORIGIN, apiFetch, setCookie } from '../lib/api';
import { clearProgress, loadProgress } from '../lib/progress';
import { syncProgress } from '../lib/sync';
import { isMascotVoiceEnabled, setMascotVoiceEnabled } from '../lib/mascot';
import { AppNav } from '../components/AppNav';
import { Screen } from '../components/Screen';
import { Fox } from '../components/Fox';
import { Icon } from '../components/Icons';
import {
  SpeekoAppBar,
  TactileCard,
  TactilePressable,
} from '../components/Tactile';
import { COLORS } from '../lib/theme';

interface SessionUser {
  email?: string;
  name?: string;
}

interface VerifiedStats {
  xp: number;
  streak: number;
  lessons: number;
  dailyGoal: number;
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
  const [mascotVoiceOn, setMascotVoiceOn] = useState<boolean>(isMascotVoiceEnabled());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sessionResponse = await apiFetch('/api/auth/get-session');
      let signedInUser: SessionUser | null = null;
      if (sessionResponse.ok) {
        const session = (await sessionResponse.json()) as { user?: SessionUser | null } | null;
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
              habits?: { dailyGoal?: number; totals?: { xp?: number; lessons?: number }; streak?: { current?: number } };
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
        setProgress(synced.status === 'fulfilled' ? synced.value.progress : await loadProgress());
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

  useEffect(() => { void load(); }, [load]);

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
      if (!response.ok && response.status !== 401) throw new Error(`Sign out failed (${response.status}).`);
      await setCookie(null);
      await clearProgress();
      setSignedIn(false);
      setEmail(null);
      setProgress(await loadProgress());
      setStatus('Signed out. Local progress was cleared from this device.');
      try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch { /* non-fatal */ }
      router.replace('/');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not sign out. Try again.');
    } finally {
      setBusy(false);
    }
  }

  const xp = verified?.xp ?? progress?.xp ?? 0;
  const streak = verified?.streak ?? progress?.streak ?? 0;
  const lessons = verified?.lessons ?? Object.keys(progress?.completed ?? {}).length;
  const dailyGoal = verified?.dailyGoal ?? progress?.dailyGoal ?? 0;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, backgroundColor: COLORS.cream, flexGrow: 1 }}>
        <SpeekoAppBar
          subtitle={signedIn ? (verified ? 'Verified account' : 'Account sync unreachable') : 'This device'}
          streak={streak}
          xp={xp}
        />
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.dark }}>Account</Text>
          <Text style={{ color: COLORS.muted, fontSize: 13 }}>
            {signedIn ? 'Your verified progress and settings.' : 'Your progress stays on this device until you sign in.'}
          </Text>
        </View>

        {loading ? (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <ActivityIndicator color={COLORS.green} />
            <Text style={{ color: COLORS.muted, fontWeight: '700' }}>Loading…</Text>
          </View>
        ) : null}
        {error ? <Text accessibilityRole="alert" style={{ color: COLORS.red }}>{error}</Text> : null}
        {status ? <Text style={{ color: COLORS.greenDark, fontWeight: '700' }}>{status}</Text> : null}

        <TactileCard tone="white">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: COLORS.greenSoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <Fox mood={signedIn ? 'happy' : 'idle'} title="Speeko the fox" style={{ width: 64, height: 64 }} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ fontSize: 10, fontWeight: '900', color: COLORS.muted, letterSpacing: 0.6 }}>
                {signedIn ? (verified ? 'VERIFIED ACCOUNT' : 'DEVICE ONLY') : 'DEVICE ONLY'}
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.dark }} numberOfLines={1}>
                {signedIn ? email ?? 'Signed in' : 'Not signed in · this device only'}
              </Text>
            </View>
          </View>
        </TactileCard>

        {verifiedFailed ? (
          <TactileCard tone="cream">
            <Text accessibilityRole="alert" style={{ fontWeight: '800', color: COLORS.muted, fontSize: 12 }}>
              Account sync could not be reached.
            </Text>
            <Text style={{ fontWeight: '600', color: COLORS.muted, fontSize: 12, marginTop: 4 }}>
              The numbers below come from this device, not the cloud. Sign in again or retry later for
              verified totals.
            </Text>
          </TactileCard>
        ) : null}

        {(progress || verified) && (
          <TactileCard tone="white">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="trophy" size={16} color={COLORS.marigold} />
              <Text style={{ fontWeight: '900', fontSize: 16, color: COLORS.dark }}>
                {verified ? 'Verified account progress' : 'Device progress'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
              {[
                { label: 'XP', value: xp, text: `XP: ${xp}`, icon: 'bolt' as const },
                { label: 'Streak', value: `${streak} days`, text: `Streak: ${streak} days`, icon: 'flame' as const },
                { label: 'Lessons', value: lessons, text: `Lessons completed: ${lessons}`, icon: 'learn' as const },
                { label: 'Daily goal', value: `${dailyGoal} XP`, text: `Daily goal: ${dailyGoal} XP`, icon: 'habits' as const },
              ].map((stat) => (
                <View key={stat.label} style={{ width: '47%', backgroundColor: COLORS.cream, borderRadius: 14, padding: 12, gap: 4 }}>
                  <Icon name={stat.icon} size={14} color={COLORS.green} />
                  <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.dark }}>{stat.text}</Text>
                </View>
              ))}
            </View>
            <Text style={{ color: COLORS.muted, fontSize: 11, marginTop: 10 }}>
              {verified
                ? 'XP, streak, and lessons come from server-verified attempts. A forged snapshot cannot change them.'
                : 'Complete lessons and sign in later to merge this device progress into your account.'}
            </Text>
          </TactileCard>
        )}

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TactilePressable onPress={() => router.push('/leagues')} tone="white" style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="trophy" size={15} color={COLORS.muted} />
              <Text style={{ fontWeight: '800', color: COLORS.dark }}>Leagues</Text>
            </View>
          </TactilePressable>
          <TactilePressable onPress={() => router.push('/people')} tone="white" style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="account" size={15} color={COLORS.muted} />
              <Text style={{ fontWeight: '800', color: COLORS.dark }}>Find people</Text>
            </View>
          </TactilePressable>
        </View>

        <TactilePressable onPress={() => router.push('/licenses')} tone="white" accessibilityHint="Opens the bundled license and attribution texts">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="guidebook" size={15} color={COLORS.muted} />
            <Text style={{ fontWeight: '800', color: COLORS.dark }}>Licenses and attributions</Text>
          </View>
        </TactilePressable>

        <TactileCard tone="white">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="account" size={15} color={COLORS.muted} />
            <Text style={{ fontWeight: '900', fontSize: 16, color: COLORS.dark }}>Settings</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontWeight: '800', color: COLORS.dark }}>Mascot voice</Text>
              <Text style={{ color: COLORS.muted, fontSize: 12 }}>Speeko's spoken reactions</Text>
            </View>
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: mascotVoiceOn }}
              onPress={() => {
                const next = !mascotVoiceOn;
                setMascotVoiceOn(next);
                setMascotVoiceEnabled(next);
              }}
              style={{
                width: 52,
                height: 30,
                borderRadius: 15,
                backgroundColor: mascotVoiceOn ? COLORS.green : COLORS.disabled,
                justifyContent: 'center',
                paddingHorizontal: 3,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: COLORS.white,
                  alignSelf: mascotVoiceOn ? 'flex-end' : 'flex-start',
                }}
              />
            </Pressable>
          </View>
        </TactileCard>

        {signedIn ? (
          <TactilePressable onPress={() => void signOut()} disabled={busy} tone="cream" accessibilityHint="Clears this device's saved progress">
            <Text style={{ fontWeight: '800', color: COLORS.dark }}>{busy ? 'Signing out…' : 'Sign out and clear this device'}</Text>
          </TactilePressable>
        ) : (
          <>
            <TactilePressable onPress={() => router.push('/sign-in')} tone="green">
              <Text style={{ color: COLORS.white, fontWeight: '800' }}>Sign in</Text>
            </TactilePressable>
            <TactilePressable onPress={() => router.push('/sign-up')} tone="cream">
              <Text style={{ color: COLORS.dark, fontWeight: '800' }}>Create account</Text>
            </TactilePressable>
          </>
        )}

        <AppNav active="account" />
      </ScrollView>
    </Screen>
  );
}
