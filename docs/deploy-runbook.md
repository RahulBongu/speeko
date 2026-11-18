# Speeko — Alpha Deployment Runbook

Audience: owner/operator deploying a fresh environment or an alpha refresh.
References: `docs/decisions/2026-11-16-hosting-and-database.md`, `docs/decisions/2026-11-16-release-and-operations.md`, `docs/decisions/2026-11-16-license.md`.

## Preconditions

- License decided and committed (Gate L: Apache-2.0 code, All Rights Reserved content/brand, OFL-1.1 font text); the web artifact now ships the texts at `/licenses/*` (auto-built). Mobile bundling remains a packaging step.
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
```

Web at build time:

```
# Direct mode (local dev, or a custom domain with same-site subdomains)
NEXT_PUBLIC_API_URL=https://<api-origin>

# Same-origin proxy mode (the free Vercel + Render stack)
NEXT_PUBLIC_API_URL=same-origin
API_PROXY_TARGET=https://<api-origin>
```

Release signing (Android): `SPE_RELEASE_*` variables must point at a copy of `release.keystore` stored in CI/KMS - **never** in the repo (the keystore currently sits in the gitignored `apps/mobile/android/` tree; the owner must move it before any public release).

Store-bound packages must be built from a fresh tree: `npx expo prebuild --platform android --clean` with `SPEEKO_QA_LOOPBACK_CLEARTEXT` unset, then `./gradlew bundleRelease`, and verify the AAB does NOT carry the loopback network security config. The alpha AAB in the local build cache was produced from the QA-enabled tree.

Every distributed artifact must also carry the license texts: include `LICENSE`, `LICENSE-CONTENT`, `NOTICE`, and `apps/web/public/fonts/OFL.txt` in the package (or expose them in an in-app licenses screen) before giving it to anyone outside the project. Apache-2.0 section 4 requires recipients to receive a copy of the License.

## Option A — free alpha stack (Neon + Render + Vercel)

**Why the web proxies the API:** `*.vercel.app` and `*.onrender.com` are
different sites, and Better Auth's session cookie is `SameSite=Lax`. A browser
request from the Vercel origin straight to the Render API would not carry the
session, and `SameSite=None` is blocked or partitioned by Safari/Firefox. The
web app therefore calls `/api/*` on its own origin and Next.js proxies it to
Render (`apps/web/next.config.mjs`), so the cookie is first-party. No custom
domain is required.

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

   Deploy. Startup applies migrations; the log must show
   "Database migrations applied." Free services sleep after inactivity, so the
   first request can take ~30–60 s.
3. **Web (Vercel, hobby).** Import the repository with Root Directory
   `apps/web`, enable **Include source files outside of the Root Directory**,
   and keep Framework `Next.js`. Build Command:
   `pnpm --filter @speeko/core build && pnpm build`. Set these Production
   environment variables **before** building (both are compiled in):
   - `NEXT_PUBLIC_API_URL=same-origin`
   - `API_PROXY_TARGET=https://<api-host>`

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

**Known alpha limitation — rate limiting behind the proxy.** The API keys
`/api/auth/*` on `request.ip` and does not trust proxy headers. On Render the
socket peer is the platform proxy, so the 60/min auth budget is shared by the
whole service (direct mobile traffic has the same property). That is acceptable
for a small controlled alpha. Before widening access, make the limiter
proxy-aware using explicit trusted hops and verify `X-Forwarded-For` against
Render's documented chain — do not trust arbitrary client-supplied headers on a
publicly reachable API.

## Build order

1. `pnpm install --frozen-lockfile`
2. `pnpm build` (web + API + mobile export)
3. `pnpm check:secrets` — must pass; the build does not ship otherwise
4. `pnpm typecheck && pnpm test && pnpm e2e` — all green before any deploy
5. Confirm `apps/api/data` does NOT exist or is the throwaway PGlite (dev only); with `DATABASE_URL` set, PGlite is unused

## Deploy

1. Apply migrations on the target DB: start the API once (`node apps/api/dist/index.js`) — it runs `drizzle-kit` migrations at boot (log: "Database migrations applied.") and stays up.
2. Smoke-test: `curl https://<api-origin>/health` → `{ "ok": true, ... }`
3. Set the web build variables (`NEXT_PUBLIC_API_URL`, plus `API_PROXY_TARGET` in proxy mode) and rebuild the web bundle
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
