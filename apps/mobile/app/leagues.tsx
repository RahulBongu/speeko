import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '../lib/api';
import { Screen } from '../components/Screen';
import {
  TactileButton,
  TactilePressable,
} from '../components/Tactile';
import { COLORS } from '../lib/theme';

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

export default function Leagues() {
  const router = useRouter();
  const [state, setState] = useState<LeaguesState | null>(null);
  const [signedOut, setSignedOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch('/api/leagues');
      if (response.status === 401) {
        setSignedOut(true);
        setState(null);
        return;
      }
      if (!response.ok) throw new Error(`Leagues could not load (${response.status}).`);
      setSignedOut(false);
      setState((await response.json()) as LeaguesState);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Leagues could not load.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <Screen>
        <View style={{ flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator color={COLORS.green} />
          <Text style={{ color: COLORS.muted, fontWeight: '700' }}>Reading this week&apos;s standings…</Text>
        </View>
      </Screen>
    );
  }

  if (signedOut) {
    return (
      <Screen>
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 12 }}>
          <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.dark }}>
            Leagues need an account
          </Text>
          <Text style={{ color: COLORS.muted }}>
            Weekly standings come from verified lessons. Sign in to see where you stand.
          </Text>
          <TactileButton label="Sign in" onPress={() => router.push('/sign-in')} />
          <TactileButton label="Back" tone="cream" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  if (error || !state) {
    return (
      <Screen>
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 12 }}>
          <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.dark }}>
            Leagues could not load
          </Text>
          <Text accessibilityRole="alert" style={{ color: COLORS.red }}>{error ?? 'Leagues could not load.'}</Text>
          <TactileButton label="Try again" onPress={() => void load()} />
          <TactileButton label="Back" tone="cream" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, backgroundColor: COLORS.cream }}>
        <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.dark }}>This week&apos;s race</Text>
        <Text style={{ color: COLORS.muted }}>
          Standings come from verified lessons finished since {state.weekStart}. No fabricated players,
          no pretend ranks.
        </Text>

        <TactilePressable
          tone="white"
          accessibilityLabel="Find people"
          onPress={() => router.push('/people')}
          style={{ alignSelf: 'flex-start' }}
          contentStyle={{ paddingVertical: 10, paddingHorizontal: 14 }}
        >
          <Text style={{ fontWeight: '800', color: COLORS.dark }}>Find people →</Text>
        </TactilePressable>

      {state.earlyCommunity ? (
        <View style={{ padding: 16, borderRadius: 14, backgroundColor: COLORS.white, gap: 4 }}>
          <Text style={{ fontWeight: '900', color: COLORS.dark }}>
            Early community — {state.activeUsers} of {state.minimumPlayers} learners
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 12 }}>
            Leagues open once at least {state.minimumPlayers} real learners have finished a lesson
            this week. Until then, your weekly XP still counts below.
          </Text>
        </View>
      ) : null}

      <View style={{ borderRadius: 14, backgroundColor: COLORS.white, overflow: 'hidden' }}>
        <View style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.line }}>
          <Text style={{ fontSize: 10, fontWeight: '800', color: COLORS.muted }}>WEEKLY XP</Text>
          <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.dark }}>
            {state.standings.length} learner{state.standings.length === 1 ? '' : 's'} this week
          </Text>
        </View>
        {state.standings.length === 0 ? (
          <Text style={{ padding: 16, color: COLORS.muted }}>
            No verified lessons this week yet.
          </Text>
        ) : (
          state.standings.map((entry) => {
            const isMe = state.me?.rank === entry.rank;
            return (
              <View
                key={entry.userId}
                accessible={isMe || undefined}
                accessibilityLabel={isMe ? `You, rank ${entry.rank}` : undefined}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  padding: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: COLORS.line,
                  backgroundColor: isMe ? COLORS.greenSoft : COLORS.white,
                }}
              >
                <Text style={{ width: 26, fontWeight: '900', color: COLORS.muted }}>{entry.rank}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800', color: COLORS.dark }}>
                    {entry.displayName || entry.username}
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.muted }}>
                    @{entry.username} · {entry.lessons} lesson{entry.lessons === 1 ? '' : 's'}
                  </Text>
                </View>
                <Text style={{ fontWeight: '900', color: COLORS.greenDark }}>{entry.weeklyXp} XP</Text>
              </View>
            );
          })
        )}
      </View>

      {state.me ? (
        <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.muted }}>
          You are rank {state.me.rank} · {state.me.zone}
        </Text>
      ) : null}
        <TactileButton label="Back" tone="cream" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}
