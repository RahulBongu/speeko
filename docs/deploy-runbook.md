# Speeko — Alpha Deployment Runbook

Audience: owner/operator deploying a fresh environment or an alpha refresh.
References: `docs/decisions/2026-11-16-hosting-and-database.md`, `docs/decisions/2026-11-16-release-and-operations.md`, `docs/decisions/2026-11-16-license.md`.

## Preconditions

- License decided and committed (Gate L: Apache-2.0 code, All Rights Reserved content/brand, OFL-1.1 font text); the web artifact ships the texts at `/licenses/*` (auto-built) and the mobile app ships an in-app `/licenses` screen from a generated bundle guarded by `pnpm check:licenses`. Rebuild the signed Android artifact to include it.
- Hosting authorized; a Postgres database exists and the operator has its connection string (Gate H)
- Final app origin(s) known (web URL + API URL)

## Environment

API (`apps/api/.env` equivalent on the host — set in the platform's secret store, never in the repo):

```
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
BETTER_AUTH_SECRET=<32+ random bytes; generate: openssl rand -hex 32>
DATABASE_URL=<postgres connection string, verified once with psql>
CLIENT_ORIGINS=https://<web-origin>
BETTER_AUTH_URL=https://<api-origin>
# Render terminates TLS and forwards from one load-balancer hop.
# 0 (default) ignores X-Forwarded-For; 1 trusts exactly that one hop.
TRUST_PROXY_HOPS=1
# Required only when the web origin proxies /api/* (Option A).
# Must equal the Vercel-side value; 32+ random characters.
API_PROXY_SECRET=<openssl rand -hex 32>
```

Web at build time:

```
# Direct mode (local dev, or a custom domain with same-site subdomains)
NEXT_PUBLIC_API_URL=https://<api-origin>

# Same-origin proxy mode (the free Vercel + Render stack)
NEXT_PUBLIC_API_URL=same-origin
API_PROXY_TARGET=https://<api-origin>
API_PROXY_SECRET=<same value as the API>
```

Release signing (Android): `SPE_RELEASE_*` variables must point at a copy of `release.keystore` stored in CI/KMS - **never** in the repo (the keystore currently sits in the gitignored `apps/mobile/android/` tree; the owner must move it before any public release).

Store-bound packages must be built from a fresh tree: `npx expo prebuild --platform android --clean` with `SPEEKO_QA_LOOPBACK_CLEARTEXT` unset, then `./gradlew bundleRelease`, and verify the AAB does NOT carry the loopback network security config. The alpha AAB in the local build cache was produced from the QA-enabled tree.

Every distributed artifact must also carry the license texts. The web bundle includes them at `/licenses/*`, and the mobile app includes an in-app `/licenses` screen backed by `apps/mobile/assets/licenses/licenses.json`. Rebuild and sign the Android artifact after any license-text change; `pnpm check:licenses` fails the build if the mobile bundle drifts. Apache-2.0 section 4 requires recipients to receive a copy of the License.

## Option A — free alpha stack (Neon + Render + Vercel)

**Why the web proxies the API:** `*.vercel.app` and `*.onrender.com` are
different sites, and Better Auth's session cookie is `SameSite=Lax`. A browser
request from the Vercel origin straight to the Render API would not carry the
session, and `SameSite=None` is blocked or partitioned by Safari/Firefox. The
web app therefore calls `/api/*` on its own origin and a Next.js middleware
proxies it to Render (`apps/web/middleware.ts`), so the cookie is first-party.
No custom domain is required.

The proxy also solves client-IP loss. Vercel overwrites `X-Forwarded-For` and
does not forward the external client IP, so a plain rewrite would make every
browser request look like one Vercel egress IP and collapse the rate-limit
budget. The middleware instead stamps `x-speeko-client-ip` plus a shared
`x-speeko-proxy-secret`; the API trusts that pair only when it matches
`API_PROXY_SECRET`. If `API_PROXY_SECRET` is unset or the value is wrong, the
API ignores both headers and falls back to the socket peer, so a spoofed header
can never bypass or poison a limit.

1. **Database (Neon, free).** Create a project in the Singapore region and copy
   the **direct** connection string (not the pooled endpoint; migrations need a
   direct connection). Append `?sslmode=require` if it is not already present.
2. **API (Render, free).** New Blueprint → this repository; Render reads
   `render.yaml`. Set:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | the Neon direct connection string |
   | `BETTER_AUTH_SECRET` | `openssl rand -hex 32` (generate locally; never commit or paste it into chat) |
   | `BETTER_AUTH_URL` | `https://<api-host>` (Render's assigned host) |
   | `CLIENT_ORIGINS` | the exact web origin, e.g. `https://<web-host>` (no trailing slash) |
   | `TRUST_PROXY_HOPS` | `1` (Render forwards from one load-balancer hop) |
   | `API_PROXY_SECRET` | `openssl rand -hex 32`; must equal the Vercel value (generate locally; never commit or paste it into chat) |

   Deploy. Startup applies migrations; the log must show
   "Database migrations applied." Free services sleep after inactivity, so the
   first request can take ~30–60 s.
3. **Web (Vercel, hobby).** Import the repository with Root Directory
   `apps/web`, enable **Include source files outside of the Root Directory**,
   and keep Framework `Next.js`. Build Command:
   `pnpm --filter @speeko/core build && pnpm build`. Set these Production
   environment variables (Vercel applies them to both build and runtime):
   - `NEXT_PUBLIC_API_URL=same-origin`
   - `API_PROXY_TARGET=https://<api-host>`
   - `API_PROXY_SECRET=<same value as Render>`

   Deploy.
4. **Verify.** `curl -i https://<web-host>/api/courses` must return `200`
   through the proxy. In the browser: sign up, complete a lesson, and reload —
   the session must survive. DevTools → Application → Cookies must show the
   session on the **web** origin with no cross-site warning.
5. **Rollback.** Redeploy the previous Render and Vercel deployments.
   Migrations are forward-only; restore a dump/PITR to go back.

**Cold starts are the known cost.** Render free sleeps after 15 minutes and
Neon free suspends idle compute; the first request after idle is slow. If that
is unacceptable, upgrade the Render service or move to Option B. If a custom
domain is added later, host the web on `app.<domain>` and the API on
`api.<domain>`: they are same-site, so `NEXT_PUBLIC_API_URL` can point directly
at the API and `API_PROXY_TARGET` can be removed.

**Rate limiting behind the proxy.** Browser traffic is keyed on the
middleware-stamped client IP, verified against `API_PROXY_SECRET`. Direct
traffic to the Render host is keyed on the client address derived from exactly
one trusted proxy hop (`TRUST_PROXY_HOPS=1`). With `TRUST_PROXY_HOPS=0` the API
ignores `X-Forwarded-For` and keys on the socket peer, which is correct on a
directly exposed host but shares one budget when a platform proxy sits in
front. Keep the hop count aligned with the actual deployment topology; never
raise it to trust arbitrary client-supplied chains. The in-memory limiter is
per-process, so horizontal scaling needs a shared store before launch.

### Scalability note (not required for the alpha)

The current limiter is in-memory and per process. On a single Render instance
(the alpha plan) this is correct and simple. If the service is ever scaled
horizontally, each instance would keep its own counters and the effective limit
would multiply by the instance count. Options, in order of preference:

1. Keep single-instance for the alpha and small scale (recommended).
2. Database-backed counters using the existing Postgres/Neon connection with an
   atomic `INSERT ... ON CONFLICT ... DO UPDATE` window row and TTL. Adds DB
   load but no new service. Requires a migration and cleanup of expired rows.
3. External Redis — not provisioned in this project; adds a dependency and cost.
   Only justified at meaningful scale.

The proxy-aware IP resolution (`x-speeko-client-ip` + `API_PROXY_SECRET`) is
independent of the store choice and remains correct in all cases. No store is
provisioned or required for the alpha.

## Build order

1. `pnpm install --frozen-lockfile`
2. `pnpm build` (web + API + mobile export)
3. `pnpm check:secrets` — must pass; the build does not ship otherwise
4. `pnpm typecheck && pnpm test && pnpm e2e` — all green before any deploy
5. Confirm `apps/api/data` does NOT exist or is the throwaway PGlite (dev only); with `DATABASE_URL` set, PGlite is unused

## Deploy

1. Apply migrations on the target DB: start the API once (`node apps/api/dist/index.js`) — it runs `drizzle-kit` migrations at boot (log: "Database migrations applied.") and stays up.
2. Smoke-test: `curl https://<api-origin>/health` → `{ "ok": true, ... }`
3. Set the web build variables (`NEXT_PUBLIC_API_URL`, plus `API_PROXY_TARGET` and `API_PROXY_SECRET` in proxy mode) and rebuild the web bundle
4. Verify the web `/` loads and `/learn` returns a course list
5. Rollback: keep the previous tag; redeploy the previous tag and restart

## Backups and rotation

- Enable PITR or nightly `pg_dump` on the database; run one full restore drill in a scratch project and keep the log
- Rotate `BETTER_AUTH_SECRET` only with both API instances stopped; all sessions are invalidated on rotation (expected)
- Release keystore: never commit, never share; keep one encrypted backup outside this machine
- `git log --all -S BETTER_AUTH_SECRET` over the repo must return nothing

## Smoke tests after deploy

- `curl -si https://<api-origin>/api/courses` → 200 + `Cache-Control: no-store`
- In proxy mode, `curl -si https://<web-origin>/api/courses` → 200 through the web origin
- Sign-up flow in an incognito window; one full lesson; check the completion reward lands once (not twice)
- Reload after sign-in; the session must survive, and the session cookie must be stored on the web origin (proxy mode)
- Check `/health` from the web host *and* from outside

## What this runbook cannot do for you

Provider accounts and spend, native-speaker review of the curriculum, audio licensing, store accounts, and secrets custody. The license and hosting options are decided; see the decision packages before first public contact.
