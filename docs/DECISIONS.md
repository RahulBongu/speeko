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
| D21 | 2026-11-16 | **SRS is Leitner 1/2/4/8/16.** New cards start at box 0 and are due now. A miss returns the card to box 1 for tomorrow and increments `lapses`; a correct answer moves one box forward, capped at box 5. Legacy SM-2 cards are normalised on read from their old interval (`≤1→1`, `≤2→2`, `≤4→3`, `≤8→4`, `>8→5`), preserving `dueAt`; stored data is never rewritten. | Replaces the P0 SM-2 deviation without losing existing schedules. Normalising on read keeps v1/v2 snapshots valid forever and avoids a destructive migration. |
| D22 | 2026-11-16 | **Practice only uses completed lessons and existing SRS cards.** Due review uses cards mapped to learned exercises; trouble words use learned cards with `lapses > 0`; unit practice mixes exercises round-robin from that unit's completed lessons. Unfinished lessons are never revealed and the hub does not invent counts. | Makes every practice number traceable to the learner's own history. Practice cannot become a back door to unseen content. |
| D23 | 2026-11-16 | **Practice sessions are practice-only.** They award no XP, write no completion record, and send no `lesson_events` row; answers update SRS only. Feedback says "Review scheduled", not "+XP". Finished sessions sync through the snapshot layer. | Keeps practice honest and prevents it from inflating server-authoritative rewards. The snapshot remains the non-authoritative sync path (D12). |
| D24 | 2026-11-16 | **Trouble words are historical, not auto-cleared.** Any learned card with at least one lapse stays available in trouble practice. | Matches the P5 scope without inventing a mastery/retirement rule. A future SRS phase can add clearing when a card is consistently recalled. |
| D25 | 2026-11-16 | **`vocabId` identifies a vocabulary item and may repeat across exercises.** The P4 duplicate-`vocabId` validator rule was removed; unit, lesson, and exercise IDs remain unique. | One word is deliberately practiced by several exercise kinds. Rejecting repeats made the canonical pilot unbuildable and contradicted the schema's purpose. |

## Standing constraints

- Run one named phase per session, then stop and report.
- Never push, force-push, or reset without an explicit owner instruction.
- Keep the Speeko name, the original fox, the existing palette/tokens, motion
  primitives, confetti, and grading rules. Never copy Duolingo assets.
- Honest data only: no fake users, leaderboards, XP, achievements, purchases,
  notifications, or reviews. A visible control either works or says "coming soon".
- `pnpm verify` green plus inspected screenshots is the definition of done.
- New Indic content stays `draft` until a native speaker reviews it.

## P6 — Habit systems

| ID | Decision | Rationale / impact |
| --- | --- | --- |
| D26 | **Day boundaries use the learner's stored IANA time zone, not the server clock.** | Daily goals, quests, streaks, and calendars roll over at local midnight. The snapshot stores `timeZone`; the browser supplies it on first load and onboarding captures it. Invalid or missing zones fall back to the runtime's local day. |
| D27 | **Quests are progress-only.** | Quests derive from history and show progress, but award no gems or other rewards yet. Gem rewards arrive with the shop in P7, matching D3. |
| D28 | **Streak freezes earn automatically and spend automatically.** | One freeze is earned at every 7-day streak milestone, capped at two. A one-day gap spends one freeze automatically; larger gaps reset the streak. There is no purchase or manual control until P7. |
| D29 | **Signed-in habit history is event-derived.** | Quests, streaks, the calendar, and achievements derive from append-only `lesson_events`, deduped by `attemptId`. The progress snapshot contributes only `dailyGoal` and `timeZone`. `PUT /api/progress` keeps those preferences even when lesson history is more recent elsewhere. |
| D30 | **Guest habit data is device-derived and labelled.** | Guests see activity saved in this browser and the page says so. It is never presented as verified or shared history. |
| D31 | **Activity is stored per day and merged by the larger value.** | v2 snapshots now include `activity: Record<day, {xp, lessons}>`. Repeated syncs and merges keep the larger day aggregate, so the same lesson can never be double-counted. v1 snapshots seed activity from completed lessons and `lastActiveDate`; v1 data is still not rewritten. |

## P7 — Gems and shop

| ID | Decision | Rationale / impact |
| --- | --- | --- |
| D32 | **Gems are server-verified and ledger-based.** | `gem_ledger` is append-only with a per-user `sourceKey` idempotency key. Lessons award +5, completed daily quests award +10, and purchases subtract their price. Balances derive from the ledger. |
| D33 | **The shop sells original fox cosmetics and streak freezes only.** | No real-money payments, ads, or external services. Cosmetics are one-time purchases; streak freezes add a freeze credit up to the existing cap of two. |
| D34 | **Purchases are serialized per user.** | `SELECT ... FOR UPDATE` on the user row plus a unique `sourceKey` prevents double-spend under concurrent requests. Insufficient gems, already-owned, and full-freeze states return honest 409 responses. |
| D35 | **Quest gems are awarded for completed daily quests.** | Daily quest completion credits +10 gems idempotently. Weekly quests remain progress-only. |

## P8 — Leagues and social

| ID | Decision | Rationale / impact |
| --- | --- | --- |
| D36 | **Leagues are global weekly standings until real grouping exists.** | With fewer than 10 active learners, the page shows an early-community state. There are no fabricated league members or groups. |
| D37 | **Promotion and demotion are rank zones, not stored tiers.** | The current week shows promotion/safe/demotion zones from real standings. No tier is invented or persisted. |
| D38 | **Profiles and follows are real-account only.** | A profile is created on demand for an authenticated user. Guests cannot appear in leagues or follow lists. |
| D39 | **Usernames are unique and collision-safe.** | `ensureProfile` derives a slug from the account name or email and appends a random suffix when needed. |

## P9 — Mobile parity

| ID | Decision | Rationale / impact |
| --- | --- | --- |
| D40 | **Mobile uses the shared API for course data.** | `/api/courses` and `/api/courses/:id` serve the compiled course bundle so mobile does not duplicate the content pipeline. |
| D41 | **Mobile parity is incremental.** | This phase ports auth, learn, path, a basic lesson runner, account, and habits. Practice, shop, leagues, and people remain web-first until a later pass. |
