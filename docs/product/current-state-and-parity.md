# Speeko — Current State and Parity

This document is a source-backed snapshot of the repository as of the current
working tree. It distinguishes what is **implemented and verified**, what is
**partial**, and what is **missing or unverified**. Nothing here is claimed as
reviewed, published, launched, or hardware-tested unless it says so.

**Snapshot date:** 2026-11-16, updated 2026-11-17
**Branch state:** work sits on top of `de57065` (phase/11-hardening merge). Nothing
has been committed, pushed, or released in this cycle.

## Verification baseline (this cycle, from the repo root)

| Command | Result |
| --- | --- |
| `pnpm typecheck` | **6/6 Turbo tasks** successful (5 package typechecks + `^build`) |
| `pnpm test` | **108 core + 16 content** (Vitest) and **56 mobile** (Jest, 13 suites). All pass. |
| `pnpm build` | **5/5 Turbo tasks** (core, content, web, API, mobile web export) |
| `pnpm e2e` | **130 Playwright checks** pass at 1280×800 and 390×844, zero console/page errors |
| `pnpm verify` | typecheck → test → build → e2e, all green |
| Mobile export | 16 static routes exported (`dist/`) |

Visual evidence for the web surfaces is in `docs/qa/`; the mobile app has
**no screenshot record** (no device or emulator capture exists for this cycle).

## Web

Implemented and verified:

- Auth, onboarding, course path (guidebook/chest/checkpoint nodes), practice hub,
  habits, shop, leagues, people, profiles, stories/conversation, hardening.
- Lesson runner supports all ten exercise kinds (`chooseMeaning`,
  `typeTranslation`, `matchPairs`, `fillBlank`, `listenChoose`, `wordBank`,
  `arrangeSentence`, `chooseImage`, `typeWhatYouHear`, `speak`).
- Unit guidebooks extract their words and phrases from the shared `@speeko/core`
  `guidebookItems` helper (deduplicated, pair boards split into members).
- Server-verified lesson completion with one-time completion XP/gems, gem ledger,
  shop, habit history derived from `lesson_events`, social graph. Replaying a
  completed lesson is practice-only: grading/SRS and streak activity continue,
  but completion XP and the lesson gem are paid once per learner/course/lesson.
- `/api/progress` validates shape, merges conservatively, validates `equippedCosmetic`
  against owned `SHOP_ITEMS` (400 unknown, 409 unowned), and scopes every write to
  the session owner. Public profile XP/lesson counts derive from the
  `lesson_completion_rewards` ledger and streaks from append-only `lesson_events`
  — a forged snapshot or a practice replay cannot inflate what another learner sees.
  Own accounts show verified events; otherwise device-labeled fallback.

Known web limitations:

- No Indic content has been reviewed by a native speaker. Every shipped course
  is `reviewStatus: "draft"`.
- Timezone-aware guest days exist, but signed-in history is event-derived only.
- `PUT /api/progress` is not authoritative for XP; first-completion rewards come
  from `lesson_completion_rewards`, and activity/streak history comes from
  `lesson_events`.

## Android / mobile

Implemented:

- Welcome (motion-rich), sign-in, sign-up (server errors surfaced, 8-char password
  hint, progress merge on auth), learn, path (with unit guidebook buttons), lesson,
  practice hub, practice runner, account, habits, shop, leagues, people, app navigation.
- Unit guidebook at `/guidebook/[courseId]/[unitIndex]` renders target words straight
  from tracked course exercises (shared `@speeko/core#guidebookItems`) plus a lesson
  plan. The words are never hand-authored.
- Lesson runner supports exactly `chooseMeaning`, `fillBlank`,
  `listenChoose`, `typeTranslation`, and `matchPairs` **when they are playable**.
  Empty-audio `listenChoose` items are excluded from every playable queue today
  via `eligibleExercises()` in `@speeko/core` (applied to lesson queues, practice/review,
  SRS index, and the server grading path). Everything else fails safely with a
  blocking screen and can never submit or complete a lesson.
- Practice runs a **due-only** SRS session from local Leitner cards, awarding
  no XP and writing no completion record. Answers update the SRS schedule and
  persist locally.
- Local grading for feedback; completion posts raw answers to
  `/api/lesson-completions`; signed-out fallback saves device progress with
  lesson bonus + correct-only exercise XP (mirrors web); signed-in failures
  **never claim XP** and show a Retry path. Hearts exhaustion awards nothing.
