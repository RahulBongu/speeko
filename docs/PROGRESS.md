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
| P6 - Habit systems | Daily goal setting, event-derived quests, 12-week streak calendar + freezes, achievements, `/habits` page | **Done** - `phase/6-habit-systems` |
| P7 - Gems + shop | Gem ledger, shop, original fox cosmetics, inventory | **Done** - `phase/7-gems-shop` |
| P8 - Leagues + social | Weekly standings, promotion/demotion zones, early-community state, profiles, follow by username | **Done** - `phase/8-leagues-social` |
| P9 - Mobile parity | Account + sync, path, lesson, practice, quests, motion layer | **Done** - `phase/9-mobile-parity` |
| P10 - Stories + conversation | Honest unavailable/coming-soon states, optional AI endpoint | **Done** - `phase/10-stories-conversation` |
| P11 - Hardening | Accessibility, reduced motion, offline/error states | **Done** - `phase/11-hardening` |

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

## What P9 changed

- **Mobile routes.** Expo Router now has sign-in, sign-up, learn, path, lesson, account, habits, and the existing welcome screen. Courses load through new API endpoints `/api/courses` and `/api/courses/:id`.
- **Lesson runner.** A basic mobile lesson runner supports choice and text exercises, grades with shared core rules, tracks hearts, and submits verified completions to the API.
- **Account and sync.** The account screen reads the cloud progress snapshot; sign-in and sign-up use Better Auth.
- **Motion.** The welcome screen keeps its Reanimated bob/entrance and haptic CTA; other screens use native layout without web-only dependencies.
- **Limitations.** Mobile progress is not persisted locally between launches, practice/shop/leagues/people are not yet ported, and exercise kinds beyond choice/text are skipped. Full parity remains a follow-up.
- **Coverage.** Mobile typecheck and export build pass. Web verification remains 95 core + 11 content tests and 96 Playwright checks.

## What P8 changed

- **Social schema.** `user_profiles` stores a unique username, display name, and bio; `follows` stores follower/followee pairs. Migration `0004_leagues_social.sql` adds both tables.
- **Profiles on demand.** `ensureProfile` creates a profile the first time a learner touches a social route, with a collision-safe username. `/api/profiles/me`, `/api/profiles/:username`, and `/api/profiles/search` expose real stats from progress snapshots and verified lesson events.
- **Follow by username.** `POST/DELETE /api/follows` follow or unfollow a real learner. Profile pages show follower/following counts and a working follow button.
- **Weekly leagues.** `/api/leagues` aggregates verified lesson events since Monday in Asia/Kolkata, ranks real learners by weekly XP, and reports promotion/demotion zones. Under 10 active learners it reports an honest early-community state instead of a league.
- **Web pages.** `/leagues`, `/people`, and `/profile/[username]` show standings, search, and profiles. The header links to Leagues.
- **Coverage.** 95 core tests, 11 content tests, and 92 Playwright checks. Six social checks cover unauthenticated access, profile creation, follow/unfollow, and the early-community report.

## What P7 changed

- **Gem ledger.** `gem_ledger` is append-only with a per-user `sourceKey` idempotency key. Lessons award +5 gems, completed daily quests award +10 gems, and purchases subtract their price. `GET /api/gems` returns the derived balance and recent ledger.
- **Quest gems.** `awardQuestGems` runs after a verified lesson and on gem/shop reads, crediting completed daily quests idempotently. Weekly quests remain progress-only.
- **Shop API.** `GET /api/shop` returns the catalog, balance, owned quantities, and affordability. `POST /api/shop/purchase` serializes per user with `SELECT ... FOR UPDATE`, checks balance/ownership/freeze capacity, writes the ledger and inventory, and returns honest 409 states. Duplicate request keys replay instead of charging again.
- **Original fox cosmetics.** The shop sells a scarf, hat, glasses, and a streak freeze. Cosmetics are one-time purchases and can be equipped through the account progress snapshot; the Fox component renders each accessory as an original SVG layer.
- **Freeze credits.** Purchased streak freezes add credits to the existing freeze inventory, capped at two. `/api/habits` adds credits to the derived freeze count.
- **Shop page.** `/shop` shows the gem balance, catalog, buy/insufficient-gems states, owned/equip controls, and an equipped-fox preview. The account panel shows the gem balance and a shop link.
- **Coverage.** 95 core tests, 11 content tests, and 86 Playwright checks. Five shop checks cover unauthenticated access, insufficient gems, one-time purchase and replay, concurrent double-spend, and freeze credits.

## What P6 changed

