'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { SiteHeader } from '@/components/AppHeader';
import { Fox } from '@/components/Fox';
import { authClient } from '@/lib/auth-client';
import { fetchShop, purchaseItem, isShopCosmeticId, type ShopItem, type ShopState } from '@/lib/shop';
import { useProgress } from '@/lib/use-progress';
import { saveProgress } from '@/lib/progress';
import { pushCloudProgress } from '@/lib/sync';
import { GemIcon } from '@/components/icons';

export default function ShopClient() {
  const { data: session, isPending: authPending } = authClient.useSession();
  const userId = session?.user.id ?? null;
  const progress = useProgress();
  const [shop, setShop] = useState<ShopState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [buying, setBuying] = useState<string | null>(null);
  const [status, setStatus] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!userId) {
      setShop(null);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    fetchShop()
      .then((result) => {
        if (active) setShop(result);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Shop could not load.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId, reloadKey]);

  const equip = useCallback(
    async (cosmeticId: string | null) => {
      if (!progress) return;
      const next = { ...progress, equippedCosmetic: cosmeticId };
      saveProgress(next);
      if (userId) {
        try {
          await pushCloudProgress(next);
        } catch {
          // Retried on the next progress event.
        }
      }
    },
    [progress, userId],
  );

  async function buy(item: ShopItem) {
    if (buying) return;
    setBuying(item.id);
    setStatus(null);
    try {
      const requestId =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;
      const result = await purchaseItem(item.id, requestId);
      setStatus(
        result.duplicate
          ? { message: 'Purchase already recorded.', tone: 'success' }
          : { message: `Purchased ${item.name}.`, tone: 'success' },
      );
      // The server response is the source of truth — update local state once, no refetch.
      setShop((current) =>
        current
          ? {
              ...current,
              balance: result.balance,
              freezeCredits: result.freezeCredits,
              items: current.items.map((candidate) =>
                candidate.id === item.id ? result.item : candidate,
              ),
            }
          : current,
      );
    } catch (cause) {
      setStatus({
        message: cause instanceof Error ? cause.message : 'Purchase failed.',
        tone: 'error',
      });
    } finally {
      setBuying(null);
    }
  }

  const header = <SiteHeader active="shop" />;

  if (authPending || (userId && loading && !shop)) {
    return (
      <div className="min-h-screen">
        {header}
        <main className="mx-auto flex max-w-2xl flex-col items-center px-5 py-20 text-center">
          <Fox className="h-28 w-28 animate-bob" />
          <p className="mt-3 font-display text-sm font-extrabold uppercase tracking-[0.16em] text-bark-500">
            Opening the shop…
          </p>
        </main>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen">
        {header}
        <main className="mx-auto flex max-w-2xl flex-col items-center px-5 py-20 text-center">
          <Fox className="h-28 w-28" />
          <h1 className="mt-3 font-display text-3xl font-extrabold text-bark-800">The shop needs an account</h1>
          <p className="mt-2 max-w-md text-sm font-semibold text-bark-500">
            Gems are earned from verified lessons. Sign in to spend them on fox cosmetics
            and streak freezes.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/sign-in" className="btn-primary">
              Sign in
            </Link>
            <Link href="/sign-up" className="btn-secondary">
              Create account
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        {header}
        <main className="mx-auto flex max-w-2xl flex-col items-center px-5 py-20 text-center">
          <Fox mood="sad" className="h-28 w-28" />
          <h1 className="mt-3 font-display text-3xl font-extrabold text-bark-800">Shop could not load</h1>
          <p className="mt-2 max-w-md text-sm font-semibold text-bark-500">{error}</p>
          <button type="button" className="btn-primary mt-6" onClick={() => setReloadKey((key) => key + 1)}>
            Try again
          </button>
        </main>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen">
        {header}
        <main className="mx-auto flex max-w-2xl flex-col items-center px-5 py-20 text-center">
          <Fox className="h-28 w-28 animate-bob" />
        </main>
      </div>
    );
  }

  const equipped = progress?.equippedCosmetic ?? null;
  const equippedAccessory = equipped && isShopCosmeticId(equipped) ? equipped : null;

  return (
    <div className="min-h-screen">
      {header}
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">
              Shop
            </p>
            <h1 className="mt-1 font-display text-4xl font-extrabold tracking-tight text-bark-800 sm:text-5xl">
              Spend your gems.
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-bark-500">
              Gems come from verified lessons and completed daily quests. Nothing here costs
              real money.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl border-2 border-gold-200 bg-gold-100 px-4 py-2 font-display text-lg font-extrabold text-gold-700">
            <GemIcon className="h-5 w-5" />
            {shop.balance} gems
          </div>
        </div>

        <section className="mt-5 grid gap-4 sm:grid-cols-[0.9fr_1.1fr]">
          <div className="card flex flex-col items-center p-6 text-center">
            <Fox
              mood="happy"
              patrol
              className="h-40 w-40"
              accessory={equippedAccessory}
            />
            <p className="mt-3 font-display text-sm font-extrabold uppercase tracking-[0.14em] text-bark-500">
              Your fox
            </p>
            <p className="mt-1 text-sm font-semibold text-bark-500">
              {equipped ? `Wearing ${equipped}.` : 'No cosmetic equipped.'}
            </p>
            {equipped ? (
              <button
                type="button"
                className="btn-secondary mt-4"
                onClick={() => equip(null)}
              >
                Remove cosmetic
              </button>
            ) : null}
          </div>

          {shop.items.length === 0 ? (
            <p className="rounded-3xl border-2 border-dashed border-cream-200 p-8 text-center text-sm font-semibold text-bark-500">
              The shelves are empty for now — new cosmetics arrive soon. Your gems are safe; they don&apos;t expire.
            </p>
          ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {shop.items.map((item) => (
              <div key={item.id} className="card flex flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-lg font-extrabold text-bark-800">{item.name}</p>
                    <p className="mt-1 text-sm font-semibold text-bark-500">{item.description}</p>
                  </div>
                  {item.owned && item.kind === 'cosmetic' ? (
                    <span className="rounded-xl bg-speeko-50 px-2.5 py-1 font-display text-[11px] font-extrabold uppercase tracking-wide text-speeko-700">
                      Owned
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 font-display text-xl font-extrabold text-gold-700">
                  {item.price} gems
                </p>
                {item.kind === 'cosmetic' && item.owned ? (
                  <button
                    type="button"
                    className={`btn-secondary mt-4 ${equipped === item.cosmeticId ? 'opacity-60' : ''}`}
                    onClick={() => equip(item.cosmeticId ?? null)}
                    disabled={equipped === item.cosmeticId}
                  >
                    {equipped === item.cosmeticId ? 'Equipped' : 'Equip'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-primary mt-4"
                    disabled={buying === item.id || !item.canAfford}
                    onClick={() => buy(item)}
                  >
                    {buying === item.id
                      ? 'Buying…'
                      : item.canAfford
                        ? 'Buy'
                        : 'Not enough gems'}
                  </button>
                )}
                {!item.canAfford && !item.owned ? (
                  <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.1em] text-bark-500">
                    Earn more gems from lessons.
                  </p>
                ) : null}
                {item.kind === 'freeze' ? (
                  <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.1em] text-bark-500">
                    Freezes held: {shop.freezeCredits} / 2
                  </p>
                ) : null}
              </div>
            ))}
          </div>
          )}
        </section>

        {status ? (
          <p
            role={status.tone === 'error' ? 'alert' : 'status'}
            className={`mt-4 rounded-2xl border-2 px-4 py-3 text-center text-sm font-extrabold ${
              status.tone === 'error'
                ? 'border-fox-200 bg-fox-100 text-fox-700'
                : 'border-speeko-200 bg-speeko-50 text-speeko-700'
            }`}
          >
            {status.message}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Link href="/learn" className="btn-primary">
            Earn more gems
          </Link>
          <Link href="/habits" className="btn-secondary">
            View habits
          </Link>
        </div>
      </main>
    </div>
  );
}