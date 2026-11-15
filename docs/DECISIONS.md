# Speeko — Decisions

Durable product and engineering choices, in the order they were made. Append
new decisions; do not silently reverse old ones. Open questions belong in the
phase report or `PROGRESS.md`, not here.

## Product decisions (P0 defaults, still in force)

| ID | Decision | Rationale / impact |
| --- | --- | --- |
| D1 | **Hearts are per lesson.** Five hearts, reset on every attempt. | Matches current player behaviour and the owner's default. Global hearts + regeneration + gem refill are not implemented. |
| D2 | **No league UI until at least 10 real players exist.** | No fabricated peers or leaderboards. Under 10 players the product stays in an "early community" state. |
| D3 | **Gem economy uses the default sources:** +5 per lesson, +10 per daily quest, streak freeze costs 50. | Not implemented yet; recorded so P7 has one source of truth. No purchases. |
| D4 | **No Indic content reviewer yet.** | Nothing may claim review. New Indic content is `reviewStatus: "draft"` from P4 onward until a native speaker signs off. |
| D5 | **Web-first; mobile parity in P9.** | Mobile is currently a branded welcome screen. The API is cookie-only, so a native client needs an auth plan before sync can work. |

## Engineering decisions

| ID | Date | Decision | Rationale / impact |
| --- | --- | --- | --- |
| D6 | 2026-11-15 | **Progress snapshot v2 is additive.** v2 = v1 fields + `dailyGoal` + `timeZone`. v1's schema is kept forever, read-only; migration never rewrites the stored v1 object. Web writes `speeko.progress.v2` and reads the legacy `speeko.progress.v1` key forever. | Lets preferences and timezone land without invalidating existing guests. Migration is lenient and recoverable, so corrupt localStorage degrades to a clean snapshot instead of wiping a learner. |
| D7 | 2026-11-15 | **E2E is Playwright with the installed Chrome**, two viewport projects (1280×800 desktop, 390×844 mobile), viewport screenshots. Route screenshots stay guest-state; P2 adds signed-in reward screens and API checks (see D11–D13). | No browser download or paid service. Screenshots are the visual record for every phase; native-app screenshots are still uncovered. |
| D8 | 2026-11-15 | **Lint is minimal and committed:** `next/core-web-vitals` for web, legacy `eslint-config-expo@9.2.0` for mobile (SDK 53 era). | Makes `pnpm lint` non-interactive. The single `<img>` warning stays: exercise options can be arbitrary learner-facing image URLs, where `next/image` adds no value. |
| D9 | 2026-11-15 | **The solo XP ladder is called "Your milestones", not a league.** Tiers (Bronze → Diamond) remain cosmetic labels on the learner's own XP. | The previous "Weekly League" card had no peers and implied competition. Real leagues are gated by D2. |
| D10 | 2026-11-15 | **Hosting is deferred by the owner until after the UI/product phases.** | No deployment work in P1; Neon/Postgres choice is revisited when hosting resumes. |
| D11 | 2026-11-15 | **Lesson rewards are server-verified.** Clients send raw `AnswerInput` values and an `attemptId`; the API re-grades in canonical lesson order with `@speeko/core` rules and writes an append-only `lesson_events` row. The unique `(user_id, attempt_id)` index makes retries idempotent. | Removes client-trusted XP for signed-in lessons. Same attempt id + same lesson returns the original event; a different lesson is a conflict. Failed attempts award nothing. |
| D12 | 2026-11-15 | **Signed-in save failures never award local XP.** The summary shows "Reward not saved" + Retry. A failed session check is treated as signed-in only for a browser with a known signed-in marker; first-time guests save locally. Guests and review sessions keep the local path and remain offline-capable. `PUT /api/progress` stays a guest-import/snapshot-sync layer and is non-authoritative. | Keeps guest UX intact without pretending an unsaved signed-in reward is real. Future leagues/quests/gems must derive from lesson events, not snapshots. |
| D13 | 2026-11-15 | **The API reads authoritative course JSON from tracked `content/<locale>/<course>.json`**, with `CONTENT_DIR` as an override. It does not depend on gitignored `content/dist`. | Server re-grading must use the same source that content review and version control cover. |
| D14 | 2026-11-15 | **Onboarding is a short, local-first route flow.** Language, motivation, level, daily goal, and commitment are direct URLs; commitment starts the first lesson immediately. Returning learners go to their course; no account is required. | Gets a new guest to a real lesson in six taps without a fake signup gate or unreviewed content claims. |
| D15 | 2026-11-15 | **Path node types are honest:** chest = guidebook recap (no reward), review = existing SRS session, checkpoint = synthetic practice from prior units, no XP and no course progress write. Checkpoints unlock only when every prior lesson is complete. | Node types exist and work without inventing gems, quizzes, or leagues before their phases. |
| D16 | 2026-11-15 | **Guidebook target items are extracted from the exercises**, splitting pair exercises into individual words. No new Indic sentences are authored or claimed as reviewed. | Keeps P3 visual output derived from tracked content while P4 handles `reviewStatus` and content provenance. |
| D17 | 2026-11-15 | **Content review status defaults to `draft`.** Existing and scaffolded courses are draft unless a reviewer is recorded. | Prevents unreviewed Indic content from being presented as complete. |
| D18 | 2026-11-15 | **`reviewed` requires a non-empty reviewer.** Validator enforces this; no content may claim review without attribution. | Makes the review claim auditable. |
| D19 | 2026-11-15 | **P4 grows one Hindi pilot course to 5×5 lessons as draft.** It is not presented as reviewed and must not count as complete reviewed content. | Provides path depth for testing without fabricating reviewed language material. |
| D20 | 2026-11-15 | **Studio shows a Draft/Reviewed badge from the manifest.** `reviewStatus` is part of the built manifest. | Makes draft status visible where authors work. |

## Standing constraints

- Run one named phase per session, then stop and report.
- Never push, force-push, or reset without an explicit owner instruction.
- Keep the Speeko name, the original fox, the existing palette/tokens, motion
  primitives, confetti, and grading rules. Never copy Duolingo assets.
- Honest data only: no fake users, leaderboards, XP, achievements, purchases,
  notifications, or reviews. A visible control either works or says "coming soon".
- `pnpm verify` green plus inspected screenshots is the definition of done.
- New Indic content stays `draft` until a native speaker reviews it.
