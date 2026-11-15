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
| Core | TypeScript answer grading, streak math, content schemas |
| Content | Zod-validated JSON courses, compiled into a static bundle |
| Tooling | pnpm workspaces, Turborepo, Vitest |

## How to run

```bash
pnpm install
pnpm --filter @speeko/web dev
```

Open http://localhost:3000.

| Command | What it does |
| --- | --- |
| `pnpm dev` | All dev servers through Turbo |
| `pnpm --filter @speeko/web dev` | Web app on port 3000 (syncs courses first) |
| `pnpm --filter @speeko/api dev` | API on port 3001 (`/health`, locales) |
| `pnpm --filter @speeko/mobile start` | Expo Go / emulator |
| `pnpm typecheck` | TypeScript across every package |
| `pnpm test` | Vitest suites for core grading and all course content |
| `pnpm build` | Production builds for web, API, mobile-web, content |
| `pnpm sync:content` | Rebuild courses into `apps/web/public/courses` |

Web pages:

- `/` — landing page with live streak, XP, and course progress
- `/learn` — language picker and continue-learning card
- `/learn/[courseId]` — unit path with locked/current/completed lessons
- `/lesson/[courseId]/[lessonId]` — the lesson player
- `/studio` — course JSON authoring with live validation and download

## Lesson player

Each lesson starts with **5 hearts**, one answer per exercise, and a progress bar that fills as answers are recorded.

- **Ten exercise boards:** choose meaning, type translation, match pairs, fill blank, listen-and-choose, word bank, arrange sentence, choose image, type what you hear, and speaking practice.
- **Answer grading** is centralized in `@speeko/core` (`gradeExercise`), so web and mobile share the same normalization, Levenshtein tolerance, and soft-speech scoring.
- **Feedback** shows the correction, removes a heart on a wrong answer, and tracks XP and combo. A match-pairs mismatch blocks submission and offers a board reset without losing a heart.
- **Speaking** uses browser speech recognition when available and falls back to typed input; listening exercises expose a "Show the phrase" fallback when no Indic voice is installed.
- **Exit guard**, out-of-hearts screen, retry, completion summary, confetti, and next-lesson navigation are all implemented.
- **Mascot:** Speeko the fox is an original inline SVG with idle, happy, sad, and celebrate moods. A Rive animation can replace it later without changing the player shell.

## Progress model

Progress is currently stored in the browser under `speeko.progress.v1` and is intentionally shaped like the future server model:

- Completed lessons with accuracy, XP earned, and timestamp
- Total XP, level, streak, and last active date
- Daily XP toward a 50 XP goal
- Last course and lesson for the continue card

A completed lesson unlocks the next one in its unit. Streaks use the shared `updateStreak` helper from `@speeko/core`. Better Auth and server-side progress sync are planned; the local store is the migration source.

## Content pipeline

```
content/<locale>/<course>.json
        │  Zod validation (ids, locales, exercise shapes)
        ▼
@speeko/content CLI → content/dist/ (courses + manifest.json)
        ▼
apps/web/public/courses/ (synced automatically on dev/build)
```

The seeded starter bundle contains **10 courses × 3 units × 2 lessons × 3 exercises = 180 exercises**. The content tests grade every exercise to confirm each answer key is reachable.

Authoring workflow: open `/studio`, paste or edit course JSON, validate live, download the file, and place it under `content/<locale>/`. Then run `pnpm sync:content`.

## Project layout

```
apps/
  api/        Fastify + Drizzle service (pglite for local dev)
  web/        Next.js app, lesson player, progress store, mascot
  mobile/     Expo app sharing @speeko/core
packages/
  core/       Grading, schemas, streak math, shared types
  content/    Validation, build CLI, course test suite
content/      Per-locale course JSON
```

## Verification

- `pnpm typecheck` — 5/5 packages clean
- `pnpm test` — 37 tests (26 core + 11 content), all passing
- `pnpm build` — web, API, mobile-web export, and content bundle all succeed
- End-to-end browser checks cover the full lesson flow, all ten exercise boards, hearts/out-of-hearts, pair mismatch/reset, progress persistence and unlocking, mobile layouts, and the exit modal, with no console errors

## Roadmap

1. Better Auth + server-side progress sync
2. Rive fox with animation states
3. Android APK via EAS
4. Expanded course content beyond the starter tier
