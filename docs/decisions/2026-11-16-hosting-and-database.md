# Decision package — hosting and production database

**Status:** **DECIDED 2026-11-18 - Option A** (Neon + Render + Vercel, free
tier) for the internal alpha, with a same-origin proxy on Vercel. Nothing is
provisioned yet; accounts, spend, and secrets remain owner actions.
**Date:** 2026-11-16, decided 2026-11-18. **Scope:** whole product.

## Context and constraints

- **Stack:** Next.js 15 web (SSG-heavy, `/studio` client pages), Fastify 5 API,
  Better Auth (cookie sessions), Drizzle ORM + migrations, pglite in dev, Postgres
  in prod (`DATABASE_URL`), Expo mobile client hitting the same API.
- **Migrations:** `drizzle-kit` (`apps/api`); migrations live in
  `apps/api/drizzle/` and currently apply on API startup.
- **Data characteristics:** small relational tables (users/sessions, lesson
  events — append-only, gem ledger — append-only, follows, profiles), JSONB
  snapshots, plus an apps-asset `dist` folder. No large blobs.
- **Constraints owed:** no costs until the owner authorizes; keep local dev
  zero-setup; secrets never committed; content/audio shipped from repo.
- **Audience:** Indian learners; Singapore/Mumbai/Chennai region preferred
  for latency.

## Working requirements

1. Postgres (or Postgres-compatible) with real transactions, `row locking`
   (`SELECT … FOR UPDATE` is used in shop purchase serialization), unique
   indexes, and JSONB. This excludes SQLite/edge KV and rules out pglite for
   production.
2. Horizontal CI/CD-capable hosts for the web front, the API, and the DB
   (or a single host that can run all three: a small VPS or a PaaS).
3. HTTPS terminated in front of web and API; secure cookies (Better Auth);
   CORS/origin restrictions preserved (`CLIENT_ORIGINS`).
4. Automated backups with a verified restore path (pg_dump or provider backup).
5. Self-healing build/rollout, health checks, and an honest rollback path.
6. Costs within a single-digit monthly range (free or ~$0–10/mo).

## Candidate options

### Option A — managed PaaS trio: Vercel (web) + Render or Fly.io (API) + Neon (Postgres)

- **What it is:** web as Vercel static/edge-rendered Next; API as a Docker
  container on Render/Fly (persists); Postgres serverless on Neon (free tier).
- **Compatibility:** Next is first-class on Vercel; Fastify container deploys
  as-is on Render/Fly (free instances spin down → cold starts 5–20 s first
  request after idle; acceptable for trial, not for end users); Neon is
  Postgres — `SELECT … FOR UPDATE` works.
- **Cost uncertainty:** Neon free $0; Vercel hobby $0 (non-commercial duty —
  check current terms); Render free (sleeps, $7/mo keeps awake) or Fly.io
  ~$3–6/mo per small machine. Expected total: **$0–10/mo**.
- **Region:** nearest available to India (Singapore on Neon; Singapore on
  Render/Fly); fine for the first thousand learners.
- **Backup/recovery:** Neon free includes 7-day point-in-time? (verify current
  tier before launch); pg_dump is a weekly export kept as an artifact.
- **Operational complexity:** low; three dashboards, three env var sets.
  Secrets go in Vercel/Render/Fly env groups; `BETTER_AUTH_SECRET` rotated.
- **Rollback:** git redeploy; DB rolled forward by migrations only.
- **Limits:** free tiers include cold starts, small connections pooling,
  modest RAM; Vercel hobby has no SLA and non-commercial terms.

### Option B — single VPS (Hetzner CX22/21 or DigitalOcean basic droplet) + docker-compose

- **What it is:** one small VM (2 vCPU, 4 GB) running reverse proxy (Caddy
  for automatic HTTPS), Next web, Fastify API, and Postgres in containers.
- **Cost:** €4.51–8/mo fixed; a small domain (≈$10/yr) for secure cookies.
- **Region:** Hetzner Singapore/Helsinki — for India, Singapore is preferred.
- **Compatibility:** perfect — same containers as local dev (`Dockerfile`
  works unchanged); pglite not used; straight Postgres.
- **Viability now:** cheapest fully-authoritative path, but *you* own
  patching, backups, monitoring-downtime, and SSL renewals (Caddy automates).
- **Backup/recovery:** nightly `pg_dump` + off-site copy (Backblaze B2 ~$0.006/GB);
  restore tested quarterly.
- **Operations:** medium — need SSH runbooks, uptime alerts, upgrades.
- **Rollback:** keep prior image tag; revert env/config; forward-only DB.

### Option C — Railway (all-in-one PaaS with Postgres)

- **What it is:** single dashboard; web + API services + managed Postgres
  addon, Docker deploys, automatic HTTPS, private networking.
- **Cost:** hobby $0–5/mo variable usage-based, then ~$5/mo starter + $5 DB.
- **Compatibility:** strong (devcontainers, health checks, private DNS).
- **Backup/recovery:** managed backups with one-click restore (verify tier).
- **Operations:** low; one bill; easy rollback (redeploy prior image).
- **Region:** US/EU/Singapore options.

