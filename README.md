# Speeko

A Duolingo-style language-learning app for ten Indian languages, built with original content, an original fox mascot, and original UI.

**Courses:** Hindi, Bengali, Marathi, Telugu, Tamil, Kannada, Malayalam, Gujarati, Punjabi, Odia. The interface is English; lessons teach the target language.

> Speeko is an independent learning project. It is not affiliated with Duolingo, and ships none of Duolingo's artwork, mascots, lesson text, or audio.

## Stack

| Layer | Technology |
| --- | --- |
| Web | Next.js 15 (App Router), React 19, Tailwind CSS |
| Mobile | Expo SDK 53, expo-router, React Native |
| API | Fastify 5, Drizzle ORM, pglite (dev) / Postgres |
| Auth | Better Auth (email + password sessions) |
| Core | TypeScript answer grading, streak math, progress merging, content schemas |
| Content | Zod-validated JSON courses, compiled into a static bundle |
| Tooling | pnpm workspaces, Turborepo, Vitest, Playwright |

## How to run

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000. `pnpm dev` starts the web app on port 3000 and the API on port 3001. The API creates a local pglite database automatically on first run — no database setup required.

| Command | What it does |
| --- | --- |
| `pnpm dev` | Web + API through Turbo |
| `pnpm --filter @speeko/web dev` | Web app on port 3000 (syncs courses first) |
| `pnpm --filter @speeko/api dev` | API on port 3001 (`/health`, `/api/auth/*`, `/api/progress`, `/api/lesson-completions`) |
| `pnpm --filter @speeko/mobile start` | Expo Go / emulator |
| `pnpm typecheck` | TypeScript across every package |
| `pnpm test` | Vitest suites for grading, progress merging, guidebook extraction, eligibility filtering, and all course content (108 core + 16 content), plus the mobile Jest suite (77 tests, 15 suites) through Turbo |
| `pnpm build` | Production builds for web, API, mobile-web, content |
| `pnpm lint` | ESLint for web and mobile (non-interactive) |
| `pnpm e2e` | Playwright route smoke tests + screenshots (requires `pnpm build`) |
| `pnpm verify` | typecheck → test → build → secrets scan → e2e |
| `pnpm sync:content` | Rebuild courses into `apps/web/public/courses` |

Android APK (local): requires JDK 17+ and the Android SDK. Run `cd apps/mobile && npx expo prebuild --platform android && cd android && ./gradlew assembleDebug` (debug) or `assembleRelease` (release-signed with the local keystore). The release APK lands at `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`; a copy exists at `dist/speeko-release.apk` (gitignored). The release APK render is verified on a Vivo V2336 (cold start to the learn screen); functional device QA is waived for the internal alpha. For a production APK, point the mobile client at the production API by setting `expo.extra.apiUrl` and `expo.extra.webOrigin` in `apps/mobile/app.json` at build time (see `apps/mobile/lib/api.ts`).

Web pages:

- `/` — landing page with live streak, XP, and course progress
- `/onboarding/language` — guided first-run setup (motivation, level, goal, commitment) ending in the first lesson
- `/learn` — language picker and continue-learning card
- `/learn/[courseId]` — unit path with locked/current/completed lessons, review and recap nodes, checkpoint practice nodes
- `/learn/[courseId]/guidebook/[unitIndex]` — unit guidebook extracted from the exercises ahead
- `/lesson/[courseId]/[lessonId]` — the lesson player (including review, checkpoints, trouble words, and per-unit practice)
- `/practice` — practice hub with due reviews, trouble words, and unit practice built from completed lessons
- `/sign-in`, `/sign-up` — account access
- `/account` — profile, cloud sync status, and sign out
- `/studio` — course JSON authoring with live validation and download

Mobile (Expo SDK 53) screens:

- `/onboarding/*` — language, motivation, level, daily goal, commitment (6 taps to the first lesson)
- `/learn` — course list with real per-course completion, continue card
- `/path/[courseId]` — winding unit path with completed/current/locked lessons (linear unlock)
- `/guidebook/[courseId]/[unitIndex]` — unit guidebook derived from the exercises ahead (words, phrases, lesson plan)
- `/lesson/[courseId]/[lessonId]` — 9 published exercise kinds, server-verified save with guest/local fallback
- `/practice`, `/practice/[courseId]` — due-only spaced review, no XP
- `/habits` — verified/device-only goals, 12-week calendar, quests, achievements
- `/shop` — gem-based one-time fox cosmetics and streak freezes (ownership enforced server-side)
- `/leagues`, `/people` — weekly standings and follow-by-username against real accounts
- `/account` — verified/device progress, cloud merge, sign-out isolation

