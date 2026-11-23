# Speeko — Phase 0 Audit

**Date:** 2026-11-15
**Branch:** `phase/0-audit` (created from `main`)
**Start commit:** `fd21505` — "feat(ui): premium polish pass - staggered entrances, micro-interactions, tokens"
**Tree at start:** clean (`git status --short` empty), `main` level with `origin/main`.

This is an audit only. No product code was changed. The only file added is this document.

---

## 1. Ground truth

### 1.1 Repository

- Monorepo: `apps/web` (Next.js 15.1.3, React 19, Tailwind 3.4), `apps/mobile` (Expo SDK 53, RN 0.79.6, expo-router 5, Reanimated 3.17.4, expo-haptics), `apps/api` (Fastify 5, Drizzle, pglite dev / Postgres, Better Auth 1.7.25), `packages/core`, `packages/content`.
- Tooling: pnpm 11.22.0 workspaces + Turborepo 2.11.11 + Vitest 3.
- Root scripts: `build`, `dev`, `lint`, `typecheck`, `test`, `sync:content`.
- **There is no `pnpm verify` script.**
- 148 tracked files. No `LICENSE`, no `ATTRIBUTIONS.md`, no `docs/qa/`.

### 1.2 Routes actually present (confirmed by `next build`)

| Route | Purpose |
| --- | --- |
| `/` | Landing + continue card |
| `/learn` | Language picker (10 courses) + continue card |
| `/learn/[courseId]` | Unit path (4 units, lesson nodes only) |
| `/lesson/[courseId]/[lessonId]` | Lesson player; `lessonId === 'review'` is the SRS review mode |
| `/sign-in`, `/sign-up` | Better Auth email + password |
| `/account` | Own stats, sync status, sign out, solo league card |
| `/studio`, `/studio/[id]` | Course JSON authoring / validation |

No Practice, Quests, Leagues, Shop, or Settings routes exist.

### 1.3 Content

Verified by parsing every `content/<locale>/<course>.json`:

| Metric | Value |
| --- | --- |
| Courses | 10 (hi, bn, mr, te, ta, kn, ml, gu, pa, or) |
| Units per course | 4 |
| Lessons per course | 8 (2 per unit) |
| Exercises per course | 24 (3 per lesson) |
| **Total exercises** | **240** |
| Exercise kinds | 10 — chooseMeaning, wordBank, typeTranslation, listenChoose, typeWhatYouHear, matchPairs, arrangeSentence, fillBlank, speak, chooseImage |

**Stale assumption in SPEEKO MASTER:** it states "3 units × 2 lessons × 3 exercises = 180 exercises". The repo is at **4 units / 240 exercises** (Unit 4 "Beyond Five" was added in `bc70db8`). The path is still far too short for a Duolingo-like product.

### 1.4 API surface

- `GET /health`, `GET /locales`, `/api/auth/*` (Better Auth), `GET /api/progress`, `PUT /api/progress`.
- Progress is a single validated JSON snapshot per user (`progress_snapshots`), protected by the session cookie.
- Drizzle tables `courses`, `srs_cards`, `streaks`, `energy`, `progress` exist in `apps/api/src/db/schema.ts` but **only `progress_snapshots` is read/written**. The rest is unused schema.
- **No `POST /api/lesson-completions`, no events table, no idempotency key, no gem ledger.**
- Auth is cookie-only. There is no bearer/token plugin, so the Android app cannot authenticate against the API today.

### 1.5 Mobile

- `apps/mobile/app/` contains exactly two files: `_layout.tsx` and `index.tsx` (the branded welcome screen).
- Reanimated + expo-haptics are installed; lottie-react-native and rive-react-native are **not**.
- No path, lesson player, practice, account, or sync client. Mobile is a welcome screen, not a parity client.
- Release APK (`dist/speeko-release.apk`, 21.6 MB) exists locally but is gitignored and was never launch-verified on a device (no adb device attached in the prior session).

### 1.6 Verification commands (run during this audit)

| Command | Result |
| --- | --- |
| `pnpm test` | **59 passed** — 48 core (4 files) + 11 content (2 files). Exit 0. |
| `pnpm typecheck` | **6/6 turbo tasks successful** (5 package typechecks + the `^build` dependency task that `turbo.json` requires). Exit 0. |
| `pnpm build` | **5/5 tasks successful**, 55.2s (1 cached). Web routes generated; mobile web export + API + content bundle succeeded. Exit 0. |
| `pnpm lint` | **FAILS.** `@speeko/web` runs `next lint`, which has no ESLint config and opens the interactive setup prompt, then exits 1. `@speeko/mobile` reports "No ESLint config found. Configuring automatically." No lint config is committed. |