- Local/cloud progress merge via `lib/sync.ts` (union of completed lessons,
  higher-wins XP, explicit local `equippedCosmetic` preferred over cloud;
  cloud cosmetic adopted when local is `null`).
- Shop: guest sign-in state, separate shop/progress loads, purchase errors and
  idempotent replay, optimistic equip with rollback on 409, un-equip with `null`.
- Habits/account: own numbers render from `/api/habits` (verified events) when the fetch
  succeeds; on failure the UI shows the local snapshot labelled **Device progress** with an
  explicit warning banner — never "Verified account progress". Sign-out clears the session
  cookie **and** the local progress snapshot.
- Path locking: first incomplete lesson is current; completed ones replay;
  later ones stay locked (mirrors web).
- App navigation is a 5-item bottom tab bar (Learn · Practice · Habits · Shop · Account).
- Stitch design language (extruded "tactile" slab buttons, ink borders, chunky
  progress tracks, app bar with real streak/XP badges, winding path, auth hero
  and segmented switcher, profile header) applied across the app. See
  **Stitch integration** below for exact scope and limits.

Mobile test evidence (Jest, 13 suites / 56 tests, `npx jest` in `apps/mobile`):

- Unit: shared exercise layer (XP-only-on-correct rule), sync merge/push rules,
  progress snapshot migration/corruption handling, API cookie persistence.
- Component/integration: lesson runner (playable kinds, missing-audio skip,
  unsupported-kind block, 401 local fallback, hearts exhaustion, save retry),
  practice runner (due-only
  plan, no XP, SRS persistence, schedule-save failure retry), shop (guest state,
  purchase, equip + rollback, un-equip), habits (guest vs verified, goal sync,
  fail-closed session), account (verified vs device fallback display, sign-out
  isolation), guidebook (render, dedup, invalid index, load failure).
- `tests/e2e/progress-integrity.spec.ts` (forged snapshots) and
  `tests/e2e/reward-integrity.spec.ts` (first-completion/replay concurrency) run
  against the real Fastify + real pglite/Postgres boundary via the production
  compilation. Everything network-dependent you see here is a mock of the
  boundary, not the boundary.

Partially done / missing on mobile:

- `wordBank`, `arrangeSentence`, `speak`, `typeWhatYouHear` are not runnable.
  None of these kinds occurs in the current 305-item curriculum, so they do
  not block launch content; a lesson containing one still fails closed.
- Practice is not synced to any server SRS endpoint; it stays on-device.
- Lesson completion shows the server's reward result: first completion reports
  saved XP; a replay says “Practice complete!” / “Lesson saved — practice only,
  no new completion XP.” The server still grants lesson/quest gems internally.
- **No Android device or emulator was available.** The SDK is installed (platforms,
  emulator binary) but no AVDs, no system images, no command line tools, no JDK on PATH,
  and WHPX is disabled — so no APK launch is possible or claimed. `docs/qa/android-device-qa.md`
  documents the exact checklist required for a device run.
- No mobile onboarding flow (still welcome → learn directly). Account creation
  exists via **Account → Sign in → Create account**; guests can use the whole
  learning flow without an account.
- No mobile screenshots, no mobile E2E suite.

## Mobile feature-coverage matrix (source + test evidence)

Every “verified” entry below means the behavior is covered by Jest component/
integration tests with a mocked network/storage boundary, or by the shared
core/web e2e suite where stated. **None of it is device evidence** — see
`docs/qa/android-device-qa.md` for the unrun hardware checklist.

