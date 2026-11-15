# Speeko — Progress

Living status document. One phase per session; a phase is done only when
`pnpm verify` is green **and** the generated screenshots have been inspected.
The audit that establishes ground truth lives in [`AUDIT.md`](./AUDIT.md);
durable choices live in [`DECISIONS.md`](./DECISIONS.md).

**Updated:** 2026-11-15

## Phase status

| Phase | Scope | Status |
| --- | --- | --- |
| P0 — Audit | Ground truth, feature map, risks, README corrections | **Done** — `9e7ae9b`, branch `phase/0-audit` |
| P1 — Safety net | `pnpm verify`, Playwright smoke + screenshots, ESLint, snapshot v2 + v1 migration | **Done** — `68b6e18`, branch `phase/1-safety-net` |
| P2 — Server-verified rewards | Lesson-completion endpoint, server re-grade, append-only events, `attemptId` idempotency, signed-in save UI | **Done** — `4f514ad`, branch `phase/2-server-rewards` |
| P3 — Onboarding + path | Onboarding flow, course switcher, unit guidebook, review/chest/checkpoint path nodes, continue button | **Done** — branch `phase/3-onboarding-path` |

Next phase is selected by the owner; P4 is not started. Later phases (content
depth, SRS, economy, social, settings, mobile parity) follow the master plan.
Hosting is deferred by the owner until the UI/product phases are done.

## Verification snapshot (P3)

Run from the repo root:

| Command | Result |
| --- | --- |
| `pnpm typecheck` | 6/6 Turbo tasks (5 package typechecks + dependency builds) |
| `pnpm test` | 76 tests — 65 core + 11 content |
| `pnpm build` | 5/5 Turbo tasks |
| `pnpm lint` | Passes; one intentional `<img>` warning in the lesson player |
| `pnpm e2e` | 48 Playwright checks (11 routes × 2 viewports, rewards × 2, onboarding × 2) |
| `pnpm verify` | typecheck → test → build → e2e, all green |

Visual evidence: 30 screenshots in [`docs/qa/`](./qa/), plus desktop and
mobile contact sheets. P3 added `onboarding-language`, `guidebook-hi-starter-unit-1`,
and `onboarding-first-lesson` at both viewports; all were inspected.

## What P3 changed

- **Onboarding is a real route flow.** `/onboarding` redirects to `/onboarding/language`;
  language, motivation, level, daily goal, and commitment are separate direct URLs with
  Back and deep links working. Commitment starts the first lesson immediately. A new
  guest reaches a real lesson in six taps from the landing CTA; existing guests and
  returning learners are routed to their course instead.
- **Onboarding state is local and honest.** Draft and completion live in
  `speeko.onboarding.v1`; daily goal is saved into the normal progress snapshot, the
  IANA time zone is captured, and no account is required to start.
- **Course switcher in the path header.** Switching course routes to that path and
  updates `lastCourseId`; browser Back returns to the previous course.
- **Every unit has a chest and a review node.** The chest opens an honest guidebook
  recap built from the exercise items; review opens the existing SRS review session.
- **Checkpoints are practice-only.** After units 2 and 4, a locked or unlocked
  checkpoint node appears. It stays locked until every prior lesson is complete; when
  unlocked it launches deterministic practice from prior units with no XP and no course
  progress write.
- **Unit guidebook route.** `/learn/[courseId]/guidebook/[unitIndex]` extracts target
  items and prompts straight from the course JSON, splitting pair exercises into their
  individual words instead of showing fused strings.

## What P2 changed

- **One grading rule set.** `packages/core/src/attempt.ts` re-grades raw
  `AnswerInput` values in canonical lesson order with the same XP, combo,
  hearts, accuracy, and SRS rules the player uses. `recordCompletion` and
  `recordCompletionAndReviews` moved into core so web and API share them.
- **Server-verified completion.** `POST /api/lesson-completions` requires a
  session, loads authoritative tracked course JSON, re-grades, and returns the
  resulting snapshot plus event. Status codes: `201` new, `200` duplicate,
  `409` attemptId reused for another lesson, `422` invalid/incomplete/failed
  attempt, `401` unauthenticated, `404` unknown course/lesson, `400` malformed
  payload.
- **Append-only rewards.** `lesson_events` stores the graded answers, XP,
  accuracy basis points, hearts, max combo, and timestamps. A unique index on
  `(user_id, attempt_id)` makes retries safe; no update or delete path exists.
  Migration `0002` was smoke-tested against a fresh pglite directory.
- **Signed-in client path.** The player captures raw answers and a stable
  attempt id, sends them at the summary, and displays the server snapshot. On
  network/session failure it shows **Reward not saved** with Retry and does not
  award local XP. If the session check itself fails, a browser that was signed
  in fails closed while a first-time guest can still save locally. Guests and
  review sessions remain fully offline-capable.
- **`PUT /api/progress`** still imports guest snapshots and merges across
  devices, but it is explicitly non-authoritative. Future leagues/quests/gems
  must derive from lesson events.
- **Coverage.** Seven core scoring/review tests plus five reward Playwright
  checks per viewport: unauthenticated rejection, server re-grade, idempotent
  retry, attemptId mismatch, incomplete attempt, signed-in save, and failed-save
  Retry.

## Known gaps after P3

These are product gaps, not regressions. Details and evidence are in
[`AUDIT.md`](./AUDIT.md).

- Chest nodes are honest recap entry points; there is no gem/shop reward yet. Checkpoint
  nodes are practice-only and never write lesson progress or XP. The real gem economy
  is P7.
- Onboarding stores preferences, but does not enable reminders or adapt content; those
  belong to later habit/SRS phases.
- Review and checkpoint sessions update SRS locally without a `lesson_events` row. SRS
  is simplified SM-2, not the mandated Leitner 1/2/4/8/16 boxes.
- `timeZone` is captured on onboarding and stored, but day boundaries still use the
  browser/server local day. Timezone-aware days are a later phase.
- Content is 4 units / 8 lessons / 24 exercises per course (240 exercises). There is no
  `reviewStatus` field yet; new Indic content becomes `draft` from P4 onward.
- Mobile remains a branded welcome screen. The release APK exists at
  `dist/speeko-release.apk` but has not been launch-verified on hardware.
- No `LICENSE`; the repo is currently all rights reserved by default.

## Re-running the safety net

```bash
pnpm install
pnpm verify          # typecheck + test + build + e2e
pnpm lint            # web + mobile
```

Screenshots are written to `docs/qa/<project>/`. The e2e config reuses an
already-running dev server outside CI, but a fresh `pnpm build` is required
because Playwright starts the production web server and the compiled API.
