# Speeko — post-deployment smoke checklist (owner-run; nothing deployed here)

Run against the deployed **web origin** and **API origin** after provisioning per `docs/deploy-runbook.md`. Use a throwaway test account only. Never use a real learner account, real purchase, or production secret values in chat.

Record PASS/FAIL plus status codes and screenshots in a local owner log (for example `docs/release/owner-smoke-log.md`). Do not commit that log if it contains account identifiers, tokens or private data — keep it out of the public repository.

## Preconditions to verify without printing values

- Required names present in each environment: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CLIENT_ORIGINS`, `TRUST_PROXY_HOPS`, `API_PROXY_TARGET`, `API_PROXY_SECRET` on web + API; optional `AI_API_KEY` / `AI_API_URL` (see gate 7). `.env.example` files are placeholder-only.
- `BETTER_AUTH_SECRET` is at least 32 chars in production (startup guard already tested in `tests/e2e/production-env.spec.ts`).
- API uses HTTPS, web uses the same-origin `/api` proxy in production, `CLIENT_ORIGINS` is the exact web origin, `TRUST_PROXY_HOPS=1` behind one load balancer.

## Gates

| # | Check | Command / UI | Expected | Evidence |
|---|---|---|---|---|
| 1 | Health | `curl -sS https://<api-origin>/health` | 200 JSON, `ok: true` | Response status + body (no secrets) |
| 2 | Web loads | Open `https://<web-origin>/learn` | Learn dashboard with real course list, no console/page errors | Browser screenshot + console |
| 3 | Auth sign-up | UI sign-up with throwaway account | Redirect to `/learn`, session cookie first-party | Screenshot |
| 4 | Auth refresh | Reload `/account` | Session restored | Screenshot |
| 5 | Answer gate | Complete one lesson correctly and one wrongly | XP/hearts/completion match server; replay is practice-only | Server row IDs, no PII |
| 6 | Shop | View catalogue; do **not** purchase | Honest "needs account" for guests; no fake ownership | Screenshot |
| 7 | Voice gate | Open `/conversation` signed in | `/api/ai/status` reports `available:false`; UI says unavailable; `/api/ai/conversation` returns 503 | Status codes + UI text |
| 8 | Account deletion | Delete the throwaway test account only | 204; old session 401; sign-in fails | Request/response codes |
| 9 | Error handling | Temporarily point client at a bad API origin in a test build | Explainable error + retry, no fake success | Screenshot |
| 10 | Secret leakage | Search deployed JS bundles / logs for configured secret values using the CI script pattern | 0 hits; no tokens or transcripts in logs | Script summary (names only) |
| 11 | CORS | From web origin, call API with cookie | Allowed only for `CLIENT_ORIGINS`; no wildcard in production | Response headers |
| 12 | Rate limit | Repeated writes from one throwaway account | 429 with `Retry-After` | Response headers |
| 13 | Rollback prerequisites | Confirm current migration version and a restorable backup exist | Named backup + documented rollback command | Owner log |

## Rollback and migration safety

Migrations are forward-only. Rollback is by restoring a dump/PITR into a fresh database, not by running down-migrations. Before any migration, confirm a current backup and read `docs/decisions/2026-11-16-release-and-operations.md`.

## Backup restore drill (owner)

Per `docs/monitoring.md` and `docs/deploy-runbook.md`: configure nightly `pg_dump` or provider PITR with encryption and retention; restore into a scratch database, run migrations, verify `/health` and a throwaway sign-in flow; record the date, duration and acceptance result. Until this is actually done, the gate is BLOCKED.
