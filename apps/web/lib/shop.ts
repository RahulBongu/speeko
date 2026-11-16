import { API_URL } from './auth-client';

export interface ShopItem {
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

export interface ShopState {
  balance: number;
  freezeCredits: number;
  items: ShopItem[];
}

export async function fetchShop(): Promise<ShopState | null> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/shop`, { credentials: 'include' });
  } catch {
    throw new Error('Could not reach Speeko.');
  }
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(`Shop could not load (status ${response.status}).`);
  return (await response.json()) as ShopState;
}

export async function purchaseItem(
  itemId: string,
  requestId: string,
): Promise<{ duplicate: boolean; balance: number; freezeCredits: number; item: ShopItem }> {
  const response = await fetch(`${API_URL}/api/shop/purchase`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId, requestId }),
  });
  const text = await response.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    // leave null
  }
  if (response.status === 401) throw new Error('Sign in to use the shop.');
  if (!response.ok) throw new Error(json?.error ?? `Purchase failed (status ${response.status}).`);
  return json;
}

export async function fetchGems(): Promise<{ balance: number; freezeCredits: number } | null> {
  const response = await fetch(`${API_URL}/api/gems`, { credentials: 'include' });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(`Gems could not load (status ${response.status}).`);
  const body = (await response.json()) as { balance: number; freezeCredits: number };
  return { balance: body.balance, freezeCredits: body.freezeCredits };
}