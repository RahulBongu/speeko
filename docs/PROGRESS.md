# Speeko — Progress

Living status document. One phase per session; a phase is done only when
`pnpm verify` is green **and** the generated screenshots have been inspected.
The audit that establishes ground truth lives in [`AUDIT.md`](./AUDIT.md);
durable choices live in [`DECISIONS.md`](./DECISIONS.md).

**Updated:** 2026-11-17

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
| P12 - Mobile parity hardening + Stitch design | Jest harness fix, shared mobile exercise layer, server/local save split, shop cosmetics validation, Stitch tactile design pass | **Done (unreleased)** — `2d22c69`, branch `next/M1` |
| P13 - Security boundary + curriculum audit | Public profiles event-derived, verified-vs-device account display, API-boundary E2E, 10 defective exercises removed, validator upgrade, Android QA package, hosting/LICENSE packages, review package export | **Done (unreleased)** — `07b01cd` (API/web boundary) + `05d2adb` (review package) + `53ab85e` (Android QA + decision docs), branch `next/M1` |
| P14 - Curriculum self-audit (deterministic) | `scripts/audit-content.mjs` deterministic audit → `review/audit-ledger.json`; hi pilot (20 items) documented; validator strengthened; **zero source corrections, zero native approvals** | **Done (unreleased)** — `05d2adb`, branch `next/M1` |
| P15 - AI linguistic review | `scripts/ai-review-content.mjs` — all 305 items reviewed by AI across 10 locales; 3 kn items corrected (Tamil vowel in Kannada word); no other changes; audio decision analysis; still draft | **Done (unreleased)** — `05d2adb`, branch `next/M1` |
| P16 - Release hardening | Missing-audio exclusion (`eligibleExercises`), mobile coverage matrix, Android QA handoff refreshed, release-operations checklist, docs/tests reconciled | **Done (unreleased)** — `07b01cd` (core/API/web) + `2d22c69` (mobile) + `53ab85e` (parity matrix, release-ops doc), branch `next/M1` |
| P17 - First-completion reward integrity | Durable per-learner/lesson completion reward, replay-safe XP and lesson gem, transactional claim, reward-derived profiles/leagues/quests, non-destructive backfill, API-boundary + UI replay tests | **Done (unreleased)** — `07b01cd`, branch `next/M1` |

## What P12 changed

- **Mobile Jest harness fixed.** The RN Jest setup now resolves through a realpath-aware
  `jest.preset.js` so the official `react-native/jest/setup.js` mocks apply to the same
  copy pnpm loads; `react` and `react-test-renderer` are pointed at the hoisted copy the
  renderer actually uses. Mobile previously could not run a lesson-screen test at all.
- **Shared mobile exercise layer.** `lib/exercise.ts` and `components/ExerciseBody.tsx`
  own the draft/answer/choice mapping, submission rules, MMD-free grading via
  `@speeko/core#gradeExercise`, expected-answer reveal, deterministic pair order, and
  `earnedExerciseXp` (correct answers only, matching the web session reducer). Unsupported
  kinds render an honest blocking screen and can never submit.
- **Lesson runner.** All five published kinds run end to end with hearts, combo-free
  scoring, real accuracy, save/retry/local/guest states. Signed-in attempts post raw
  answers to `/api/lesson-completions`; 401 falls back to device-local progress with the
  correct XP formula; any other failure shows Retry and never claims XP; hearts
  exhaustion awards nothing and never posts.
- **Practice runner.** Due-only SRS plans via `buildDuePracticePlan`, persisted
  locally. Practice awards no XP, writes no completion record, and surfaces an honest
  empty/no-due state with retry on save failure.
- **Shop + cosmetics.** Guest sign-in state; separate shop/progress loads; purchase
  errors and replay handling; optimistic equip with rollback on server rejection;
  explicit un-equip syncs `equippedCosmetic: null`.
- **Account, habits, people, leagues.** Signed-in vs device-only labels everywhere;
  habits goal change syncs via `PUT /api/progress`; sign-out clears both the session
  cookie and `speeko.mobile.progress.v2` for device isolation. Leagues/people fetch real
  standings and follow/search API.
- **Sign-in/sign-up.** Server `message`/`error` surfaced; password length kept to 8
  chars to match the web form; sign-up syncs progress on success; segmented auth
  switcher.