Mobile does not support `chooseImage`; it renders a blocking screen and can never be completed.

See [`docs/product/current-state-and-parity.md`](docs/product/current-state-and-parity.md) for the full parity matrix and test evidence.

## Lesson player

Each lesson starts with **5 hearts**, one answer per exercise, and a progress bar that fills as answers are recorded.

- **Ten exercise boards:** choose meaning, type translation, match pairs, fill blank, listen-and-choose, word bank, arrange sentence, choose image, type what you hear, and speaking practice.
- **Answer grading** is centralized in `@speeko/core` (`gradeExercise`), so web and mobile share the same normalization, Levenshtein tolerance, and soft-speech scoring.
- **Feedback** shows the correction, removes a heart on a wrong answer, and tracks XP and combo. A match-pairs mismatch blocks submission and offers a board reset without losing a heart.
- **Speaking** uses browser speech recognition when available and falls back to typed input; listening exercises expose a "Show the phrase" fallback when no Indic voice is installed.
- **Exit guard**, out-of-hearts screen, retry, completion summary, confetti, and next-lesson navigation are all implemented.
- **Practice modes** reuse real exercises from completed lessons: due review, trouble words, and per-unit practice. They award no XP and write no course completion, but they do move each practiced word through its spaced-repetition box.
- **Mascot:** Speeko the fox is an original inline SVG with idle, happy, sad, and celebrate moods. A Rive animation can replace it later without changing the player shell.

## Progress and accounts

Guests learn without an account. Progress is stored in the browser under `speeko.progress.v2` (the legacy `speeko.progress.v1` key is still read forever) and is shaped like the server model:

- Onboarding preferences (language, motivation, level, daily goal, commitment) are stored separately under `speeko.onboarding.v1`; they never award XP and never require an account.

- Completed lessons with accuracy, XP earned, and timestamp
- Total XP, level, streak, and last active date
- Daily XP toward a goal (default 50 XP; the preference is stored, the settings UI is not built yet)
- Last course and lesson for the continue card
- Spaced-repetition cards in Leitner boxes 1/2/4/8/16; legacy SM-2 cards are normalised on read without changing their due date

Snapshot `v1` remains readable and is never rewritten in place. `v2` adds `dailyGoal` and `timeZone`; loading an old snapshot runs a lenient migration that drops corrupt lesson/SRS entries, clamps negatives, resets stale daily XP, and writes `v2` on the next save.

Signing up merges the local snapshot into the account, so nothing earned as a guest is lost. While signed in, a finished lesson is sent to `POST /api/lesson-completions` as raw answers. The server re-grades the attempt against the tracked course JSON, applies the same combo/hearts/XP rules from `@speeko/core`, and writes an append-only `lesson_events` row keyed by `(user_id, attempt_id)`. A retry with the same attempt id returns the original event instead of awarding XP twice. Completion XP and the lesson gem are granted only on the first completion of each learner/course/lesson, enforced by a unique `lesson_completion_rewards` row; later attempts are fully graded practice with zero completion XP and no gem.

If that save cannot reach the server, the learner sees **Reward not saved** with a Retry button; signed-in attempts are not awarded locally. Guests and practice sessions still save locally and work fully offline.

Authentication uses Better Auth email + password sessions. The API mounts the Better Auth handler at `/api/auth/*` and protects progress and lesson-completion routes with the session cookie.

> **Current boundary:** `PUT /api/progress` remains a guest-import/snapshot-sync layer. It validates shape and merges conservatively, but it is not authoritative for XP. First-completion rewards are authoritative through `lesson_completion_rewards`; profiles, leagues, quest gems, and lesson counts derive from that ledger, while activity/streak history derives from `lesson_events`. Neither path reads rewards from the snapshot.

Local development needs no configuration. To customize, copy the examples:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

`BETTER_AUTH_SECRET` is required in production (the API refuses to start without it). Without `DATABASE_URL`, the API uses pglite at `apps/api/data`; point `DATABASE_URL` at Postgres to use a hosted database instead.