| Capability | Web | Android / Expo | Evidence |
| --- | --- | --- | --- |
| Onboarding | Full `/onboarding`: language, motivation, level, daily goal, commitment | **Missing.** Welcome screen → `/learn`; no language/goal onboarding. Guest flow works. | `apps/web/app/onboarding/*`; `apps/mobile/app/index.tsx`; Playwright `onboarding.spec.ts` |
| Account creation | Email + password sign-up, merge of guest progress | Email + password sign-up from Account tab; server errors inline; 8-char password hint; merge after auth | `sign-up.tsx`, `sign-in.tsx`; Jest `account.test.tsx` |
| Exercise kinds present in curriculum | `chooseMeaning` 210, `typeTranslation` 65, `matchPairs` 20, `listenChoose` 10 — all playable on web | `chooseMeaning`, `typeTranslation`, `matchPairs` playable. `listenChoose` playable **only with non-empty `audioUrl`**; all 10 current items are empty and excluded. | Content inventory; `eligibility.ts`; `exercise.test.ts`, `lesson-runner.test.tsx` |
| Extra kinds implemented but not in curriculum | `fillBlank`, `wordBank`, `arrangeSentence`, `chooseImage`, `typeWhatYouHear`, `speak` | `fillBlank` only; other four render a blocking “not available” screen and cannot submit | `ExerciseBody.tsx`; `lesson-runner.test.tsx` unsupported-kind test |
| Lesson completion | Server re-grades raw answers; guest path saved locally | Server re-grades; signed-out 401 falls back to device save; other save errors award nothing and offer Retry; hearts exhaustion awards nothing | Core `scoreLessonAttempt`; `lesson-completions.ts`; Jest runner tests; Playwright `rewards.spec.ts` |
| Progress persistence / reconciliation | Local snapshot + `/api/progress` merge; events authoritative for rewards | Local `speeko.mobile.progress.v2` + cloud merge (union completed, higher-wins XP, cosmetic rules); sign-out clears cookie and local snapshot | `lib/sync.ts`; Jest `sync.test.ts`, `progress.test.ts`, `account.test.tsx` |
| Practice / review | SRS review route, due/trouble/unit practice, checkpoints; no XP | Due-only SRS practice with local schedule, no XP; no server SRS sync | `packages/core/src/practice.ts`; Jest `practice-plan.test.ts`, `practice-runner.test.tsx` |
| Shop / cosmetics | Purchase, equip, un-equip, idempotent retry, 400/409 validation | Guest sign-in state; purchase; optimistic equip with rollback; un-equip via `null`; honest errors | Playwright `shop.spec.ts`; Jest `shop.test.tsx`; `progress.ts` route |
| Account statistics / habits | Event-derived XP/streak/lessons; habits calendar | `/api/habits` verified numbers; on failure device snapshot labelled **Device progress** with warning; goal sync | `AccountPanel.tsx`, `account.tsx`, `habits.tsx`; Jest account/habits tests |
| Navigation / error recovery | Route-level error and empty states; back/deep links | 5-tab bar; path locking; lesson/practice/guidebook/shop load and retry states; back stack via Expo Router | `_layout.tsx`, `AppNav`; Jest guidebook/shop/practice tests |
| Network failure behavior | Signed-in save failure shows “Reward not saved” + Retry, no local award | 401 → device save with label; 5xx/network → Retry, no award; practice schedule failure → retry; habits/shop/leagues show explicit offline/sign-in states | Playwright `rewards.spec.ts`; Jest runner/practice/habits/shop tests |
| Missing-audio safeguard | Empty-audio `listenChoose` excluded from lesson/review queues; API rejects it in grading | Same exclusion in lesson runner and practice; server also filters before scoring | `eligibility.ts`, `LessonPlayer.tsx`, mobile lesson route, `lesson-completions.ts`; core + mobile tests |

## Backend

Implemented and verified:

- Fastify routes for auth, progress, lesson completions, habits, shop, social,
  courses, AI status.
- Drizzle schema and migrations through `0005_lesson_completion_rewards.sql`.
- Server-authoritative grading, first-completion XP/gems, freeze credits, social
  profiles/follows. Replays keep graded attempt history but earn no completion
  reward.
- Public profile XP/lessons derive from `lesson_completion_rewards`; the streak
  derives from `lesson_events`. Neither is readable from a client snapshot.
- `/api/progress` validates equipped cosmetics against real ownership,
  keeps legacy stored values syncable, honours explicit `null` un-equip, and is
  scoped to the authenticated user.

## Content

- 11 course bundles in `content/dist` (10 starters + `hi-pilot`).
- **305 exercises** total (230 starter + 75 draft pilot). Kinds present:
  `chooseMeaning` 210, `typeTranslation` 65, `matchPairs` 20, `listenChoose` 10.
- Every course is `reviewStatus: "draft"`; there is no reviewed content yet.
  The `reviewStatus` field lives on the course, unit, and lesson schemas rather
  than on each exercise; the review package and audit ledger list every item as
  draft, and the manifest reports draft for all 11 bundles.
- `listenChoose` exercises ship with an empty `audioUrl`; all 10 are excluded
  from every playable queue by `eligibleExercises()` (D71) and blocked in the
  audit ledger. No audio URL or file is fabricated. The UI never presents a
  dead listening task; the affected lesson drops from 3 to 2 playable items.
