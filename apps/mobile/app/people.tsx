import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ORIGIN, apiFetch } from '../lib/api';
import { Screen } from '../components/Screen';
import { TactileButton } from '../components/Tactile';
import { COLORS } from '../lib/theme';

interface SearchResult {
  username: string;
  displayName: string | null;
}

export default function People() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState<string | null>(null);
  const [signedOut, setSignedOut] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    apiFetch('/api/profiles/me')
      .then((response) => {
        if (response.status === 401) setSignedOut(true);
      })
      .catch(() => {
        // The search request below will surface a reachability error.
      });
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2 || signedOut) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    const timer = setTimeout(async () => {
      try {
        const response = await apiFetch(`/api/profiles/search?q=${encodeURIComponent(trimmed)}`);
        if (response.status === 401) {
          if (active) setSignedOut(true);
          return;
        }
        if (!response.ok) throw new Error(`Search failed (${response.status}).`);
        const body = (await response.json()) as { results?: SearchResult[] };
        if (active) {
          setResults(Array.isArray(body.results) ? body.results : []);
          setSearched(true);
        }
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : 'Search failed.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, signedOut]);

  const toggleFollow = useCallback(
    async (username: string) => {
      if (pending) return;
      setPending(username);
      setError(null);
      const isFollowing = Boolean(following[username]);
      try {
        const response = await apiFetch('/api/follows', {
          method: isFollowing ? 'DELETE' : 'POST',
          headers: { origin: ORIGIN },
          body: JSON.stringify({ username }),
        });
        if (response.status === 401) {
          setSignedOut(true);
          return;
        }
        if (!response.ok) throw new Error(`Follow change failed (${response.status}).`);
        const body = (await response.json()) as { following?: boolean };
        setFollowing((current) => ({
          ...current,
          [username]: body.following ?? !isFollowing,
        }));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Follow change failed.');
      } finally {
        setPending(null);
      }
    },
    [following, pending],
  );

  if (signedOut) {
    return (
      <Screen>
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 12 }}>
          <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.dark }}>
            People need an account
          </Text>
          <Text style={{ color: COLORS.muted }}>
            Sign in to search for learners and follow their progress.
          </Text>
          <TactileButton label="Sign in" onPress={() => router.push('/sign-in')} />
          <TactileButton label="Back" tone="cream" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, backgroundColor: COLORS.cream }}>
        <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.dark }}>Find learners</Text>
      <Text style={{ color: COLORS.muted }}>
        Search by username or display name. Following only changes what you see; nothing is
        fabricated.
      </Text>

      <TextInput
        accessibilityLabel="Search learners"
        value={query}
        onChangeText={setQuery}
        placeholder="Search username or name"
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          borderWidth: 2,
          borderColor: COLORS.line,
          borderRadius: 14,
          padding: 12,
          backgroundColor: COLORS.white,
          color: COLORS.dark,
        }}
      />

      {loading ? (
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <ActivityIndicator color={COLORS.green} />
          <Text style={{ color: COLORS.muted }}>Searching…</Text>
        </View>
      ) : null}
      {error ? <Text accessibilityRole="alert" style={{ color: COLORS.red }}>{error}</Text> : null}

      {results.map((result) => {
        const isFollowing = Boolean(following[result.username]);
        const isPending = pending === result.username;
        return (
          <View
            key={result.username}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              padding: 14,
              borderRadius: 14,
              backgroundColor: COLORS.white,
              borderWidth: 1,
              borderColor: COLORS.line,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', color: COLORS.dark }}>
                {result.displayName || result.username}
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.muted }}>@{result.username}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: isPending }}
              disabled={isPending}
              onPress={() => void toggleFollow(result.username)}
              style={{
                backgroundColor: isFollowing ? COLORS.creamDeep : COLORS.green,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              <Text style={{ fontWeight: '800', color: isFollowing ? COLORS.dark : COLORS.white }}>
                {isPending ? '…' : isFollowing ? 'Unfollow' : 'Follow'}
              </Text>
            </Pressable>
          </View>
        );
      })}

      {searched && results.length === 0 && !loading ? (
        <Text style={{ color: COLORS.muted }}>No learners found.</Text>
      ) : null}
      {query.trim().length > 0 && query.trim().length < 2 ? (
        <Text style={{ color: COLORS.muted }}>Type at least two characters.</Text>
      ) : null}

      <TactileButton label="Back" tone="cream" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}
