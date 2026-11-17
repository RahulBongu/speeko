import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import { expect, test } from '@playwright/test';

/**
 * Production startup guard for the compiled API.
 *
 * The API is expected to hard-fail at boot when NODE_ENV=production and
 * BETTER_AUTH_SECRET is unset or empty (see apps/api/src/auth.ts). These
 * tests spawn `node apps/api/dist/index.js` — the same artifact CI builds
 * and the Playwright webServer runs — so they assert on real process
 * behavior, not on unit-test doubles.
 *
 * If apps/api/dist has not been built yet (e.g. a bare checkout), the tests
 * skip instead of false-passing. CI builds the API before running e2e, so
 * the assertions run there.
 *
 * The success case points PGLITE_DATA_DIR at a throwaway temp dir so the
 * test never touches the developer's apps/api/data database. DATABASE_URL is
 * removed for determinism: the compiled API then uses throwaway pglite even
 * in environments that export a database URL.
 */

const API_ENTRY = path.resolve('apps', 'api', 'dist', 'index.js');
const DIST_READY = fs.existsSync(API_ENTRY);
const DIST_SKIP_REASON =
  'apps/api/dist/index.js not found — build the API first (CI runs pnpm --filter @speeko/api build before e2e)';

const HOST = '127.0.0.1';
const API_PORT = 3299;
const API_BASE_URL = `http://${HOST}:${API_PORT}`;
const STARTUP_TIMEOUT_MS = 10_000;
const HEALTHY_STARTUP_TIMEOUT_MS = 30_000;
const SHUTDOWN_TIMEOUT_MS = 5_000;

function buildEnv(overrides: Record<string, string | undefined> = {}): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, HOST, NODE_ENV: 'production' };
  // The spec is exclusively about the production secret guard; make sure no
  // ambient values leak in from the developer machine or CI.
  delete env.BETTER_AUTH_SECRET;
  delete env.DATABASE_URL;
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) delete env[key];
    else env[key] = value;
  }
  return env;
}

function spawnApi(overrides: Record<string, string | undefined>): {
  child: ChildProcess;
  output: () => string;
} {
  // cwd = repo root, matching how CI invokes the compiled API and ensuring
  // dotenv/config cannot accidentally pick up apps/api/.env.
  const child = spawn(process.execPath, [API_ENTRY], {
    env: buildEnv(overrides),
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let captured = '';
  child.stdout?.on('data', (chunk: Buffer) => {
    captured += chunk.toString();
  });
  child.stderr?.on('data', (chunk: Buffer) => {
    captured += chunk.toString();
  });
  return { child, output: () => captured };
}

/** Resolves with the exit code, or null if the process had to be killed after timeoutMs. */
function waitForExit(child: ChildProcess, timeoutMs: number): Promise<number | null> {
  return new Promise((resolve) => {
    if (child.exitCode !== null) {
      resolve(child.exitCode);
      return;
    }
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve(null);
    }, timeoutMs);
    const done = (code: number | null) => {
      clearTimeout(timer);
      resolve(code ?? -1);
    };
    child.once('exit', (code) => done(code));
    child.once('error', () => done(-1));
  });
}

async function waitForHealth(url: string, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) return true;
    } catch {
      // Not up yet — keep polling until the deadline.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return false;
}

test('compiled API refuses to start when BETTER_AUTH_SECRET is unset in production', async () => {
  test.skip(!DIST_READY, DIST_SKIP_REASON);
  const { child, output } = spawnApi({ BETTER_AUTH_SECRET: undefined });
  const code = await waitForExit(child, STARTUP_TIMEOUT_MS);
  expect(code, `expected the process to exit, not time out. Output:\n${output()}`).not.toBeNull();
  expect(code, `expected a non-zero exit code. Output:\n${output()}`).not.toBe(0);
});

test('compiled API refuses to start when BETTER_AUTH_SECRET is empty in production', async () => {
  test.skip(!DIST_READY, DIST_SKIP_REASON);
  const { child, output } = spawnApi({ BETTER_AUTH_SECRET: '' });
  const code = await waitForExit(child, STARTUP_TIMEOUT_MS);
  expect(code, `expected the process to exit, not time out. Output:\n${output()}`).not.toBeNull();
  expect(code, `expected a non-zero exit code. Output:\n${output()}`).not.toBe(0);
});

test('compiled API refuses to start when BETTER_AUTH_SECRET is too short in production', async () => {
  test.skip(!DIST_READY, DIST_SKIP_REASON);
  const { child, output } = spawnApi({ BETTER_AUTH_SECRET: 'short' });
  const code = await waitForExit(child, STARTUP_TIMEOUT_MS);
  expect(code, `expected the process to exit, not time out. Output:\n${output()}`).not.toBeNull();
  expect(code, `expected a non-zero exit code. Output:\n${output()}`).not.toBe(0);
});

test('compiled API starts with a placeholder secret and serves /health', async () => {
  test.skip(!DIST_READY, DIST_SKIP_REASON);
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'speeko-pglite-'));
  const { child, output } = spawnApi({
    BETTER_AUTH_SECRET: 'playwright-placeholder-secret-0123456789abcdef',
    PORT: String(API_PORT),
    PGLITE_DATA_DIR: dataDir,
  });
  try {
    const healthy = await waitForHealth(`${API_BASE_URL}/health`, HEALTHY_STARTUP_TIMEOUT_MS);
    expect(healthy, `API did not become healthy within ${HEALTHY_STARTUP_TIMEOUT_MS}ms. Output:\n${output()}`).toBe(
      true,
    );
    const response = await fetch(`${API_BASE_URL}/health`);
    expect(response.status).toBe(200);
    const body = (await response.json()) as { ok?: boolean };
    expect(body.ok).toBe(true);
  } finally {
    child.kill('SIGTERM');
    await waitForExit(child, SHUTDOWN_TIMEOUT_MS);
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
});