- **Guidebook pipeline moved into `@speeko/core`.** `guidebookItems`/`guidebookTargets`
  are pure, unit-tested (101 core tests now, +6), and shared by web and mobile. The
  web guidebook route imports them instead of its local copy.
- **Mobile unit guidebook.** `/guidebook/[courseId]/[unitIndex]` renders the words and
  phrases straight from the unit's exercises (pair boards split into members, identical
  targets deduped) plus a lesson plan. Every unit banner on the path gets a "📖 Guidebook"
  button. Mobile tests cover rendering, dedup/no-cross-unit leakage, invalid index, and
  load failure.
- **Stitch design layer.** `components/Tactile.tsx` carries the extruded slab button,
  ink-bordered card, chunky progress track, streak/XP stat pills, and `SpeekoAppBar`
  into React Native. Applied to `/learn`, `/path/[courseId]`, `/lesson/...`,
  sign-in/sign-up, `/account`, plus a 5-item bottom tab bar. See
  `docs/product/current-state-and-parity.md` for the exact Stitch scope and limits.
- **Server change.** `PUT /api/progress` validates `equippedCosmetic` changes against
  owned `SHOP_ITEMS` (400 unknown, 409 unowned), permits an explicit `null`, and lets an
  already-stored legacy value keep syncing. `progress.ts` owns the snapshot schema.
- **Coverage.** 54 mobile Jest tests (13 suites), run in `pnpm test` through Turbo.

## Verification snapshot (P12)

Run from the repo root on 2026-11-16:

| Command | Result |
| --- | --- |
| `pnpm typecheck` | 6/6 Turbo tasks |
| `pnpm test` | 101 core + 11 content (Vitest), 54 mobile (Jest, 13 suites) |
| `pnpm build` | 5/5 Turbo tasks; mobile web export bundles 16 static routes |
| `pnpm e2e` | 102 Playwright checks pass; zero console/page errors |
| `pnpm verify` | typecheck → test → build → e2e, all green |

Mobile: no device/emulator screenshots taken in this cycle. The release APK was not relaunched.

## What P13 changed

- **Public profile stats are event-derived.** `profileWithStats` now sums
  `lesson_events` for lifetime XP, counts distinct attemptIds for lessons, and
  computes the streak from `historyFromLessonEvents` + `computeStreak` — never
  from the client-editable snapshot. A forged `PUT /api/progress` can no longer
  inflate what other learners see. This was the largest open integrity gap.
- **Own accounts show verified events first.** Web `AccountPanel` and mobile
  `/account` read `/api/habits`; sign-in failure paths show the local snapshot
  clearly labelled as this device with an explicit warning, never "verified".
- **Security boundary proven by API-level tests.** New
  `tests/e2e/progress-integrity.spec.ts` runs against the compiled API + DB:
  401s, forged XP/streak/completions/unknown keys stripped, event-derived
  profile stays empty for a forging user, cosmetic 400/409, explicit `null`
  un-equip, malformed 400s (unknown fields/negative numbers/NaN), cross-account
  isolation via a second session, retry idempotency. 14 checks, both viewports.
- **Progress endpoint field ownership documented and enforced**: rewards are
  append-only (`lesson_events`, `gem_ledger`); snapshot merge keeps max-XP/no
  double-count rules for business logic; preferences (`dailyGoal`, `timeZone`,
  `equippedCosmetic`) are accepted with validation; unknown keys are schema-stripped.
- **10 template-defect exercises removed.** All starters carried identical
  English fill-in-the-blank ("I have ___ apples."). Starters now have 23
  exercises each; total 305; `content/dist` and `apps/web/public/courses`
  rebuilt; source JSON updated. The validator now **warns** on production
  answers missing from the locale's script, on duplicate option strings (error),
  on listenChoose `audioUrl` (warning if empty, error if unusable), and the
  scaffold had the same bug fixed.
- **Review package exported.** `node scripts/export-review.mjs` writes
  `review/review-package.json`, per-locale CSVs, and `review/REVIEW.md` —
  305 items, all fields preserved, decisions/notes/reviewer left empty. No
  review claim exists.
- **Android environment honestly recorded.** adb works; no attached devices,
  no AVDs, no system images, no command line tools, no JDK, WHPX disabled.
  Complete device-QA checklist at `docs/qa/android-device-qa.md`; no device
  verification is claimed. Sixteen static mobile routes export cleanly.
