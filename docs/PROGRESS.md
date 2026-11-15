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
| P1 — Safety net | `pnpm verify`, Playwright smoke + screenshots, ESLint, snapshot v2 + v1 migration | **Done** — branch `phase/1-safety-net` |
| P2 — Server-verified rewards | Lesson-completion endpoint, re-grade on server, append-only events, idempotency | **Next** |

Later phases (practice, content depth, SRS, economy, social, settings, mobile
parity) follow the master plan. Hosting is deferred by the owner until the
UI/product phases are done.

## Verification snapshot (P1)

Run from the repo root:

| Command | Result |
| --- | --- |
| `pnpm typecheck` | 6/6 Turbo tasks (5 package typechecks + dependency builds) |
| `pnpm test` | 69 tests — 58 core + 11 content |
| `pnpm build` | 5/5 Turbo tasks |
| `pnpm lint` | Passes; one intentional `<img>` warning in the lesson player |
| `pnpm e2e` | 22 Playwright checks (9 routes × 2 viewports, legacy v1 read, lesson feedback) |
| `pnpm verify` | typecheck → test → build → e2e, all green |

Visual evidence: 20 screenshots in [`docs/qa/`](./qa/), plus desktop and
mobile contact sheets. Every route was inspected after the run; two defects
found this way were fixed (mobile header wrapping, test-readiness race that
captured the course skeleton).

## What P1 changed

- **Progress snapshot v2.** `version: 2` adds `dailyGoal` (default 50) and
  `timeZone` (default `null`). v1 has its own schema, is still readable
  forever, and is never rewritten in place. `migrateProgress` is lenient:
  corrupt lesson/SRS entries are dropped, negatives clamp to zero, stale
  daily XP resets, and unknown versions become a clean v2 snapshot.
- **Storage keys.** New writes go to `speeko.progress.v2`; the web app reads
  v2 first and falls back to the v1 key. The API accepts v1 and v2 payloads
  and stores v2.
- **`pnpm verify`** chains typecheck, unit tests, production builds, and the
  Playwright suite (the suite needs built web/API output).
- **Playwright** uses the installed Chrome (`channel: 'chrome'`) — no browser
  download. 1280×800 and 390×844 projects, viewport screenshots, and
  assertions that each route produces zero page errors and zero console errors.
- **ESLint** is committed and non-interactive for web (`next/core-web-vitals`)
  and mobile (`eslint-config-expo`, legacy config for SDK 53).
- **Honest copy.** The signed-in "Weekly League" card is now "Your
  milestones": it is a solo XP ladder with no peers, so it no longer implies
  competition. Real leagues wait for real players.

## Known gaps after P1

These are unchanged product gaps, not regressions. Details and evidence are in
[`AUDIT.md`](./AUDIT.md).

- Rewards are still client-trusted. `PUT /api/progress` validates shape and
  merges, but XP/streak/completion totals are reported by the client. P2 fixes
  this; do not build leagues, quests, or gems on the snapshot.
- SRS is simplified SM-2, not the mandated Leitner 1/2/4/8/16 boxes. Existing
  cards persist in snapshots.
- `timeZone` is stored but day boundaries still use the browser/server local
  day. Timezone-aware days are a later phase.
- No practice hub, quests, achievements, gems/shop, settings, public profiles,
  or social graph. Controls that do not exist are labelled "coming soon".
- Content is 4 units / 8 lessons / 24 exercises per course (240 exercises).
  There is no `reviewStatus` field yet; new Indic content becomes `draft` from
  P4 onward.
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