No screenshots were taken. P0 produces no UI and this environment has no headless browser configured.

---

## 2. README claims — reproducible?

| README claim | Verdict | Evidence |
| --- | --- | --- |
| "`pnpm typecheck` — 5/5 packages clean" | **TRUE in substance** | Turbo reports 6/6 tasks because `typecheck` depends on `^build`; the 5 package typechecks pass. |
| "`pnpm test` — 43 tests (32 core + 11 content)" | **STALE, but green** | Actual: **59 tests (48 core + 11 content)**, all passing. |
| "`pnpm build` — web, API, mobile-web export, content bundle succeed" | **TRUE** | 5/5 tasks, 55.2s. |
| "Fresh-database migration check passes on pglite" | **NOT REPRODUCIBLE** | No migration test, no script that creates a fresh DB and migrates it. `db:migrate` exists but nothing runs it in CI/verify. |
| "End-to-end browser checks cover [full lesson flow, ten boards, hearts, pairs, persistence, accounts, merge, cloud sync, sign-out, mobile layouts, exit modal], no console errors" | **NOT REPRODUCIBLE** | **No Playwright/Cypress dependency, no `*.spec.*`/e2e files, no e2e script anywhere in the repo.** This claim must be removed or backed by committed tests. |
| "10 courses × 3 units × 2 lessons × 3 exercises = 180 exercises" | **STALE** | Actual 4 units / 8 lessons / 24 exercises per course = **240**. |
| "Ten exercise boards" | **TRUE** | 10 kinds in `packages/core/src/content.ts`. |
| "Five hearts per lesson" | **TRUE** | `INITIAL_HEARTS = 5` in `packages/core/src/session.ts`; per-lesson, resets each attempt. |
| "Rive fox ... runtime integration already in place" | **REMOVED** | Rive was removed; the fox is a free inline-SVG rig. Web uses Tailwind keyframes, mobile uses `react-native-svg` + `react-native-reanimated`. |
| "Native mobile account and sync client" listed as roadmap | **TRUE (missing)** | Only a welcome screen exists. |

---

## 3. Feature map vs SPEEKO MASTER §3

Legend: **DONE** = works end to end; **PARTIAL** = some of it exists; **MISSING** = no implementation.

### LEARN

| Feature | Status | Evidence / gap |
| --- | --- | --- |
| Onboarding: language, motivation, level, daily goal, commitment, first lesson before signup | **MISSING as a flow** | `/learn` is only a language picker (`apps/web/app/learn/page.tsx`). Guests can start a lesson without an account (implicit), but there are no motivation/level/goal/commitment steps and no onboarding route. |
| Sections / units / lessons path | **PARTIAL** | Units + lessons render in `apps/web/app/learn/[courseId]/page.tsx`. No sections, no per-section milestones. |
| Node types (lesson, review, chest, checkpoint) | **MISSING** | Only lesson nodes. Review is one banner link to `/lesson/<course>/review` (`page.tsx:161`), not a path node. |
| Unit guidebook | **MISSING** | No guidebook UI or content field. |
| Continue button | **DONE** | `continueHref` on `/` (`apps/web/app/page.tsx:45`), continue CTA at path foot. |
| Course switcher | **PARTIAL** | `/learn` lists all 10 courses; no in-course/header switcher. |

### LESSON

| Feature | Status | Evidence / gap |
| --- | --- | --- |
| 10 exercise boards | **DONE** | `apps/web/components/lesson/ExerciseBody.tsx`. |
| Wrong answers re-queued at end of session | **MISSING** | `session.ts` records `mistakes[]` but finishes at the last index; nothing re-inserts mistakes. The only in-app mention is a static "Mistakes are data" line. |
| End-of-lesson image flashcards (say the word, skip, missed cards return, struggle summary) | **MISSING** | No flashcard component or route. |

### PRACTICE

| Feature | Status | Evidence / gap |
| --- | --- | --- |
| Mistakes review | **MISSING** | `mistakes[]` is never surfaced after a lesson. |
| Due-for-review words (spaced repetition) | **PARTIAL** | SRS review mode: `apps/web/lib/review.ts`, `packages/core/src/srs.ts`, `apps/web/app/lesson/[courseId]/review` via `lessonId === 'review'`. **Deviation:** it is simplified SM-2 (ease/repetitions/interval), not the mandated Leitner 1/2/4/8/16. |
| Flashcards | **MISSING** | — |
| Listening session | **MISSING** | Individual `listenChoose` / `typeWhatYouHear` exercises exist; no session type. |
| Speaking session | **MISSING** | Individual `speak` exercises exist; no session type. |

### HABIT