- **Hosting + LICENSE decision packages** at
  `docs/decisions/2026-11-16-hosting-and-database.md` and
  `docs/decisions/2026-11-16-license.md` — recommendations, no spend, both
  blocked on owner authorization.
- **Mobile endpoints release-configurable.** `lib/api.ts` reads
  `apiUrl`/`webOrigin` from `app.json extra` (defaults localhost); mobile
  POST/PUT now carry the same origin header the browser sends.
- **Content validator extended with script-consistency warnings** and run on the
  tracked sources; grading tests re-grade all 305 items.
- **Coverage.** 101 core + 15 content + 55 mobile (13 suites) + 116 Playwright
  checks + 6/6 typecheck + 5/5 build. Web and mobile account displays verified
  against real streams; profile forgery eliminated end-to-end.

## Verification snapshot (P13)

Run from the repo root on 2026-11-16:

| Command | Result |
| --- | --- |
| `pnpm typecheck` | 6/6 Turbo tasks |
| `pnpm test` | 101 core + 15 content (Vitest), 55 mobile (Jest, 13 suites) |
| `pnpm build` | 5/5 Turbo tasks; web + mobile bundles rebuilt (dist 305 exercises; 16 mobile routes) |
| `pnpm e2e` | 116 Playwright checks pass; zero console/page errors |
| `pnpm verify` | typecheck → test → build → e2e, all green |
| `node scripts/export-review.mjs` | 305 items across 10 locales; 0 marked reviewed |

No native-speaker review exists. (No Android device verification existed at the time of this 2026-11-16 snapshot; superseded 2026-11-17 by M1 — see "M1 — Android render verification" below.)

## What P14 changed

- **Deterministic structural audit** runs across all 305 exercises via
  `scripts/audit-content.mjs` → `review/audit-ledger.json`. Rules R-001..R-008
  (bounds, duplicates, normalization, invisible chars, listenChoose `audioUrl`,
  locale-script consistency) are deterministic; R-010 is an AI-assisted
  low-confidence consistency heuristic for the same prompt with different
  target spellings across courses of one locale, and is never treated as a
  verdict.
- **Zero defects found** by R-001..R-005; **10 items blocked** pending licensed
  listenChoose audio (R-006); **2 items need_further_review** (R-010, both the
  two spellings of "Sorry" in Hindi across starters/pilot); **293 match no rule**.
- **Zero source corrections applied.** Every finding is a proposal for a human
  Hindi/Bharat-locale reviewer; the ledger marks every item `humanStatus:
  unreviewed` — no automated pass implies approval.
- **Audit pilot (hi)** documented in `review/audit-pilot-hi.md`: 20 items,
  18 clean / 1 blocked / 1 flagged, calibration notes, false-positive analysis.
- **Validator strengthened** (`packages/content/src/index.ts`): duplicate
  option strings hardened, `answerIndex` bounds check added (schema only bounds
  `≥0`; out-of-bounds now errors), +1 content test. Content suite: 16 tests.
- **Review package extended honestly.** `REVIEW.md` now carries a dynamic
  "Automated audit evidence" section computed from the ledger — never presented
  as approval. `audit-ledger.json` is the machine-readable per-item record with
  content hashes.
- **Traceability proved**: 305 dist exercises = 305 ledger items = 305 CSV rows.
- **No audio URLs generated**; no content claims native-speaker review.

## Verification snapshot (P14)

Run from the repo root on 2026-11-16:

| Command | Result |
| --- | --- |
| `pnpm typecheck` | 6/6 Turbo tasks |
| `pnpm test` | 101 core + 16 content (Vitest), 55 mobile (Jest, 13 suites) |
| `pnpm build` | 5/5 Turbo tasks |
| `pnpm e2e` | 116 Playwright checks pass |
| `pnpm verify` | typecheck → test → build → e2e, all green |
| `node scripts/audit-content.mjs` | 305 items ledgered; 0 structural defects; 10 blocked (audio); 2 flagged R-010; 293 no_issue_detected; 0 native approvals |
| `node scripts/export-review.mjs` | 305 items across 10 locales; `REVIEW.md` audit section computed from the ledger |
| Dist ↔ ledger ↔ CSV cross-check | 305 = 305 = 305, zero missing/extra |

