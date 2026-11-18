# Speeko — Alpha Deployment Runbook

Audience: owner/operator deploying a fresh environment or an alpha refresh.
References: `docs/decisions/2026-11-16-hosting-and-database.md`, `docs/decisions/2026-11-16-release-and-operations.md`, `docs/decisions/2026-11-16-license.md`.

## Preconditions

- LICENSE signed and committed (Gate L)
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
NEXT_PUBLIC_API_URL=https://<api-origin>
```

Release signing (Android): `SPE_RELEASE_*` variables must point at a copy of `release.keystore` stored in CI/KMS - **never** in the repo (the keystore currently sits in the gitignored `apps/mobile/android/` tree; the owner must move it before any public release).

Store-bound packages must be built from a fresh tree: `npx expo prebuild --platform android --clean` with `SPEEKO_QA_LOOPBACK_CLEARTEXT` unset, then `./gradlew bundleRelease`, and verify the AAB does NOT carry the loopback network security config. The alpha AAB in the local build cache was produced from the QA-enabled tree.

Every distributed artifact must also carry the license texts: include `LICENSE`, `LICENSE-CONTENT`, `NOTICE`, and `apps/web/public/fonts/OFL.txt` in the package (or expose them in an in-app licenses screen) before giving it to anyone outside the project. Apache-2.0 section 4 requires recipients to receive a copy of the License.

## Build order

1. `pnpm install --frozen-lockfile`
2. `pnpm build` (web + API + mobile export)
3. `pnpm check:secrets` — must pass; the build does not ship otherwise
4. `pnpm typecheck && pnpm test && pnpm e2e` — all green before any deploy
5. Confirm `apps/api/data` does NOT exist or is the throwaway PGlite (dev only); with `DATABASE_URL` set, PGlite is unused

## Deploy

1. Apply migrations on the target DB: start the API once (`node apps/api/dist/index.js`) — it runs `drizzle-kit` migrations at boot (log: "Database migrations applied.") and stays up.
2. Smoke-test: `curl https://<api-origin>/health` → `{ "ok": true, ... }`
3. Point the web app's `NEXT_PUBLIC_API_URL` at the API and rebuild the web bundle
4. Verify the web `/` loads and `/learn` returns a course list
5. Rollback: keep the previous tag; redeploy the previous tag and restart

## Backups and rotation

- Enable PITR or nightly `pg_dump` on the database; run one full restore drill in a scratch project and keep the log
- Rotate `BETTER_AUTH_SECRET` only with both API instances stopped; all sessions are invalidated on rotation (expected)
- Release keystore: never commit, never share; keep one encrypted backup outside this machine
- `git log --all -S BETTER_AUTH_SECRET` over the repo must return nothing

## Smoke tests after deploy

- `curl -si https://<api-origin>/api/courses` → 200 + `Cache-Control: no-store`
- Sign-up flow in an incognito window; one full lesson; check the completion reward lands once (not twice)
- Check `/health` from the web host *and* from outside

## What this runbook cannot do for you

LICENSE choice, hosting selection, native-speaker review of the curriculum, audio licensing, store accounts, secrets custody. See the decision packages before first public contact.