- **Habit rules in `packages/core`.** `config.ts` is the single source of truth for
  daily-goal options, freeze cadence and cap, calendar weeks, and quest/achievement
  definitions. `habits.ts` adds IANA day keys, DST-safe arithmetic, event-to-history
  bucketing, duplicate-attempt and duplicate-day deduplication, streak/freeze
  simulation, quests, a Monday-aligned 12-week calendar, and achievements. 17 tests
  cover IST midnight, New York spring/fall DST, duplicate events, freeze earn/spend/
  cap, trailing gaps, quests, week boundaries, calendar length, achievements, and
  the empty report.
- **Snapshot v2 gains `activity`.** Per-day `{xp, lessons}` for guest history. v1
  snapshots are migrated with seeded activity from completed lessons and
  `lastActiveDate`; v1 data is still never rewritten. `recordCompletion` now
  updates activity and uses the stored time zone for day boundaries; merge keeps
  the larger day aggregate so repeated syncs never double-count.
- **Server habits are event-derived.** `GET /api/habits` derives history from
  append-only `lesson_events` only, deduping by `attemptId`. The progress snapshot
  contributes only `dailyGoal` and `timeZone`. `PUT /api/progress` keeps
  preferences (goal and time zone) even when lesson history is more recent
  elsewhere.
- **`/habits` page.** Daily-goal picker (10/30/50/80/120 XP), quests, a 12-week
  Monday-aligned calendar with freeze cells, freeze inventory and explanation, and
  achievements. Guests see device-derived data with an honest source label; signed-in
  users see server-verified data with loading, error, and empty states. Practice
  creates no events, so it does not count.
- **Stored goal everywhere.** Home, learn, account, and lesson summaries now use
  `progress.dailyGoal` instead of a hardcoded 50. Onboarding uses core
  `DAILY_GOAL_OPTIONS`. The header links to `/habits` (icon on mobile to avoid
  overflow) and learn/account link into it.
- **Coverage.** 95 core tests, 11 content tests, and 74 Playwright checks. Four
  habits checks cover event totals, duplicate retries, reload stability, goal
  persistence, and the guest source label.

## Verification snapshot (P9)

Run from the repo root:

| Command | Result |
| --- | --- |
| `pnpm typecheck` | 6/6 Turbo tasks |
| `pnpm test` | 95 core + 11 content tests |
| `pnpm build` | 5/5 Turbo tasks |
| `pnpm e2e` | 96 Playwright checks (web) |
| `pnpm verify` | typecheck → test → build → e2e, all green |

Mobile: `pnpm --filter @speeko/mobile typecheck` and `build` pass. Mobile e2e is not yet automated.

## Verification snapshot (P8)

Run from the repo root:

| Command | Result |
| --- | --- |
| `pnpm typecheck` | 6/6 Turbo tasks |
| `pnpm test` | 95 core + 11 content tests |
| `pnpm build` | 5/5 Turbo tasks |
| `pnpm e2e` | 92 Playwright checks across routes, onboarding, rewards, practice, habits, shop, and social |
| `pnpm verify` | typecheck → test → build → e2e, all green |

Visual evidence: 48 screenshots in [`docs/qa/`](./qa/), plus desktop and mobile
contact sheets. P8 added `/leagues` and `/people` route screenshots at both viewports.

## Verification snapshot (P7)

Run from the repo root:

| Command | Result |
| --- | --- |
| `pnpm typecheck` | 6/6 Turbo tasks |
| `pnpm test` | 95 core + 11 content tests |
| `pnpm build` | 5/5 Turbo tasks |
| `pnpm e2e` | 86 Playwright checks across routes, onboarding, rewards, practice, habits, and shop |
| `pnpm verify` | typecheck → test → build → e2e, all green |

Visual evidence: 44 screenshots in [`docs/qa/`](./qa/), plus desktop and mobile
contact sheets. P7 added the `/shop` route screenshot at both viewports.

## Verification snapshot (P6)

Run from the repo root:

| Command | Result |
| --- | --- |
| `pnpm typecheck` | 6/6 Turbo tasks |
| `pnpm test` | 95 core + 11 content tests; 17 habits tests added |
| `pnpm build` | 5/5 Turbo tasks |
| `pnpm e2e` | 74 Playwright checks across routes, onboarding, rewards, practice, and habits |
| `pnpm verify` | typecheck → test → build → e2e, all green |

Visual evidence: 42 screenshots in [`docs/qa/`](./qa/), plus desktop and mobile
contact sheets. P6 added the `/habits` route plus guest, signed-in, and goal-picker
screenshots at both viewports.

## What P6 changed

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