No source corrections were made in P14; the content set is unchanged.

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

## What P15 changed

- **AI-assisted linguistic review of all 305 items** via `scripts/ai-review-content.mjs` →
  `review/ai-linguistic-review.json` + `review/ai-linguistic-review.md`. Ten
  production-relevant checks (meaning, grammar, naturalness, orthography,
  transliteration, vocabulary, ambiguity, exercise correctness, consistency,
  pedagogy) applied per item; every entry keeps its stable ID and content hash.
- **One logical defect corrected in the source in three places**: the Kannada
  word for five (ಐದು) was written with the Tamil vowel U+0B90 in
  `kn-starter-u2-l1-e2` (options), `kn-starter-u2-l2-e1` (options), and
  `kn-starter-u2-l2-e2` (the answer key). All three are now U+0C90; source and
  bundle rebuilt and re-scanned; web `public/courses` re-synced.
- **No other words changed.** hi "Sorry" keeps both attested spellings
  (`माफ़ कीजिये` in starters, `माफ कीजिए` in hi-pilot); recorded for reviewers,
  deliberately not "unified". Transliteration absence in hi-starter recorded as
  a proposal only, no content authored.
- **Audio decision documented** in `review/audio-decision-analysis.md`: local
  Windows SAPI exposes only en-US voices (no Indic pack); no audio exists or is
  claimed; recommendation: keep the honest no-audio fallback until a reviewer can
  record/license audio, or drop listenChoose from starters. R-006 still blocks all
  10 items.
- **No artifact marks anything reviewed.** The AI ledger contains zero
  certifications; every item is still `reviewStatus: draft`.
- **Verification after edits**: 11/11 course files valid (validator + answerIndex
  bounds rule), 16 content tests, 305 totals consistent across dist / audit ledger
  / AI ledger / review CSVs, and a full green `pnpm verify` (101 core + 16 content
  + 55 mobile tests; 6/6 typecheck; 5/5 build; 116 Playwright checks).

## What P16 changed

- **Missing-audio safeguard.** `eligibleExercises()` in `@speeko/core` filters
  exercises whose task cannot be performed; the only case today is
  `listenChoose` with an empty `audioUrl`. Wired into the web lesson player and
  review/practice queues, the mobile lesson runner, the shared SRS skill index,
  and `POST /api/lesson-completions` (so graded answers and the client queue
  match). Content files, IDs, ordering, and `reviewStatus` are untouched.
- **Why this shape.** A no-audio "Listen and choose" is a guess, not a listening
  task. Excluding it prevents a dishonest interaction without deleting content
  or breaking lesson sequencing: the affected lesson still has 2 of 3 items.
  Adding a licensed `audioUrl` later restores the item with no code change.
- **Tests.** `packages/core/src/eligibility.test.ts` (4 tests) plus an
  ineligible-audio fixture in `packages/core/src/practice.test.ts`; mobile
  lesson-runner tests cover both the skipped case and a playable-audio case.
- **Mobile coverage matrix.** `docs/product/current-state-and-parity.md` now
  has a per-capability table (onboarding, accounts, exercise kinds, completion,
  persistence, practice, shop, habits, navigation, network failure,
  missing-audio). Verified findings: the curriculum contains only 4 kinds
  (`chooseMeaning` 210, `typeTranslation` 65, `matchPairs` 20, `listenChoose`
  10); mobile supports every curriculum kind that is playable; onboarding is
  genuinely absent on mobile (welcome → learn), while account creation is
  reachable from the Account tab; extra unsupported kinds fail closed but do
  not occur in any shipped lesson.
- **Android handoff refreshed.** Re-checked the environment: no AVDs, no system
  images, no command-line tools, no JDK on PATH, no device attached, WHPX
  unavailable. The existing `dist/speeko-release.apk` predates this tree and
  was not run. The checklist now covers registration, missing-audio behavior,
  and the stale-artifact caveat; no device claim is made.
- **Release operations checklist.** `docs/decisions/2026-11-16-release-and-operations.md`
  prepares GO/NO-GO gates, env/secrets, migrations, backup+restore, rollback,
  rate limits, logging, and post-deploy smoke tests. Nothing was provisioned.
