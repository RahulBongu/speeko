# duo

Workspace for the Duolingo-style language-learning app (the "fox/husky" clone) **and** the home of the OpenCode session that planned it.

## Session data

The planning session was re-rooted from `C:/` to `C:/duo` via `opencode.session_move`, so it now belongs to this workspace and shows up in the session list for this directory.

| Item | Value |
| --- | --- |
| Session ID | `ses_e3a9c29f5ffeQfEfD7dKaBDE5C` |
| Title / slug | `duolingo` / `eager-forest` |
| Created | 2026-11-10 12:16 UTC |
| Messages | 46 chat turns (65 total records) |
| Source DB | `C:\Users\rahul\.local\share\opencode\opencode.db` (table `session_v2` / `session_message`) |

### Exported copies (`.session/`)

| File | Size | Contents |
| --- | --- | --- |
| `session.json` | 304 KB | Full-fidelity dump: session row, project row, every message record with raw JSON |
| `transcript.md` | 62 KB | Readable conversation transcript (user/assistant turns, system events collapsed into `<details>`) |
| `summary.json` | 0.6 KB | Metadata: id, title, timestamps, token counts, message-type breakdown |
| `export-session.mjs` | — | The exporter; re-run with `node .session\export-session.mjs [sessionId]` to refresh |

Re-running the exporter reads the live DB read-only, so it can be used to snapshot the session at any point.

## App plan (from the session)

- Monorepo: pnpm workspaces + Turborepo — `packages/{core,content,ui,api-client}`, `apps/{api,web,mobile}`, `content/`
- Web: Next.js 15 (App Router), TypeScript, Tailwind, Framer Motion, Rive (mascot)
- Mobile: Expo + expo-router, Reanimated 3, Gesture Handler, Rive
- API: Fastify + Drizzle + Postgres + Redis · Auth: Better Auth
- 10 Indian languages: Hindi, Bengali, Marathi, Telugu, Tamil, Kannada, Malayalam, Gujarati, Punjabi, Odia — requires a per-locale font pipeline, morphology-aware distractor generation, transliteration toggle, native numerals, and locale-aware collation
- Original art/characters and original or open-licensed course content only
- Mascot: **Speeko the fox** (original character; see `apps/web/public/fox.svg`)

## Build status (verified)

| Package | Typecheck | Build | Tests |
| --- | --- | --- | --- |
| `@speeko/core` | ✅ | ✅ (tsc) | ✅ 16/16 |
| `@speeko/api` | ✅ | ✅ (tsc) | — |
| `@speeko/web` | ✅ | ✅ (Next.js) | — |
| `@speeko/mobile` | ✅ | ✅ (Expo web export) | — |

Run everything: `pnpm typecheck && pnpm build && pnpm test` (and `pnpm --filter @speeko/mobile run build` for the mobile bundle).

## How to run

- Web: `pnpm --filter @speeko/web dev` → http://localhost:3000
- API: copy `apps/api/.env.example` to `apps/api/.env`, set `DATABASE_URL`, then `pnpm --filter @speeko/api dev` → http://localhost:3001
- Mobile: `pnpm --filter @speeko/mobile start` (Expo Go / emulator). APK builds later via EAS (`eas build --platform android`).
- Mobile web bundle: `pnpm --filter @speeko/mobile run build` → `apps/mobile/dist`

## Current status

P0 foundation scaffolded and green: monorepo, core domain engine (locale, content schema, gamification, SRS, session state machine, morphology hooks), Fastify+Drizzle API skeleton, Next.js web shell, Expo mobile shell. Next: auth (Better Auth), content authoring, lesson player UI, and the fox mascot in Rive.