A completed lesson unlocks the next one in its unit. Streaks use the shared `updateStreak` helper from `@speeko/core`; snapshot merging and validation live there too.

## Content pipeline

```
content/<locale>/<course>.json
        │  Zod validation (ids, locales, exercise shapes)
        ▼
@speeko/content CLI → content/dist/ (courses + manifest.json)
        ▼
apps/web/public/courses/ (synced automatically on dev/build)
```

The seeded starter bundle contains **10 courses × 4 units × 2 lessons × 3 exercises = 230 exercises** (one mislabeled English filler exercise per starter was removed 2026-11-16). P4 adds one draft pilot, `content/hi/hi-pilot.json`: **5 units × 5 lessons × 3 exercises = 75 exercises**, with `reviewStatus: "draft"` on every lesson. The content tests grade every exercise to confirm each answer key is reachable (305 total).

Optional course fields now include `reviewStatus` (`draft`/`reviewed`, default `draft`), `reviewer`, unit/lesson `guidebook`, and exercise `vocabId` / `transliteration`. Reviewed content requires a reviewer. `ATTRIBUTIONS.md` records font/third-party attribution and the policy for any imported phrases (none are present in the current curriculum).

Authoring workflow: open `/studio`, paste or edit course JSON, validate live, download the file, and place it under `content/<locale>/`. Then run `pnpm sync:content`.

## Project layout

```
apps/
  api/        Fastify + Drizzle + Better Auth (pglite for local dev)
  web/        Next.js app, lesson player, progress store, mascot
  mobile/     Expo app sharing @speeko/core
packages/
  core/       Grading, schemas, streak math, shared types
  content/    Validation, build CLI, course test suite
content/      Per-locale course JSON
```

## Verification

- `pnpm typecheck` — 5 packages clean (6 Turbo tasks including dependency builds)
- `pnpm test` — 108 core + 16 content (Vitest) and 77 mobile (Jest, 15 suites), all passing
- `pnpm build` — web, API, mobile-web export (22 static routes), and content bundle all succeed
- `pnpm lint` — web and mobile pass (one intentional `<img>` warning in the lesson player)
- `pnpm e2e` — 150 Playwright checks across routes, onboarding, rewards, reward integrity, habits, shop, social, practice, rate limiting, license texts, and the progress-endpoint integrity boundary at 1280×800 and 390×844 with zero console/page errors. Screenshots live in `docs/qa/` and are inspected each phase
- `pnpm verify` — runs typecheck → test → build → secrets scan → e2e in order
- Migrations are applied on API startup. `lesson_events` (0002) and `lesson_completion_rewards` (0005) were smoke-tested; 0005 was applied to a fresh pglite directory and to a populated pre-0005 database with historical events, verifying the non-destructive backfill.

Playwright uses the installed Google Chrome, so `pnpm e2e` does not download a browser. It serves the production web build and the compiled API, so run `pnpm build` first (or use `pnpm verify`).

Project status is tracked in [`docs/PROGRESS.md`](docs/PROGRESS.md), durable choices in [`docs/DECISIONS.md`](docs/DECISIONS.md), current web/mobile parity in [`docs/product/current-state-and-parity.md`](docs/product/current-state-and-parity.md), the release-readiness verdict in [`docs/READINESS.md`](docs/READINESS.md), and the original ground-truth audit in [`docs/AUDIT.md`](docs/AUDIT.md).

## License

- **Source code:** Apache License 2.0 — [`LICENSE`](LICENSE).
- **Course content, fox mascot, name/wordmark, design, and docs:** All Rights Reserved — [`LICENSE-CONTENT`](LICENSE-CONTENT).
- **Bundled fonts (Baloo 2, Nunito):** SIL Open Font License 1.1 — [`apps/web/public/fonts/OFL.txt`](apps/web/public/fonts/OFL.txt).
- **Third-party attributions:** [`NOTICE`](NOTICE) and [`ATTRIBUTIONS.md`](ATTRIBUTIONS.md).

## Roadmap

1. Rive fox asset authored in Rive (runtime integration already in place)
2. Native-speaker review of the 305 draft exercises (review package and protocol ready)
3. Functional on-device QA pass on the release build (owner-run; the render pass is done)
4. Hosting/database choice, backups, secret rotation
5. Play Store accounts and listing (draft metadata ready; not published)
