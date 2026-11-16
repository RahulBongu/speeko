# Speeko — Progress

Living status document. One phase per session; a phase is done only when
`pnpm verify` is green **and** the generated screenshots have been inspected.
The audit that establishes ground truth lives in [`AUDIT.md`](./AUDIT.md);
durable choices live in [`DECISIONS.md`](./DECISIONS.md).

**Updated:** 2026-11-16

## Phase status

| Phase | Scope | Status |
| --- | --- | --- |
| P0 — Audit | Ground truth, feature map, risks, README corrections | **Done** — `9e7ae9b`, branch `phase/0-audit` |
| P1 — Safety net | `pnpm verify`, Playwright smoke + screenshots, ESLint, snapshot v2 + v1 migration | **Done** — `68b6e18`, branch `phase/1-safety-net` |
| P2 — Server-verified rewards | Lesson-completion endpoint, server re-grade, append-only events, `attemptId` idempotency, signed-in save UI | **Done** — `4f514ad`, branch `phase/2-server-rewards` |
| P3 - Onboarding + path | Onboarding flow, course switcher, unit guidebook, review/chest/checkpoint path nodes, continue button | **Done** - branch `phase/3-onboarding-path` |
| P4 - Content pipeline | Schema additions, validator rules, importer, one 5x5 draft pilot course, Studio draft badges | **Done** - branch `phase/4-content-pipeline` |
| P5 - Practice hub | Leitner SRS 1/2/4/8/16 with read-time SM-2 migration, `/practice` hub, due/trouble/unit practice modes, practice-only sessions | **Done** - branch `phase/5-practice-hub` |

P6 (habit systems) is next and is not started. Later phases (gems/shop, leagues,
mobile parity, stories, hardening) follow the master plan. Hosting is deferred by
the owner until the UI/product phases are done.

## Verification snapshot (P5)

Run from the repo root:

| Command | Result |
| --- | --- |
| `pnpm typecheck` | 6/6 Turbo tasks (5 package typechecks + dependency builds) |
| `pnpm test` | 84 tests — 73 core + 11 content (255 exercises graded) |
| `pnpm build` | 5/5 Turbo tasks |
| `pnpm lint` | Passes; one intentional `<img>` warning in the lesson player |
| `pnpm e2e` | 62 Playwright checks across routes, onboarding, rewards, and practice |
| `pnpm verify` | typecheck → test → build → e2e, all green |

Visual evidence: 38 screenshots in [`docs/qa/`](./qa/), plus desktop and mobile
contact sheets. P5 added the practice hub and the three practice summaries at
both viewports.

## What P5 changed

- **SRS is Leitner 1/2/4/8/16.** A miss returns a card to box 1 for tomorrow; a
  correct answer moves it one box forward, capped at box 5. Legacy SM-2 cards
  are normalised on read to the nearest box from their old interval, with
  `dueAt` preserved. Stored v1 data is never rewritten.
- **Practice hub at `/practice`.** Due, trouble, and long-term counts, box
  distribution, and per-unit entry points are computed only from SRS cards that
  map to completed lessons. A fresh learner sees an honest empty state; unseen
  units stay locked. The header now links to Practice on desktop and mobile.
- **Three real practice modes.** Due review, trouble words (`lapses > 0`), and
  per-unit practice. Unit practice mixes exercises round-robin across that
  unit's completed lessons and never reveals unfinished lessons.
- **Practice is practice-only.** Synthetic modes write no completion record, no
  XP, and no `lesson_events` row. Feedback says "Review scheduled" instead of an
  XP amount. Answers still update the SRS schedule; finished sessions sync
  through the existing snapshot layer.
- **Coverage.** Six core practice-planning tests, Leitner/migration tests, and
  twelve Playwright checks (six flows × two viewports): empty hub, populated
  counts and locks, due review, trouble words, unit practice, and locked-unit
  explanation. Each completion test asserts XP and completion records did not
  change.
- **P4 validator fix.** The duplicate-`vocabId` rule was removed: `vocabId` is a
  vocabulary-item identity and is intentionally repeated by the exercises that
  practice one word. Unit/lesson/exercise IDs remain unique.

## What P4 changed

- **Content schema additions.** Exercises now support `vocabId` and `transliteration`; units and lessons support `guidebook`; lessons, units, and courses support `reviewStatus` (`draft`/`reviewed`) plus optional `reviewer`. New fields are optional or defaulted, so existing courses still validate.
- **Validator rules.** `validateCourseFile` now checks duplicate IDs, duplicate vocab IDs, and requires a reviewer for any `reviewed` scope.
- **Importer.** `importCourseFromPhrases` converts a normalized open-licensed phrase list into a draft course, and the CLI gained an `import` command. Output is always `reviewStatus: "draft"`. `ATTRIBUTIONS.md` documents the intended source and licensing.
- **Pilot course.** `content/hi/hi-pilot.json` is a 5 unit x 5 lesson draft course (75 exercises), with `reviewStatus: "draft"` on every lesson. Content grading now checks 255 exercises.
- **Studio flags drafts.** The course list shows a Draft/Reviewed badge from the manifest, which now includes `reviewStatus`.

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

## Known gaps after P5

These are product gaps, not regressions. Details and evidence are in
[`AUDIT.md`](./AUDIT.md).

- Practice SRS updates sync through the snapshot layer (`PUT /api/progress`),
  not `lesson_events`. Practice has no authoritative server-side event log yet;
  that belongs with the later hardening/social phases.
- Trouble words are historical: once a card has a lapse it stays available for
  another pass. There is no "retired" state or automatic clearing.
- Unit practice can include two exercises for the same word, so one session may
  advance that card more than one box. Due and trouble plans use one exercise
  per skill.
- Chest nodes are honest recap entry points; there is no gem/shop reward yet.
  The real gem economy is P7, and leagues remain gated by D2.
- `timeZone` is captured on onboarding and stored, but day boundaries still use
  the browser/server local day. Timezone-aware days are a later phase.
- No course has been reviewed by a native speaker. The two Hindi courses
  (starter + pilot) are `reviewStatus: "draft"`, and the importer remains a
  utility rather than a full open-data pipeline with provenance checks.
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