| Feature | Status | Evidence / gap |
| --- | --- | --- |
| XP + levels | **DONE** | `packages/core/src/gamification.ts` (`xpForExercise`, `xpForLevel`, `levelForXp`), used on `/` (`page.tsx:47`). |
| Daily goal | **PARTIAL** | Fixed `DAILY_GOAL = 50` (`packages/core/src/progress.ts`); progress shown, but the learner cannot set it. |
| Streak | **DONE** | `updateStreak` in core; shown in account + summary. **Calendar and freeze are MISSING** (only unused `streaks`/`energy` tables and constants). |
| Daily quests | **MISSING** | — |
| Achievements | **MISSING** | — |

### ECONOMY

| Feature | Status | Evidence / gap |
| --- | --- | --- |
| Gems (earned only) | **MISSING** | No ledger, balance, or UI. |
| Shop | **MISSING** | Only a "Shop & full league ladder — coming soon" line in `apps/web/components/AccountPanel.tsx`. |
| Fox cosmetics (SVG layers) | **MISSING** | One fox with moods; no layer system. |
| Streak freeze | **MISSING** | — |
| XP boost | **MISSING** | — |

### SOCIAL

| Feature | Status | Evidence / gap |
| --- | --- | --- |
| Weekly leagues from real XP | **MISSING** | **Label risk:** `AccountPanel.tsx` has a "Weekly League" card driven only by the current learner's lifetime XP against locally hard-coded thresholds. It is not a leaderboard, there are no peers, and the label implies competition that does not exist. Rename to an explicitly solo milestone or remove before P8. |
| Profile | **PARTIAL** | `/account` shows own stats, level, streak, sync status; not a public profile. |
| Follow by username | **MISSING** | No social graph, usernames, or API. |
| Friends' real progress | **MISSING** | — |

### SETTINGS

| Feature | Status | Evidence / gap |
| --- | --- | --- |
| Sound | **MISSING** | No sound assets or toggle. |
| Reduced motion | **PARTIAL** | Global `prefers-reduced-motion` CSS block in `apps/web/app/globals.css`; no in-app toggle. |
| Transliteration display (native / Roman / both) | **MISSING** | — |
| Reminders | **MISSING** | — |
| Account | **PARTIAL** | `/account`, sign-in/up, sign-out. No email change, password reset UI, or delete account. |

---

## 4. Architecture rules (§4) compliance

| Rule | Status | Evidence |
| --- | --- | --- |
| Rules live in `packages/core` as pure functions with tests | **PARTIAL** | Grading, streak, merge, SRS, session reducer are pure and tested. But the lesson XP award is added in the UI (`session.xp + entry.lesson.xpReward` in `LessonPlayer.tsx`), and rule numbers are split between `gamification.ts` and `progress.ts`. |
| `POST /api/lesson-completions` with re-grade, shared XP rules, append-only event, `attemptId` idempotency | **MISSING** | Only client-trusted `PUT /api/progress` (`apps/api/src/routes/progress.ts`). A client can submit any XP/streak/completion. |
| Leaderboards/quests/gems derive from events only | **MISSING** | No events. No quests/gems. |
| Guest mode works offline | **DONE** | `localStorage` key `speeko.progress.v1` (`apps/web/lib/progress.ts`). |
| Signup merges guest progress without double counting | **DONE** | `mergeProgress` in core + `ProgressSync`; conservative union/higher-wins merge. |
| Snapshot `v1` preserved; add `v2` + migration reading v1 forever + tests | **MISSING** | `ProgressStateSchema` is `version: z.literal(1)` (`packages/core/src/progress.ts:20`). No v2, no migration. |
| Additive content fields only (vocab ids, transliteration, guidebook, reviewStatus) | **MISSING** | None of those fields exist in `packages/core/src/content.ts` or `packages/content`. `reviewStatus` is absent repo-wide. |
| Time: day boundary in user's IANA timezone; league week Monday Asia/Kolkata | **MISSING** | `todayKey()` uses server/browser local time; no timezone stored. |
| All numbers in one config file | **MISSING** | `DAILY_GOAL` in `progress.ts`, XP table/energy/league thresholds in `gamification.ts`, UI copy/constants elsewhere. |
| SRS = simple Leitner boxes 1/2/4/8/16 | **DEVIATION** | `packages/core/src/srs.ts` is explicitly "simplified SM-2" (ease 1.3–2.5, repetitions, lapses). Cards already round-trip in v1 snapshots, so switching to Leitner needs a data migration/tolerant reader in P5. |
| Backend stays Fastify + Drizzle + Better Auth | **DONE** | — |
| No fabricated users/leaderboards/XP/etc. | **MOSTLY** | No fake peers anywhere. Exception: the solo "Weekly League" label noted above. |

