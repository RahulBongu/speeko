# Speeko — Monitoring and alerting (preparation)

**Status:** hooks and runbook only. No monitoring product is provisioned and no alerts are active. Hosting is deferred.

## Health endpoints

- `GET /health` — returns `{ ok, service, time }`. Use for liveness.
- `GET /locales` — returns supported UI/course locales.
- `GET /api/ai/status` — requires auth; reports whether an AI provider is configured (currently always `false` in this build).

## Structured logging

The API uses Fastify's built-in logger. Logs include method, URL, host, remote address, status code, and response time. Sensitive data (secrets, session cookies, learner answers, message contents) must never be logged. The rate limiter logs only the resolved client IP and the limiter key prefix.

## Alert matrix (to activate after hosting)

| Signal | Severity | Suggested threshold | Action |
|---|---|---|---|
| API `/health` fails | P1 | 2 consecutive failures | Restart service; check logs and DB connectivity |
| 5xx rate | P1 | >1% of requests over 5 min | Inspect recent deploys and error logs |
| Auth failure spike | P2 | >10 failed sign-ins/min from one IP | Check rate limiter and potential brute force |
| Rate-limit 429 spike | P3 | >5% of requests | Review client behavior or raise limits |
| DB connection errors | P1 | any | Check Neon status and connection string |
| Migration failure on startup | P1 | any | Roll back deploy; inspect migration logs |
| Shared rate-limit store failure | P2 | any | Fall back to in-memory; investigate DB |
| Disk/DB size growth | P3 | >80% of plan limit | Review retention and cleanup |
| Mobile sync failures | P3 | repeated | Check API availability and client logs |

## Backup and restore (to be tested after provisioning)

- Database: Neon managed backups (owner to configure retention).
- Restore drill: restore to a fresh database, run migrations, verify `/health` and a sign-in flow.
- Secret rotation: rotate `BETTER_AUTH_SECRET` and `API_PROXY_SECRET` together; re-deploy both services; invalidate sessions.

## Incident response (minimum)

1. Check `/health` and Render/Vercel status pages.
2. Inspect API logs for the failing request path.
3. If DB-related, check Neon dashboard and connection string.
4. Roll back the last deploy if a recent change correlates.
5. Document the incident and the fix in `docs/PROGRESS.md`.

## What is implemented vs. prepared

- **Implemented:** `/health` endpoint, structured request logging, production secret validation, rate-limit response with `Retry-After`, `Cache-Control: no-store` on `/api/*`.
- **Prepared (not active):** alert matrix, backup/restore procedure, secret rotation steps, monitoring runbook. No monitoring product is installed and no alerts fire today.