## Decision (2026-11-18)

**The owner chose Option A for the internal alpha**: Neon free Postgres +
Render free API + Vercel hobby web. Option B remains the recommended shape for
the public release decision. Concretely:

- Now (alpha, free budget): **Neon (free Postgres) + Render (free API, accepts
  cold starts) + Vercel (hobby web)** — zero spend, unblessed for commercial
  terms; good enough to sign off friends/family learners. Accept sleeps.
- Public release candidate: **Option B (one Singapore VPS, Caddy, compose,
  nightly pg_dump, monitoring)** — best value, full custody of data, no
  vendor SLA in the way. Budget: ≈$60–80/yr + $10/yr domain.
- Option C is acceptable instead of A/B if the owner prefers one dashboard;
  it trades $60/yr for meaningfully simpler operations.

**Why the web proxies the API:** `*.vercel.app` and `*.onrender.com` are
different sites, and Better Auth's session cookie is `SameSite=Lax`. A browser
request from the Vercel origin straight to the Render API would not carry the
session, and `SameSite=None` is blocked or partitioned by Safari/Firefox. The
web app therefore calls `/api/*` on its own origin and Next.js proxies it to
Render (`apps/web/middleware.ts`), so the cookie is first-party. No custom
domain is required.

**This decision authorizes no spend and provisions nothing.** Creating the
accounts, setting the secrets, and any upgrade are owner actions. The `.env`
contract below is already supported by the app:

```
# API (apps/api)
PORT=3001
HOST=0.0.0.0
NODE_ENV=production
BETTER_AUTH_SECRET=<32 bytes hex>        # required in prod (API refuses to boot)
BETTER_AUTH_URL=https://api.<domain>
CLIENT_ORIGINS=https://app.<domain>      # comma-separated
DATABASE_URL=postgres://<user>:<pass>@<host>/<db>?sslmode=require
```

```
# Web (apps/web)
# Direct mode (local dev, or a custom domain with same-site subdomains)
NEXT_PUBLIC_API_URL=https://api.<domain>

# Proxy mode (the free Vercel + Render stack; no custom domain required)
NEXT_PUBLIC_API_URL=same-origin
API_PROXY_TARGET=https://<api-host>
```

## Deployment and migration contract

1. Build order: `pnpm --filter @speeko/core build && pnpm --filter @speeko/content build && pnpm --filter @speeko/api build && pnpm build`
2. Migration step (one-shot): `pnpm --filter @speeko/api db:migrate` against
   the prod `DATABASE_URL`; do **not** run API startup migrations against a
   live prod database without a backup immediately before.
3. Keep two servers warm (web, API); pglite is dev-only, never in prod.
4. Static assets: mobile APKs and web bundles are released artifacts, not
   hosting artifacts. `audioUrl` for `listenChoose` is **empty today**; when
   audio is produced it becomes a build-time asset folder behind the same API.
5. Rollback = previous container image + `pg_dump` restore. Migrations are
   forward-only; reverting past a bad migration requires a restore, not `down`.

## Backup and recovery requirements

- **RPO ≤ 24 h** minimum for the alpha (nightly dump); target ≤ 1 h for
  public release (provider PITR or WAL archiving).
- **RTO ≤ 4 h** (restore dump into fresh Postgres, repoint `DATABASE_URL`,
  redeploy API). Runbooks live in `docs/runbooks/` when the owner picks.
- Test one full restore before public release; record date and duration.

## Secrets handling

- Never commit `.env` (`.gitignore` covers); `BETTER_AUTH_SECRET` gets a fresh
  value per environment; web has no secrets beyond the public
  `NEXT_PUBLIC_API_URL`.
- AI providers (`/api/ai/*`) are optional; their keys (if ever used) are API-side
  only, never shipped to clients.

## Costs summary (before owner sign-off)

| Option | First month | Recurring | Risks |
| --- | --- | --- | --- |
| A: Neon+Render+Vercel free | $0 | $0–10/mo | cold starts; hobby non-commercial terms; no SLA |
| B: VPS + domain | $5 | $5–8/mo + $10/yr domain | ops burden; single-host failure |
| C: Railway | $0 trial | $8–15/mo | usage creep |

## Owner actions still required

- Creating the Neon, Render, and Vercel projects; spending in any form.
- Supplying the secrets (`DATABASE_URL`, `BETTER_AUTH_SECRET`,
  `BETTER_AUTH_URL`, `CLIENT_ORIGINS`, plus `API_PROXY_TARGET` on Vercel).
- Choosing a domain and DNS; enabling secure cookies in production.
- Any production `BETTER_AUTH_SECRET` rotation.
- Launching the APK against production.

**Next steps for the owner:** follow `docs/deploy-runbook.md` (Option A step by
step), deploy from `main` after the hosting PR merges, run the smoke tests, then
arrange backups and rotation.