- **Verification after edits:** `pnpm verify` green — typecheck 6/6, **107
  core + 16 content + 56 mobile (13 suites)** tests, build 5/5, **116/116
  Playwright checks** at 1280×800 and 390×844. Exact commands: `pnpm typecheck`,
  `pnpm test`, `pnpm build`, `pnpm e2e` (via `pnpm verify`), all exit 0.

## What P17 changed

- **One-time completion reward ledger.** New table `lesson_completion_rewards`
  (`id`, `user_id`, `course_id`, `lesson_id`, `attempt_id`, `xp`, `created_at`)
  with a unique `(user_id, course_id, lesson_id)` index. The first passing
  attempt for a lesson owns the reward; any later attempt — including one with a
  fresh `attemptId` — is practice. Migration `0005_lesson_completion_rewards.sql`
  is registered in the Drizzle journal.
- **Replay-safe completion endpoint.** `POST /api/lesson-completions` inserts the
  attempt, claims the unique reward row, sets the event's `xpEarned` to the
  awarded XP (`0` for a replay), and inserts the lesson gem in the same
  transaction. The gem's idempotency key is `lesson:<courseId>:<lessonId>`, so
  attempt ids cannot create extra gems. Same-attempt retries still return the
  original event; concurrent new attempts serialize on the unique index and only
  one reports `completion.rewarded = true`. Response now includes
  `completion: { rewarded, xp, gems }`.
- **Attempts and practice preserved.** Replay events keep full graded answers,
  accuracy, combo, and SRS updates, and still count as habit activity. They carry
  no completion XP. `GET /api/habits` therefore uses two histories: events for
  activity/streak/calendar/achievements, reward rows for quest progress.
- **Derived views use the reward ledger.** Lifetime profile XP and lesson count
  come from reward rows (unique lessons), and weekly leagues count reward rows
  created that week, so practice cannot pad a profile or standings. Daily quest
  gems derive from reward history; weekly quests remain progress-only.
- **Non-destructive backfill.** One row per existing `(user, course, lesson)`
  gets `xp = SUM(historical event XP)` and `created_at = MIN(event createdAt)`.
  Lifetime XP is preserved exactly, the migration does not mint gems or claw back
  balances, and existing events are neither deleted nor rewritten. Guest progress
  snapshots remain display/import-only and cannot claim or deny a reward.
  Historical lesson counts intentionally become unique completed lessons.
- **Replay UI is honest.** Web and mobile summaries show “Practice complete!” and
  “Lesson saved — practice only, no new completion XP.” for an unrewarded
  completion. A first completion still shows the saved XP and gem reward.
- **Tests.** New `tests/e2e/reward-integrity.spec.ts` (7 API/UI checks per
  viewport) covers first/replay, a second distinct lesson, same-attempt retry,
  concurrent first/replay attempts, invalid/incomplete attempts, guest snapshot
  migration, profile/gem/habit consistency, and the replay summary. Shop fixtures
  now earn gems from six distinct lessons instead of replaying one lesson.
  Core `buildHabitReport` gained an optional `questHistory` with a
  practice-vs-quest unit test.
- **Migration smoke evidence.** Applied cleanly to a fresh PGlite database and to
  a populated database at migration 0004: two historical events for one lesson
  backfilled to one 42-XP reward (21 + 21) dated at the first attempt, a second
  lesson kept 20 XP, a second learner kept 21 XP, and a duplicate reward insert
  was rejected by the unique index.

## Verification snapshot (P17)

Run from the repo root on 2026-11-17:

| Command | Result |
| --- | --- |
| `pnpm typecheck` | 6/6 Turbo tasks |
| `pnpm test` | 108 core + 16 content (Vitest), 56 mobile (Jest, 13 suites) |
| `pnpm build` | 5/5 Turbo tasks; web + API + 16-route mobile export |
| `pnpm e2e` | 130 Playwright checks pass (65 tests × 2 viewports); zero console/page errors |
| `pnpm verify` | typecheck → test → build → e2e, all green |

Migration 0005: fresh-database apply and populated pre-0005 backfill both
verified; no historical events or gem balances were modified. No native-speaker review
exists. (No Android device verification existed at the time of this 2026-11-17 P17
snapshot; superseded later the same day by M1 — see "M1 — Android render verification"
below.)

