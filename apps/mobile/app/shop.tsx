import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { ProgressState } from '@speeko/core';
import { ORIGIN, apiFetch } from '../lib/api';
import { loadProgress, saveProgress } from '../lib/progress';
import { syncProgress } from '../lib/sync';
import { AppNav } from '../components/AppNav';
import {
  SpeekoAppBar,
  StatPill,
  TactileButton,
  TactileCard,
} from '../components/Tactile';
import { COLORS } from '../lib/theme';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  kind: 'cosmetic' | 'freeze';
  cosmeticId?: string;
  owned: boolean;
  quantity: number;
  canAfford: boolean;
}

interface ShopState {
  balance: number;
  freezeCredits: number;
  items: ShopItem[];
}

type Status = { tone: 'ok' | 'error' | 'muted'; message: string } | null;

export default function Shop() {
  const router = useRouter();
  const [shop, setShop] = useState<ShopState | null>(null);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [equipping, setEquipping] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const [shopResult, progressResult] = await Promise.allSettled([
      apiFetch('/api/shop'),
      syncProgress(),
    ]);

    if (shopResult.status === 'rejected') {
      setLoadError('Could not reach Speeko. Check your connection and try again.');
      setLoading(false);
      return;
    }

    if (shopResult.value.status === 401) {
      setSignedIn(false);
      setShop(null);
    } else if (!shopResult.value.ok) {
      setLoadError(`Shop could not load (${shopResult.value.status}).`);
      setLoading(false);
      return;
    } else {
      setSignedIn(true);
      setShop((await shopResult.value.json()) as ShopState);
    }

    // Progress is display state (the equipped cosmetic). A guest still gets
    // their device-local snapshot; a signed-in learner gets a merged copy.
    if (progressResult.status === 'fulfilled') {
      setProgress(progressResult.value.progress);
    } else {
      setProgress(await loadProgress());
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const buy = useCallback(
    async (item: ShopItem) => {
      if (buying) return;
      setBuying(item.id);
      setStatus(null);
      try {
        const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const response = await apiFetch('/api/shop/purchase', {
          method: 'POST',
          headers: { origin: ORIGIN },
          body: JSON.stringify({ itemId: item.id, requestId }),
        });
        let body: { error?: string; duplicate?: boolean } = {};
        try {
          body = await response.json();
        } catch {
          // Keep the status-based message below.
        }
        if (response.status === 401) {
          setSignedIn(false);
          setStatus({ tone: 'error', message: 'Sign in to spend gems.' });
          return;
        }
        if (!response.ok) {
          setStatus({
            tone: 'error',
            message: body.error ?? `Purchase failed (${response.status}).`,
          });
          return;
        }
        setStatus({
          tone: 'ok',
          message: body.duplicate ? 'Purchase already recorded.' : `Purchased ${item.name}.`,
        });
        // Refresh balance, ownership, and affordability together.
        const refreshed = await apiFetch('/api/shop');
        if (refreshed.ok) setShop((await refreshed.json()) as ShopState);
      } catch {
        setStatus({ tone: 'error', message: 'Purchase failed. Check your connection and try again.' });
      } finally {
        setBuying(null);
      }
    },
    [buying],
  );

  const equip = useCallback(
    async (cosmeticId: string | null) => {
      if (equipping) return;
      setEquipping(true);
      setStatus(null);
      const current = (await loadProgress()) ?? progress;
      if (!current) {
        setEquipping(false);
        setStatus({ tone: 'error', message: 'Could not read your saved progress.' });
        return;
      }
      const previous = current.equippedCosmetic;
      const updated = { ...current, equippedCosmetic: cosmeticId };

      // Local first: the cosmetic always applies on this device, even when the
      // server cannot be reached or the learner is signed out.
      await saveProgress(updated);
      setProgress(updated);

      if (signedIn === false) {
        setStatus({
          tone: 'muted',
          message: cosmeticId
            ? 'Equipped on this device. Sign in to sync cosmetics across devices.'
            : 'Cosmetic removed on this device.',
        });
        setEquipping(false);
        return;
      }

      try {
        const response = await apiFetch('/api/progress', {
          method: 'PUT',
          headers: { origin: ORIGIN },
          body: JSON.stringify({ progress: updated }),
        });
        if (response.status === 401) {
          setSignedIn(false);
          setStatus({
            tone: 'muted',
            message: 'Saved on this device. Sign in again to sync cosmetics.',
          });
          return;
        }
        if (!response.ok) {
          // The server rejected the change (for example, the item is not
          // owned). Roll the local snapshot back instead of showing a lie.
          const rolledBack = { ...current, equippedCosmetic: previous };
          await saveProgress(rolledBack);
          setProgress(rolledBack);
          let message = `Cosmetic change was rejected (${response.status}).`;
          try {
            const body = (await response.json()) as { error?: unknown };
            if (typeof body.error === 'string') message = body.error;
          } catch {
            // Keep the status-based message.
          }
          setStatus({ tone: 'error', message });
          return;
        }
        const data = (await response.json()) as { progress?: ProgressState };
        if (data.progress) {
          await saveProgress(data.progress);
          setProgress(data.progress);
        }
        setStatus({
          tone: 'ok',
          message: cosmeticId ? 'Cosmetic equipped and synced.' : 'Cosmetic removed and synced.',
        });
      } catch {
        setStatus({
          tone: 'muted',
          message: 'Saved on this device. The server could not be reached, so sync will retry later.',
        });
      } finally {
        setEquipping(false);
      }
    },
    [equipping, progress, signedIn],
  );

  if (loading) {
    return (
      <View style={{ flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <ActivityIndicator color={COLORS.green} />
        <Text style={{ fontWeight: '700', color: COLORS.muted }}>Loading shop…</Text>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 12 }}>
        <Text style={{ color: COLORS.red }}>{loadError}</Text>
        <TactileButton label="Try again" onPress={() => void load()} />
      </View>
    );
  }

  if (signedIn === false || !shop) {
    return (
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 12 }}>
        <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.dark }}>
          The shop needs an account
        </Text>
        <Text style={{ color: COLORS.muted }}>
          Gems are earned from verified lessons. Sign in to spend them on fox cosmetics and streak
          freezes.
        </Text>
        <TactileButton label="Sign in" onPress={() => router.push('/sign-in')} />
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={{ padding: 10 }}>
          <Text style={{ color: COLORS.dark, fontWeight: '800', textAlign: 'center' }}>Back</Text>
        </Pressable>
      </View>
    );
  }

  const equipped = progress?.equippedCosmetic ?? null;

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, gap: 10, backgroundColor: COLORS.cream, flexGrow: 1 }}
    >
      <SpeekoAppBar subtitle="Fox cosmetics & streak freezes" />
      <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.dark }}>Shop</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontWeight: '800', color: COLORS.dark }}>Gems: {shop.balance}</Text>
        <StatPill
          icon="⚡"
          value={shop.balance}
          label={`${shop.balance} gems available`}
        />
      </View>
      {status ? (
        <Text
          accessibilityRole="alert"
          style={{
            fontWeight: '700',
            color:
              status.tone === 'error'
                ? COLORS.red
                : status.tone === 'ok'
                  ? COLORS.greenDark
                  : COLORS.muted,
          }}
        >
          {status.message}
        </Text>
      ) : null}

      {equipped ? (
        <TactileButton
          label={equipping ? 'Updating…' : 'Remove equipped cosmetic'}
          tone="cream"
          onPress={() => void equip(null)}
          disabled={equipping}
          style={{ alignSelf: 'flex-start' }}
        />
      ) : null}

      {shop.items.map((item) => (
        <TactileCard key={item.id} tone="white">
          <View style={{ gap: 6 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '900', color: COLORS.dark }}>{item.name}</Text>
                <Text style={{ color: COLORS.muted }}>{item.description}</Text>
              </View>
              <View
                style={{
                  borderRadius: 999,
                  borderWidth: 1.5,
                  borderColor: '#C9A200',
                  backgroundColor: '#FFF6CC',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '900', color: '#8A6800' }}>
                  💎 {item.price}
                </Text>
              </View>
            </View>
            <Text style={{ fontWeight: '800', color: COLORS.dark }}>{item.price} gems</Text>

          {item.kind === 'cosmetic' && item.owned ? (
              <View style={{ gap: 6 }}>
                <Text style={{ color: COLORS.greenDark, fontWeight: '800' }}>Owned</Text>
                <TactileButton
                  label={equipped === item.cosmeticId ? 'Equipped' : equipping ? 'Updating…' : 'Equip'}
                  onPress={() => void equip(item.cosmeticId ?? null)}
                  disabled={equipping || equipped === item.cosmeticId}
                  style={{ alignSelf: 'stretch' }}
                />
              </View>
            ) : (
              <TactileButton
                label={
                  buying === item.id
                    ? 'Buying…'
                    : item.canAfford
                      ? `Buy for ${item.price} gems`
                      : 'Not enough gems'
                }
                onPress={() => void buy(item)}
                disabled={buying !== null || !item.canAfford}
                style={{ alignSelf: 'stretch' }}
              />
            )}
          </View>
          {item.kind === 'freeze' ? (
            <Text style={{ color: COLORS.muted, fontSize: 12 }}>
              Freezes held: {shop.freezeCredits} / 2 · Buying adds one credit
            </Text>
          ) : null}
        </TactileCard>
      ))}

      <AppNav active="shop" />
    </ScrollView>
  );
}