---

## 5. Risks and landmines (ranked)

1. **Progress is fully client-trusted.** `PUT /api/progress` accepts a validated-shape snapshot and merges it. Any user can inflate XP, streak, completed lessons, and SRS state. This blocks honest leagues/quests/gems (P2 is designed to fix it). Do not build P6/P7/P8 on top of the snapshot.
2. **No repeatable visual/e2e verification, despite README saying there is.** P1 must add Playwright + screenshots before UI-heavy phases. Without it, every later "looks right" claim is unverifiable.
3. **`pnpm lint` fails and `pnpm verify` does not exist.** P1 acceptance depends on both.
4. **Content is thin and unreviewed.** 8 lessons/course is not a learning path. There is no `reviewStatus`, so "draft" cannot even be represented yet. Nothing currently claims to be reviewed, but P4 must introduce the field before adding content.
5. **SRS already persists SM-2 cards in v1 snapshots.** Replacing with the mandated Leitner model is a migration, not a swap. Do not silently reinterpret existing `ease`/`intervalDays`.
6. **Solo XP is labelled "Weekly League".** Contradicts the honest-data rule. Fix wording in P1/P8; do not add fake rows.
7. **Repo becomes public with no LICENSE.** Default copyright = all rights reserved; nobody may legally reuse it. Add a license (or an explicit "all rights reserved" note) deliberately. Also no `ATTRIBUTIONS.md` yet for future Tatoeba/unDraw/Rive assets.
8. **Mobile is not a client.** One welcome screen; cookie-only API means sync cannot work. P9 has real scope, not just a motion pass.
9. **Release signing material lives outside git.** `apps/mobile/android/app/release.keystore` + password file are gitignored and may be destroyed by a clean checkout/CI. Back them up out of band.
10. **Docs referenced by the master plan do not exist.** `docs/PROGRESS.md` and `docs/DECISIONS.md` are absent; `docs/` contains only `ui-polish.md`. Create them in P1 and keep them current.
11. **Unused schema/constants mislead future work.** `courses`, `srs_cards`, `streaks`, `energy` tables and `MAX_ENERGY`/league helpers are dead code today. Migrations must not assume they hold data.
12. **APK unverified on hardware.** Hermes crash was fixed, but no device confirmed launch; no store listing.

---

## 6. Open product decisions (§5)

| ID | Decision | Current behaviour | Default in effect |
| --- | --- | --- | --- |
| D1 | Hearts: per-lesson vs global + regen + gem refill | **Per-lesson**, 5 hearts, resets each attempt (matches default). `energy` table/helpers exist unused. | Keep per-lesson until owner says otherwise. |
| D2 | League size / minimum real players | No leagues implemented. Do not show any league until real players exist; use "early community" state under 10. | Default stands; not yet applicable. |
| D3 | Gem sources and prices | No gems. | Default: lesson +5, daily quest +10, streak freeze 50 — to implement in P7 only. |
| D4 | Who reviews Indic content | No reviewer, no `reviewStatus` field. | Nobody yet; all new content must be `draft` from P4 onward. |
| D5 | Mobile scope | Welcome screen only. | Web-first; parity in P9. |

No new product decision was required for this audit, so `docs/DECISIONS.md` was not created (P0 is audit-only).

---

## 7. Corrections to the master brief

- Content is **4 units / 8 lessons / 24 exercises per course (240 total)**, not 3/2/3 (180).
- Tests are **59**, not 43.
- `docs/PROGRESS.md`, `docs/DECISIONS.md`, and `docs/qa/` do not exist.
- The README's e2e and fresh-migration claims are currently false/unverifiable.
- `pnpm typecheck` is green but Turbo reports 6 tasks, not 5, because `typecheck` depends on `^build`.
- Expo SDK 53 / RN 0.79.6 / Reanimated 3.17.4 confirmed. Reanimated and haptics are present; Rive/Lottie native libraries are not.

---

## 8. Recommended Phase 1 scope (not started)

1. Add `pnpm verify` = typecheck + test + build + e2e, wired through Turbo.
2. Add Playwright, authenticate a guest flow, and screenshot every existing route at 1280×800 and 390×844 into `docs/qa/`.
3. Add minimal, committed ESLint configs for web and mobile; make `pnpm lint` non-interactive.
4. Add snapshot **v2 + v1 migration** with tests, including the SRS card shape (do not change v1 semantics).
5. Fix README claims (tests, content, remove unbacked e2e claim) and add `docs/PROGRESS.md` / `docs/DECISIONS.md`.
6. Rename or de-scope the solo "Weekly League" card wording.

P0 ends here. No code was changed; nothing was pushed.