## Phase I — Reward ledger temporal integrity audit

- **Read-only trace.** Sources: `lesson_events` (attempt history, streak/activity/SRS), `lesson_completion_rewards` (lifetime XP/lessons, weekly league, quest gems), `gem_ledger` (balances), progress snapshots (preferences/guest import). Weekly league filters `lesson_completion_rewards.created_at >= weekStart`; quest gems derive from reward history; habits use events for activity and rewards for quests.
- **Temporal finding.** For a lesson completed more than once, the migration aggregates all historical event XP into one reward row stamped with the first attempt's timestamp. Consequently the later attempt's week no longer receives that XP under the weekly league query. This is a real change in historical weekly attribution, but it follows the one-time reward policy (D74/D75): a replay earns no reward, so its week cannot keep the XP. Preserving the old weekly distribution would require either counting replay XP (violating D74) or a separate historical attribution source (splitting the source of truth). That conflict is documented here rather than resolved by silently changing the economy.
- **Defect found and fixed.** The original backfill created a reward row for every distinct lesson event, including zero-XP events, which are not completions. That inflated lesson counts, quest history, and weekly participation. The backfill now filters `xp_earned > 0` (`apps/api/drizzle/0005_lesson_completion_rewards.sql`).
- **Fixture evidence.** Controlled pre-migration data included: lesson A completed 2026-11-03 and 2026-11-10 (21 XP each), lesson C twice in week 1 (20+20), lesson D on 2026-11-08 23:30 and 2026-11-09 00:30 (21+21), two distinct lessons in different weeks, an existing user with 21 XP and 15 gems, a guest snapshot with 99 XP and no events, and a zero-XP event. Lifetime XP stayed 124/40/21/0; gem balance stayed 15; the zero-XP user got no reward row; duplicate migration was a no-op; weekly XP moved from 82+42 to 124+0 for user A as expected under the policy.
- **No other files changed.** Temporal anchoring was intentionally not altered.

These are product gaps, not regressions. Details and evidence are in
[`AUDIT.md`](./AUDIT.md), [`READINESS.md`](./READINESS.md), and
[`product/current-state-and-parity.md`](./product/current-state-and-parity.md).

- **Android render verification exists (M1, 2026-11-17)**. The debug APK was
  installed, launched, and inspected on a Vivo V2336 (render evidence:
  `docs/qa/mobile/learn-screen-ui-dump.xml`, `docs/NEXT.md`; debug-era captures were
  corrupt and are rejected, see `docs/qa/rejected-captures/`). The **release** APK was
  also verified on device: it cold-starts and renders the Bengali course path
  (screenshot, UI dumps and logcat in `docs/qa/mobile/`, incl. fresh-guest dumps showing
  the same 0/8 + UNIT 1 state as the learn screen; on-device APK hash matches the
  build). No like-for-like learn-screen capture was obtained (device in active use).
  Full functional device QA (sign-up,
  lesson completion, sync, shop, habits, sign-out) has not been performed on hardware.
- **No native-speaker review.** All 305 exercises remain `reviewStatus: "draft"`. The
  review package is exported and ready; playable does not mean correct.
- **`PUT /api/progress` remains a non-authoritative guest-import layer.** Leagues,
  quests, gems, and achievements derive from events; SRS updates sync through the
  snapshot layer and can be forged locally (never affecting rewards).
- **Unit practice can double-count a card** within one session (round-robin can land
  two exercises for the same word). Due and trouble plans use one exercise per skill.
- **Trouble words are historical**; a card with a lapse never automatically retires.
- **Hosting/database choice is deferred** and no `LICENSE` exists; both are owner
  decisions with packages prepared this cycle. Nothing is provisioned or signed.
- **Mobile exercise parity** is partial: `wordBank`, `arrangeSentence`, `speak`,
  `typeWhatYouHear` are unsupported and fail safely on mobile.
- **Stories and conversation** ship as honest unavailable/coming-soon states on web;
  they are not on mobile.
- **Mobile has no onboarding flow**; render evidence from M1 is the uiautomator
  dump (`docs/qa/mobile/learn-screen-ui-dump.xml`); full
  on-device functional QA has not been performed. The welcome screen hands
  off directly to `/learn`.

## M1 — Android render verification (2026-11-17)

