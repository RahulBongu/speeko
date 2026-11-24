import { randomUUID } from 'node:crypto';
import { expect, test, type APIRequestContext } from '@playwright/test';

const API_URL = 'http://localhost:3001';
const ORIGIN = 'http://localhost:3000';

async function signUp(request: APIRequestContext): Promise<void> {
  const email = `ai-gate-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@speeko.test`;
  const response = await request.post(`${API_URL}/api/auth/sign-up/email`, {
    headers: { origin: ORIGIN },
    data: { name: 'AI Gate Tester', email, password: `speeko-ai-${randomUUID()}` },
  });
  expect(response.status(), await response.text()).toBe(200);
}

/**
 * The owner-gated conversation feature must stay honest: no fake success, no
 * provider details, and no access without a session. No real provider is
 * called and no credential value is read or logged.
 */
test('AI status and conversation reject unauthenticated callers', async ({ request }) => {
  const status = await request.get(`${API_URL}/api/ai/status`, { headers: { origin: ORIGIN } });
  expect(status.status()).toBe(401);
  const conversation = await request.post(`${API_URL}/api/ai/conversation`, {
    headers: { origin: ORIGIN },
    data: { messages: [] },
  });
  expect(conversation.status()).toBe(401);
});

test('unconfigured provider is reported honestly to a signed-in user', async ({ request }) => {
  // Only assert the unconfigured shape when the test environment really has no
  // provider configuration. Checking presence, never the value.
  test.skip(Boolean(process.env.AI_API_KEY || process.env.AI_API_URL),
    'AI provider variables are present in this environment; unconfigured assertions do not apply.');
  await signUp(request);

  const status = await request.get(`${API_URL}/api/ai/status`, { headers: { origin: ORIGIN } });
  expect(status.status()).toBe(200);
  expect(await status.json()).toEqual({ available: false });

  const conversation = await request.post(`${API_URL}/api/ai/conversation`, {
    headers: { origin: ORIGIN },
    data: { messages: [{ role: 'user', content: 'नमस्ते' }] },
  });
  expect(conversation.status()).toBe(503);
  const body = await conversation.json();
  expect(body.available).toBe(false);
  expect(body.error).toContain('unavailable');
  expect(JSON.stringify(body)).not.toMatch(/api[_-]?key|sk-|Bearer|AI_API/i);
});
