# Decision package — hosting and production database

**Status:** recommendation only — the owner must authorize any provider
before accounts, resources, spend, or deployments are created.
**Date:** 2026-11-16. **Scope:** whole product (web, API, Postgres, assets).

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

## Recommendation

**Option A for an internal/author-controlled beta; Option B for the public
release decision.** Concretely:

- Now (alpha, free budget): **Neon (free Postgres) + Render (free API, accepts
  cold starts) + Vercel (hobby web)** — zero spend, unblessed for commercial
  terms; good enough to sign off friends/family learners. Accept sleeps.
- Public release candidate: **Option B (one Singapore VPS, Caddy, compose,
  nightly pg_dump, monitoring)** — best value, full custody of data, no
  vendor SLA in the way. Budget: ≈$60–80/yr + $10/yr domain.
- Option C is acceptable instead of A/B if the owner prefers one dashboard;
  it trades $60/yr for meaningfully simpler operations.

**This is a recommendation, not authorization.** Nothing here is provisioned.
The `.env` contract below is already supported by the app:

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
NEXT_PUBLIC_API_URL=https://api.<domain>
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

## Blocked until the owner authorizes

- Selecting a provider; creating accounts; spending in any form.
- Choosing the domain and DNS; enabling secure cookies in production.
- Any production `BETTER_AUTH_SECRET` rotation.
- Launching the APK against production.

**Next decision for the owner:** which option (A/B/C), which provider, which
budget cell ($0 vs ≈$8/mo vs $60/yr), and the production domain.
