# Speeko — release operations and decision gates (2026-11-16)

**Scope:** the checklist the owner walks through before any public or internal
release is called real. Nothing here has been executed — items marked `GATE`
need owner sign-off. Every operational rule below can be implemented inside
the existing stack without merging new infrastructure; none of it provisions
anything or spends money today.

Read together with:
- `docs/decisions/2026-11-16-hosting-and-database.md` (option A/B/C; hosting undecided)
- `docs/decisions/2026-11-16-license.md` (license undecided)
- `review/audio-decision-analysis.md` (audio unsolved; 10 blocked `listenChoose`)
- `docs/qa/android-device-qa.md` (Android tooling missing; checklist ready)
- `docs/READINESS.md` (current honest status)

---

## GO / NO-GO gates (all mandatory before public release)

**GATE L — LICENSE.** No LICENSE file exists. The owner picks the code license
and content rights (options in `docs/decisions/2026-11-16-license.md`).
*Until then: release = internal trial only. No store listing, no public repo.*

**GATE H — Hosting.** The owner picks Neon+Render+Vercel (alpha), the VPS
(public), or Railway. All provisioning, DNS, and spend are outside this phase.
*Until then: local-only or owner-hosted proof of concept.*

**GATE A — Audio.** Either (a) record/license audio for the 10 blocked
listenChoose items, or (b) confirm the play-time exclusion is acceptable for
launch (already implemented in `eligibleExercises()`). The owner picks.

**GATE R — Native review.** At least one native reviewer per locale to clear
the 305 draft items for publication (internal AI review is not sign-off).
*Until then: content is draft everywhere; no "reviewed" badge claims.*

**GATE D — Device.** Native Android launch verification of an APK **freshly
rebuilt from this tree**. Blocking items: no JDK on PATH, no AVD, no
system-images, WHPX disabled; the existing `dist/speeko-release.apk` is stale.

**GATE B — Backups.** A tested restore of a `pg_dump`/PITR into a fresh
Postgres must complete before any real user writes data.

**GATE P — Privacy.** PII flow review: account email + name + progress are the
only PII. Ensure rate limiting on auth and any logging that reveals them.

---

## Release checklist (owner or owner-designated operator walks through it)

### 1. Source and build verification
- [ ] `pnpm verify` green (typecheck 6/6, 108 core + 16 content + 56 mobile tests, build 5/5, e2e 130/130).
- [ ] `pnpm lint` clean (0 errors; one documented web `<img>` warning).
- [ ] `pnpm --filter @speeko/mobile build` exports 16 static routes.
- [ ] dist bundle and `apps/web/public/courses` regenerated from tracked sources
      (`pnpm sync:content`) so no stale content artifacts ship.
- [ ] `docs/qa/*.png` refreshed and inspected.

### 2. Environment and configuration
- [ ] `apps/api/.env` on the server contains: `PORT`, `HOST`, `BETTER_AUTH_SECRET`
      (32 bytes, hex), `BETTER_AUTH_URL`, `CLIENT_ORIGINS`, `DATABASE_URL`.
      Generate once with crypto and never commit.
- [ ] `apps/web/.env.local` contains `NEXT_PUBLIC_API_URL` only (no secrets).
- [ ] `apps/mobile/app.json` `extra.apiUrl` / `extra.webOrigin` point at the
      production API / web origin at build time (EAS env or CI override).
- [ ] `NODE_ENV=production` in the server env; pglite is not used there.
- [ ] Drizzle migrations run once (`db:migrate`); `lesson_events` 0002 and
      `lesson_completion_rewards` 0005 were smoke-tested (0005 on a fresh DB and
      on a populated pre-0005 DB). Backfill preserves lifetime XP and never mints
      or removes gems. Never run against a live DB without a current backup.

### 3. Secrets handling
- [ ] `.gitignore` covers `.env`, `.env.local`, `*.log`, `data/`, `dist/`
      (already true; verify with `git status --ignored`).
- [ ] `BETTER_AUTH_SECRET` is regenerated for the production environment.
- [ ] No secret appears in logs; CI logs never echo env (rule of thumb:
      nowhere print request bodies, only statuses).
- [ ] `Content-Security-Policy`/`Permissions-Policy` headers unchanged.

### 4. Rate limiting and abuse guards (owner's call; none are implemented today)
- [ ] Add at least one of: `@fastify/rate-limit` on `/api/auth/*` +
      `/api/shop/purchase`; or an outer proxy (Cloudflare) with per-IP
      throttling. 10 req/min on login, 30/min on purchase is plenty.
- [ ] Confirm `/api/lesson-completions` auth guard still rejects unauthenticated
      callers (`tests/e2e/progress-integrity.spec.ts` shows it does).
- [x] **Replay-reward policy decided and implemented.** `POST
      /api/lesson-completions` earns completion XP and one lesson gem only on
      the first completion per learner/course/lesson (`lesson_completion_rewards`
      unique index). Later attempts with a new `attemptId` are practice-only:
      full grading/SRS history, `xpEarned = 0`, no gem. The claim, event XP, and
      gem are one transaction; same-attempt retries remain idempotent. Verified
      by `tests/e2e/reward-integrity.spec.ts` against the real API+DB.

### 5. Backup and restore
- [ ] Nightly `pg_dump $DATABASE_URL > backups/$(date +%F).sql` into a remote
      store (S3/B2/Neon PITR), retained ≥ 30 days.
- [ ] One-time restore drill: load yesterday's dump into a fresh `pglite` or
      `postgres` instance; query rows for `lesson_events`; verify row count.
- [ ] Record date/duration; keep run in `docs/` after the drill.

### 6. Rollback
- [ ] Keep the prior web/API artifact tagged; revert flow = redeploy the old
      image + point DATABASE_URL to the previous DB (or restore the dump).
- [ ] Forward-only migrations: reverting the server does not auto-run `down`;
      schema is rolled forward by fixes, never backward by accident.

### 7. Post-deployment smoke tests (30 min, host-level)
- [ ] Open `https://<domain>/` — hero renders, no console errors.
- [ ] Sign up `smoke-${ts}@example.com`; complete one lesson signed-in; server
      returns 201 with a real `attemptId` (do not reuse).
- [ ] `GET /api/gems` — balance ≥ 5 (lesson gems); `POST /api/shop/purchase`
      rejects unaffordable item honestly.
- [ ] Sign out; cookie cleared; `GET /api/progress` → 401.
- [ ] `GET /api/habits` — event-derived; calendar not empty; streak ≥ 1.
- [ ] `GET /api/leagues` — honest early-community state (< 10 learners).

### 8. Logging
- [ ] Confirm `GET /health` has no user data in logs.
- [ ] No logging of `answers`, progress JSON payloads, or auth headers.
- [ ] Auth failures logged as
      `user=unknown ip=<sha256(ip)> status=401 reason=invalid`.

### 9. Product claims accountability
- [ ] No screenshot, marketing line, or store blurb says "master Hindi" or
      "reviewed content" while the draft labels are in place.
- [ ] Every lesson the app plays is traceable to a tracked source JSON file.

---

## What is NOT pending (i.e., done, do not redo)

- Server-verified rewards with `attemptId` idempotency and one-time
  first-completion XP/gems per learner/course/lesson; profile stats derived from
  the reward ledger and streaks from `lesson_events`; shop ledger with per-user
  serialization.
- Playable-queue exclusion of listenChoose-with-no-audio (`eligibleExercises`).
- AI-assisted structural + linguistic audit — record kept in `review/`.
- Mobile Jest + Playwright CI equivalents — runs locally via turbo.