- **Deterministic structural audit** (`node scripts/audit-content.mjs`): rules
  R-001..R-008 (answer bounds, duplicate options/expected, NFC, invisible
  characters, empty/malformed audio URL, locale-script code points) are clean
  across the set; 10 items blocked on missing licensed audio; 2 Hindi items
  flagged `needs_further_review` by R-010 (cross-course spelling of “Sorry”,
  AI-assisted and explicitly non-authoritative); 293 match no automated rule;
  `review/audit-ledger.json` is the per-item machine record.
- **AI-assisted linguistic review** (`node scripts/ai-review-content.mjs`): all
  305 items judged across 10 categories (meaning, grammar, naturalness,
  orthography, transliteration, vocabulary, ambiguity, correctness, consistency,
  pedagogy); 3 Kannada items corrected for a misassigned Unicode glyph
  (ಐ with U+0B90 → ಐ with U+0C90 in `kn-starter-u2-l1-e2`, `kn-starter-u2-l2-e1`,
  `kn-starter-u2-l2-e2`); 2 Hindi “Sorry” items preserved (both attested
  spellings); **zero native approvals**. Both passes ran on one model; they are
  not statistically independent. Reports at `review/ai-linguistic-review.*`.

## Stitch integration

Source: Google Stitch project `projects/18079353037178646113` (screens in
`design/stitch/html/*.html`, created 2026-11-15). The design system is
"Speeko Gamified Indian Language Learning".

Applied to the mobile app this cycle (visual + layout only, no new back-end
behaviour):

| Stitch screen | Landed in |
| --- | --- |
| `home-lesson-path.html` | Winding path with alternating node offsets, unit banner cards, real progress tracks, completed/current/locked pucks, `START · LESSON n` badge, bottom tab bar |
| `lesson-player.html` | Exit button, chunky bordered progress track, hearts pill, category ribbon, prompt card (ink border + slab), numbered option chips, tactile Check/Continue/Done |
| `sign-in.html` | Brand bar with dot, fox hero with speech bubble, segmented Sign in / Create account switcher, auth card with slab edge, tactile primary button |
| `profile.html` | Account profile header (avatar, verified/device-only label), app bar with fox avatar + real streak/XP pills |
| `brand-board.html` | Palette already matches (cream/green/fox/ink); `speeko` wordmark used in app bars |
| `progress.html` | Progress-track treatment reused; board-specific layouts not ported |
| `choose-language.html` | **Not integrated.** No onboarding flow exists on mobile; no Indic language copy can ship unreviewed |

Not imported, and why:

- Material Symbols / Nunito Sans variable fonts are not bundled into the RN
  build; text uses the platform font with the same weights and sizes.
- The Stitch raster mascot (marigold fox) is an IMAGE asset inside Stitch and was
  never exported; the app uses the already-bundled `apps/mobile/assets/fox.png`.
- Stitch's Google sign-in button was not ported — the API supports email +
  password only, and no OAuth path exists server-side.
- No English copy from Stitch that introduces unreviewed Indic text was copied.
- Web surfaces were **not** re-skin-ned this cycle; the Stitch pass is mobile-only.
- Touch feel (pressed travel) is implemented with margin/spacing translation,
  not physics-based shadows; on-device motion verification is outstanding
  (matches existing Reanimated usage on the welcome screen).

## Highest-impact remaining gaps

1. **No real device verification.** Nothing touches Android hardware or an
   emulator; no AVD exists, WHPX is disabled, and a device run is an owner
   call. See `docs/qa/android-device-qa.md`.
2. **No native-speaker review.** All 305 exercises are draft. Export and the
   review protocol (`scripts/export-review.mjs`, `review/REVIEW.md`) are ready;
   nothing is certified and nothing may ship as "reviewed".
3. **Mobile exercise parity** — wordBank/arrangeSentence/speak/typeWhatYouHear
   are blocked on mobile.
4. **Offline/sync edge cases** for a second device are only partially covered
   by unit-level sync tests; no two-device live run exists.
5. **No license.** The repo remains all rights reserved by default; the
   decision package is in `docs/decisions/2026-11-16-license.md`.
6. **Hosting/database decision** is still deferred by the owner; the
   recommendation package is in `docs/decisions/2026-11-16-hosting-and-database.md`.

## Definition of done for a release

The mobile app in this tree is a working alpha suitable for a controlled
internal trial on Android hardware: it can create/import progress, playable
draft lessons, honest fail-closed states, and account-synced rewards. It is
**not** a production release candidate until at least (1) a native-speaker
review pass, (2) on-device QA of the release build, (3) a hosting/database
choice, and (4) a license decision are complete. The progress endpoint's
reward integrity is verified at the database boundary (P13 + P17); visual and
linguistic authenticity are not yet verified anywhere.
