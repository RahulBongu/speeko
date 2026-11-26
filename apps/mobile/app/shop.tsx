import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { ProgressState } from '@speeko/core';
import * as Haptics from 'expo-haptics';
import { ORIGIN, apiFetch } from '../lib/api';
import { loadProgress, saveProgress } from '../lib/progress';
import { syncProgress } from '../lib/sync';
import { useOnFocus } from '../lib/useOnFocus';
import { AppNav } from '../components/AppNav';
import { Screen } from '../components/Screen';
import { Fox } from '../components/Fox';
import { Icon } from '../components/Icons';
import {
  SpeekoAppBar,
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
    if (progressResult.status === 'fulfilled') setProgress(progressResult.value.progress);
    else setProgress(await loadProgress());
    setLoading(false);
  }, []);

  useOnFocus(load);

  const buy = useCallback(async (item: ShopItem) => {
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
      try { body = await response.json(); } catch { /* status message below */ }
      if (response.status === 401) {
        setSignedIn(false);
        setStatus({ tone: 'error', message: 'Sign in to spend gems.' });
        return;
      }
      if (!response.ok) {
        setStatus({ tone: 'error', message: body.error ?? `Purchase failed (${response.status}).` });
        return;
      }
      setStatus({ tone: 'ok', message: body.duplicate ? 'Purchase already recorded.' : `Purchased ${item.name}.` });
      try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch { /* decorative */ }
      const refreshed = await apiFetch('/api/shop');
      if (refreshed.ok) setShop((await refreshed.json()) as ShopState);
    } catch {
      setStatus({ tone: 'error', message: 'Purchase failed. Check your connection and try again.' });
    } finally {
      setBuying(null);
    }
  }, [buying]);

  const equip = useCallback(async (cosmeticId: string | null) => {
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
    await saveProgress(updated);
    setProgress(updated);
    if (signedIn === false) {
      setStatus({ tone: 'muted', message: cosmeticId ? 'Equipped on this device. Sign in to sync cosmetics across devices.' : 'Cosmetic removed on this device.' });
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
        setStatus({ tone: 'muted', message: 'Saved on this device. Sign in again to sync cosmetics.' });
        return;
      }
      if (!response.ok) {
        const rolledBack = { ...current, equippedCosmetic: previous };
        await saveProgress(rolledBack);
        setProgress(rolledBack);
        let message = `Cosmetic change was rejected (${response.status}).`;
        try {
          const body = (await response.json()) as { error?: unknown };
          if (typeof body.error === 'string') message = body.error;
        } catch { /* keep message */ }
        setStatus({ tone: 'error', message });
        return;
      }
      const data = (await response.json()) as { progress?: ProgressState };
      if (data.progress) { await saveProgress(data.progress); setProgress(data.progress); }
      setStatus({ tone: 'ok', message: cosmeticId ? 'Cosmetic equipped and synced.' : 'Cosmetic removed and synced.' });
    } catch {
      setStatus({ tone: 'muted', message: 'Saved on this device. The server could not be reached, so sync will retry later.' });
    } finally {
      setEquipping(false);
    }
  }, [equipping, progress, signedIn]);

  if (loading) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator color={COLORS.green} />
          <Text style={{ color: COLORS.muted, fontWeight: '700' }}>Loading shop…</Text>
        </View>
        <AppNav active="shop" />
      </Screen>
    );
  }

  if (loadError) {
    return (
      <Screen>
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 12 }}>
          <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.dark }}>The shop could not load</Text>
          <Text accessibilityRole="alert" style={{ color: COLORS.red }}>{loadError}</Text>
          <TactileButton label="Try again" onPress={() => void load()} />
          <TactileButton label="Back" tone="cream" onPress={() => router.back()} />
        </View>
        <AppNav active="shop" />
      </Screen>
    );
  }

  if (signedIn === false || !shop) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={{ padding: 18, gap: 14, backgroundColor: COLORS.cream, flexGrow: 1, justifyContent: 'center' }}>
          <TactileCard tone="white">
            <View style={{ alignItems: 'center', gap: 12 }}>
              <Fox mood="happy" style={{ width: 112, height: 112 }} title="Speeko at the shop" />
              <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.dark, textAlign: 'center' }}>
                The shop needs an account
              </Text>
              <Text style={{ color: COLORS.muted, textAlign: 'center', fontSize: 13, lineHeight: 19 }}>
                Gems are earned from verified lessons. Sign in to spend them on fox cosmetics and streak
                freezes.
              </Text>
              <TactileButton label="Sign in" tone="green" onPress={() => router.push('/sign-in')} style={{ alignSelf: 'stretch' }} />
              <TactileButton label="Back" tone="cream" onPress={() => router.back()} style={{ alignSelf: 'stretch' }} />
            </View>
          </TactileCard>
        </ScrollView>
        <AppNav active="shop" />
      </Screen>
    );
  }

  const equipped = progress?.equippedCosmetic ?? null;
  const cosmetics = shop.items.filter((item) => item.kind === 'cosmetic');
  const freezes = shop.items.filter((item) => item.kind === 'freeze');

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, backgroundColor: COLORS.cream, flexGrow: 1 }}>
        <SpeekoAppBar subtitle="Fox cosmetics & streak freezes" />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.dark }}>Shop</Text>
          <View accessibilityLabel={`${shop.balance} gems available`} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.white, borderWidth: 2, borderColor: COLORS.line, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Icon name="shop" size={14} color={COLORS.gold} />
            <Text style={{ fontSize: 13, fontWeight: '900', color: COLORS.dark }}>{shop.balance} gems</Text>
          </View>
        </View>

        <TactileCard tone="green">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 0.6, color: COLORS.greenSoft }}>FEATURED</Text>
              <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.white }}>Dress up your fox</Text>
              <Text style={{ fontSize: 12, color: COLORS.greenSoft }}>
                {shop.freezeCredits} of 2 streak freezes ready
              </Text>
            </View>
            <Fox
              mood="happy"
              accessory={progress?.equippedCosmetic ?? null}
              patrol
              style={{ width: 76, height: 76 }}
              title="Speeko in the shop"
            />
          </View>
        </TactileCard>

        {status ? (
          <Text accessibilityRole="alert" style={{ fontWeight: '700', color: status.tone === 'error' ? COLORS.red : status.tone === 'ok' ? COLORS.greenDark : COLORS.muted }}>
            {status.message}
          </Text>
        ) : null}

        {equipped ? (
          <TactileButton label={equipping ? 'Updating…' : 'Remove equipped cosmetic'} tone="cream" onPress={() => void equip(null)} disabled={equipping} />
        ) : null}

        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.dark }}>Cosmetics</Text>
          {cosmetics.map((item) => (
            <TactileCard key={item.id} tone="white">
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="account" size={20} color={COLORS.greenDark} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontWeight: '900', color: COLORS.dark }}>{item.name}</Text>
                  <Text style={{ color: COLORS.muted, fontSize: 12 }}>{item.description}</Text>
                </View>
                <View style={{ borderRadius: 999, borderWidth: 1.5, borderColor: COLORS.gold, backgroundColor: COLORS.paper, paddingHorizontal: 9, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: '900', color: COLORS.goldInk }}>{item.price}</Text>
                </View>
              </View>
              {item.owned ? (
                <View style={{ gap: 6, marginTop: 10 }}>
                  <Text style={{ color: COLORS.greenDark, fontWeight: '800' }}>Owned</Text>
                  <TactileButton
                    label={equipped === item.cosmeticId ? 'Equipped' : equipping ? 'Updating…' : 'Equip'}
                    tone={equipped === item.cosmeticId ? 'cream' : 'green'}
                    onPress={() => void equip(item.cosmeticId ?? null)}
                    disabled={equipping || equipped === item.cosmeticId}
                  />
                </View>
              ) : (
                <TactileButton
                  label={buying === item.id ? 'Buying…' : item.canAfford ? `Buy for ${item.price} gems` : 'Not enough gems'}
                  tone="green"
                  onPress={() => void buy(item)}
                  disabled={buying !== null || !item.canAfford}
                  style={{ marginTop: 10 }}
                />
              )}
            </TactileCard>
          ))}
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.dark }}>Streak protection</Text>
          {freezes.map((item) => (
            <TactileCard key={item.id} tone="white">
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.blueSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="flame" size={20} color={COLORS.blue} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontWeight: '900', color: COLORS.dark }}>{item.name}</Text>
                  <Text style={{ color: COLORS.muted, fontSize: 12 }}>{item.description}</Text>
                  <Text style={{ color: COLORS.muted, fontSize: 11 }}>Held: {shop.freezeCredits} / 2</Text>
                </View>
                <View style={{ borderRadius: 999, borderWidth: 1.5, borderColor: COLORS.gold, backgroundColor: COLORS.paper, paddingHorizontal: 9, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: '900', color: COLORS.goldInk }}>{item.price}</Text>
                </View>
              </View>
              <TactileButton
                label={buying === item.id ? 'Buying…' : item.canAfford ? `Buy for ${item.price} gems` : 'Not enough gems'}
                tone="green"
                onPress={() => void buy(item)}
                disabled={buying !== null || !item.canAfford}
                style={{ marginTop: 10 }}
              />
            </TactileCard>
          ))}
        </View>
      </ScrollView>
      <AppNav active="shop" />
    </Screen>
  );
}