- **Branch:** `next/M1`, based on `de57065`. P12–P17 are committed on this branch
  (`07b01cd`, `2d22c69`, `05d2adb`, `53ab85e`).
- **Device:** Vivo V2336 (`10BE2A1B5Q00054`), Android 16.
- **Debug render: PASS.** `./gradlew assembleDebug` built; `adb install -r`; the app
  launched against Metro (port 8081; the dev server was started with
  `EXPO_NO_METRO_WORKSPACE_ROOT=1` exported) and rendered the learn screen —
  `speeko`, `Ten Indian languages · draft review`, `Learn`, `Bengali`,
  `8 lessons · 23 exercises · A1`, `0 of 8 lessons complete`, `All courses`.
  Evidence: `docs/qa/mobile/learn-screen-ui-dump.xml` (intact `adb pull` dump from the
  passing session). All four screencap PNGs from 2026-11-17 were transcoded to UTF-16LE
  by PowerShell redirection and are corrupt; they are rejected and live in
  `docs/qa/rejected-captures/` — no screenshot evidence exists (see its README).
- **Release render: verified on device (2026-11-17).** Release APK installed, cold-start
  loads the bundle and renders real server-fed content (Bengali course path);
  on-device APK hash matches the build (`36A5D41D…`); logcat shows no fatal/hermes
  errors from the app; screenshot is a valid PNG (1080×2400). No like-for-like
  learn-screen comparison against debug was captured — the welcome/learn screen could
  not be frozen while the device was in active use; the fresh-guest state is proven by
  `pm clear` dumps (`UNIT 1 Greetings`, `START · LESSON 1`, `0 of 8 lessons complete` —
  identical to the debug fresh-guest learn screen). Loopback-only cleartext for the QA
  build now ships as a committed, QA-gated config plugin
  (`apps/mobile/plugins/withQaLoopbackCleartext.js`; no-op unless
  `SPEEKO_QA_LOOPBACK_CLEARTEXT=1`). **Functional device QA is still pending — M2.**
- **Fixes:** Metro `resolver.unstable_conditionNames = ['require']` (Hermes
  `_interopRequireDefault is not a function`); Metro workspace root pinned to the app in
  `metro.config.js` (`release/bundle` no longer depends on
  `EXPO_NO_METRO_WORKSPACE_ROOT` being exported; the `process.env` line in
  `metro.config.js` must stay **before** `require('@expo/metro-config')`);
  explicit `expo-linking` dependency
  (native module was not autolinked); API `CONTENT_DIR` repointed to repo-root
  `content/dist` (`/api/courses` was 500).
- **Regression coverage:** root-layout Jest render test in
  `apps/mobile/__tests__/root-layout.test.tsx` (passing). It only proves the layout
  module executes under Jest — it does not demonstrate a device render; the device
  evidence is `docs/qa/mobile/learn-screen-ui-dump.xml`.
- **Not verified on device (M2):** sign-up/sign-in, completing a lesson,
  cross-device progress sync, shop, habits, sign-out. M2 tracks this.
  See `docs/NEXT.md` for commands and raw output.
- **Commit map (fix → commit):**
  - Metro `unstable_conditionNames = ['require']` → `2d22c69`
  - `expo-linking` dependency added → `2d22c69`
  - API `CONTENT_DIR` repointed to repo-root `content/dist` → `2d22c69`
  - Metro workspace-root pinning (`process.env.EXPO_NO_METRO_WORKSPACE_ROOT` before
    `require('@expo/metro-config')`) → `12c8044` (message under-describes the commit;
    do not rewrite pushed history)
  - e2e screenshot output moved to gitignored `test-results/screenshots/<project>/` →
    `12c8044`
  - Release-build evidence, rejected captures, APK reproducibility check, doc fixes →
    `ea95aee`, `12c8044`, `47f8bfd`, `73ebfff`

## Re-running the safety net

```bash
pnpm install
pnpm verify          # typecheck + test + build + e2e
pnpm lint            # web + mobile
```

Curated screenshots are kept in `docs/qa/<project>/`; `pnpm e2e` writes fresh,
gitignored captures to `test-results/screenshots/<project>/` (see `docs/qa/README.md`).
The e2e config reuses an already-running dev server outside CI, but a fresh `pnpm build` is required
because Playwright starts the production web server and the compiled API.
