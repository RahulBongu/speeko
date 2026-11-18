# Speeko — Release Readiness

**Date:** 2026-11-16, updated 2026-11-18
**Basis:** `main` `82f0f3c` (PR #4, then PR #5 — the league profile-lookup fix and the 2026-11-18 handoff docs).
Every command below was run in this cycle and its real output captured. The Android device was
accessed during M1 (2026-11-17, debug and release render); no native reviewer, hosting provider, or
license grant has been accessed — those dependencies are marked as such.

## Verdict

Speeko today is a **verified, fail-closed alpha**: the automated gates that can
be run on this machine are green, and the highest-severity internal engineering
risks found — client-controlled progress corruption of rewards/profiles and
scripted replay farming of completion XP/gems — are closed and verified at the
database level.

Speeko is **not** release-ready for the public. No automated engineering work
remains for the internal alpha. `main` (`82f0f3c`) is the last merged state;
`next/M2` (`444f4b5`: license + hosting) is green and awaits the owner's merge.
Blocking external requirements: a
native-speaker review for every course, hosting provisioning and backups, license
texts bundled into distributed artifacts, and store accounts. On-device functional QA is waived for the internal alpha by
owner instruction (D78); headless web/API verification is the accepted
evidence. A controlled internal trial is possible with the constraints below.

## Gate summary

| Gate | Status | Owner |
| --- | --- | --- |
| Security & data integrity | **Pass** (server + e2e verified) | engineering (this tree) |
| Product completeness | **Pass for alpha; unfinished for launch** | mixed |
| Testing & build | **Pass** on CI-grade checks | engineering (this tree) |
| Curriculum authenticity | **Blocked** — tooling ready, review not started | native speaker × 10 locales |
| Android device QA | **Pass (render)**; functional QA waived — release APK verified on a Vivo V2336 (2026-11-17), functional device QA waived by owner (D78) | engineering + owner |
| Hosting & operations | **Decided 2026-11-18** — free stack ready in repo; owner provisioning pending | owner |
| License & rights | **Decided 2026-11-18** — Apache-2.0 code, All Rights Reserved content/brand, OFL fonts; artifact bundling pending | owner (packaging) |

## 1. Security and data integrity

| Requirement | Status | Evidence |
| --- | --- | --- |
| Progress endpoint accepts only client-owned/mergeable state; rewards ledger stays append-only | **Pass** | `apps/api/src/routes/progress.ts` — field ownership documented; events/ledger are the only reward paths. `PUT /api/progress` cannot create gems, hearts, or purchases. |
| Public profile stats cannot be forged by a client snapshot | **Pass** | `profileWithStats` (apps/api/src/routes/social.ts) computes lifetime XP and lesson count from `lesson_completion_rewards` and the streak from `lesson_events`. Tested by `progress-integrity.spec.ts`: forged snapshot stays invisible. |
| First-completion rewards are one-time and replay-safe | **Pass** | `lesson_completion_rewards` has a unique `(user_id, course_id, lesson_id)` index; the claim, event XP, and lesson gem are written in one transaction. New-`attemptId` replays store 0 completion XP, keep full grading/SRS, and earn no gem. Same-attempt retries stay idempotent. `reward-integrity.spec.ts` covers sequential replay, retry, concurrent first attempts, and concurrent replays against the real API+DB. Migration 0005 backfilled historical XP without minting gems. |
| Shop purchases, ledger integrity, currency | **Pass** | Server transaction + per-user `SELECT ... FOR UPDATE` + `sourceKey` idempotency; e2e: concurrent purchase cannot double-spend; balance derives from ledger. |
| Cosmetic ownership and equipment | **Pass** | Server validates equipped cosmetics against `user_inventory`; unknown id → 400, unowned → 409; explicit `null` un-equips; legacy stored values still sync; 14 integrity checks + web e2e. |
| Account isolation | **Pass** | Session-cookie scoping for every endpoint; cross-account `GET /api/progress` returns own row; snapshot cleared + cookie cleared on sign-out (mobile also clears the device snapshot). |
| Hearts, quests, XP awards | **Pass** | Never accepted through the snapshot; hearts are per-lesson-only; quests/XP come from the reward ledger and events. `attemptId` idempotency and the unique completion-reward row prevent double or replay awards. |
| Malformed/oversized payloads | **Pass** | Unknown keys stripped by zod schemas; invalid payloads → 400 (tested); oversized artifacts cannot enter (schema length caps; default Fastify body limits). |
| Session/credential handling | **Pass for alpha** | Better Auth (scrypt-family hashing); `BETTER_AUTH_SECRET` required in production; cookies scoped and signed. |

**Remaining security limitations:** the progress snapshot still stores
guest/offline XP client-side and the merge keeps the max value — by design
(D12); it never reaches a reward path. Rate limiting and cache policy now ship:
`/api/auth/*` is capped at 60 requests/min per IP, `PUT /api/progress` at
30/min per account+IP, both returning `429` with `Retry-After`, and every
`/api/*` response sets `Cache-Control: no-store`. The limiter is in-memory
and per process, so a multi-instance deployment needs a shared store (owner
hosting decision). Separately, the replay economy is closed: a completed lesson
pays its completion XP and one gem only once per learner/course/lesson, and
later attempts are practice-only while still recording grading/SRS history.
The migration backfilled existing lifetime XP without retroactive gems. Public
leagues and the gem economy can therefore rely on the reward ledger; only the
owner's launch gates remain.

## 2. Product

| Requirement | Status | Evidence |
| --- | --- | --- |
| Core learning journey functional | **Pass** | Web e2e (onboarding → lesson → completion; 148 checks total incl. integrity suites); mobile lesson runner exercised across all playable kinds with hearts exhaustion. |
| Advertised exercise types behave correctly | **Pass; unsupported kinds fail closed** | The curriculum uses 4 kinds: `chooseMeaning` 210, `typeTranslation` 65, `matchPairs` 20, `listenChoose` 10. Web supports all ten published kinds. Mobile supports 9 (`chooseMeaning`, `listenChoose` with audio, `fillBlank`, `typeTranslation`, `matchPairs`, `wordBank`, `arrangeSentence`, `typeWhatYouHear`, `speak`); `chooseImage` blocks honestly and cannot complete a lesson. No curriculum item is an unimplemented-kind. |
| Missing-audio safeguard | **Pass** | `eligibleExercises()` in `@speeko/core` excludes empty-audio `listenChoose` from lesson queues, review/practice plans, the SRS index, and the API grading path. The 10 items keep their IDs/content and are blocked in the audit ledger. Core + mobile tests cover skip and playable-audio branches. |
| Progress restores and synchronizes | **Pass** | Web guest→account merge (D12), mobile local/cloud merge (`lib/sync.ts`), migration from v1 snapshot, corrupt-JSON tolerance. |
| Shop, practice, habits work | **Pass** | Purchase/equip/rollback/un-equip e2e; practice-only SRS due review; habits track verified events; goals persist. |
| Unsupported functionality fails honestly | **Pass** | Stories/conversation ship as explicit unavailable states; mobile blocks unsupported kinds; empty-audio listening tasks are excluded rather than faked; shop needs sign-in. |
| Guidebook pre-lesson review (curriculum) | **Pass** | Shared `@speeko/core#guidebookItems`; web + mobile unit guidebooks render from it; +6 core tests. |
| Accounts, leagues, people | **Pass** | Verified against real accounts; leagues show honest early-community state under 10 learners; profiles now show verified XP/streak/lessons. |

**Does not exist yet (unchanged):** mobile `chooseImage` rendering, stories
and conversation on mobile, server-side review history sync for learner reviews,
gem sources beyond lessons/quests/purchases, and any licensed audio.

## 3. Testing

| Layer | Status | Evidence |
| --- | --- | --- |
| Unit (core) | **Pass** | `pnpm --filter @speeko/core test` — **108 passed** (includes 4 eligibility tests, the empty-lesson guard, practice-plan coverage, and the practice-vs-quest habit split) |
| Unit (content) | **Pass** | `pnpm --filter @speeko/content test` — **16 passed** (all 305 exercises graded, validation/test suites incl. answerIndex bounds) |
| Unit/component/integration (mobile) | **Pass** | `npx jest` in `apps/mobile` — **77 passed across 15 suites** (includes missing-audio skip, playable-audio branch, and the added exercise kinds) |
| API integration | **Pass** | `progress-integrity.spec.ts` — 7 scenarios and `reward-integrity.spec.ts` — 7 scenarios against the real API+DB (14 checks each across both viewports); plus reward, habits, shop, social, and the isolated rate-limit contract (`rate-limit.spec.ts`) |
| Browser E2E | **Pass** | `pnpm e2e` — **148 checks** at 1280×800 and 390×844, zero console/page errors, zero flakes on the recorded run |
| Typecheck | **Pass** | 6/6 turbo tasks |
| Build | **Pass** | 5/5 turbo tasks (web, API, mobile export — 22 static routes) |
| Lint | **Pass** (0 errors) | web: 1 documented `<img>` warning; mobile: clean |
| Android device QA | **Pass (render)**; functional QA waived | M1 (2026-11-17): release APK installed on Vivo V2336; cold start renders the Bengali course path; APK hash matches local build (`36A5D41D…`); screenshot/UI dump/logcat in `docs/qa/mobile/`. Functional device QA is waived by owner instruction (D78) |
| Mobile E2E / screenshots | **Headless only** | No emulator-attached suite. Playwright runs the web export + compiled API at both viewports; the native app is not instrumented. Release-render evidence (`docs/qa/mobile/release-first-screen.png`, 1080×2400, PNG signature verified; `release-ui-dump.xml`) is the device record |

## 4. Curriculum

| Requirement | Status | Evidence |
| --- | --- | --- |
| Accurate inventory, grouped by locale/lesson/type | **Pass** | `review/review-package.json` + `review-<locale>.csv` — 305 items across 10 locales; includes prompt/target/options/answers/transliteration/audioUrl/vocabId/draft status and empty reviewer fields |
| Human review path | **Blocked** — no native speaker has been engaged | Review package + `review/REVIEW.md` is ready to hand to a reviewer; nothing is marked reviewed |
| Automated validation beyond schema | **Pass** | Validator: duplicate option strings (error), answerIndex bounds (error), production-answer script check (warning), listenChoose empty `audioUrl` (warning), bad audioUrl (error); all 11 course files parse and grade |
| AI-linguistic review (2026-11-16) | **Done, honest limits** | `scripts/ai-review-content.mjs` reviewed all 305 items (meaning, grammar, naturalness, orthography, transliteration, vocabulary, ambiguity, exercise correctness, consistency, pedagogy); 3 Kannada items corrected for a defective vowel sign (U+0B90 → U+0C90), applied and regression-checked; 2 Hindi "Sorry" spellings preserved as legitimate variants; 0 native approvals; both passes ran on one model and are NOT independent. Reports at `review/ai-linguistic-review.{json,md}` |
| Deterministic structural audit | **Done** | `scripts/audit-content.mjs` → `review/audit-ledger.json`: 305 items ledgered; R-001..R-008 clean; 10 items blocked on missing licensed audio; 2 items flagged by the AI-assisted cross-course rule R-010 for human review; 293 match no rule |
| Missing-audio safeguard | **Done and tested** | Empty-audio `listenChoose` is excluded from every playable queue by `eligibleExercises()` (D71); source records and IDs unchanged; web/mobile/API share the rule; 4 core eligibility tests + updated practice tests + 2 mobile branch tests |
| No draft content falsely labelled | **Pass** | `reviewStatus: "draft"` on every bundle/item in the review package and ledger; validator forbids `reviewed` without a reviewer; the AI ledger never asserts approval |
| Removed known template defect | **Done** | 10 English filler exercises removed from starters ("I have ___ apples."); count is now 305; no target-language regression introduced |

**Content corrections this cycle** (source JSON): the 10 filler exercises;
3 Kannada Unicode corrections (P15); all courses re-validate and re-grade green;
web `public/courses` and `content/dist` were rebuilt; the review CSV count now
reads **305**. The missing-audio safeguard changes **no content bytes** — it is
a play-time filter, not an edit.

**listenChoose audio remains empty** by design, not oversight. The app does not
present it as a listening task: the item is filtered out until a licensed
`audioUrl` exists. A reviewer must either source licensed audio or mark those
exercises `revise` (see `review/audio-decision-analysis.md`).

## 5. Operational readiness

| Requirement | Status | Evidence |
| --- | --- | --- |
| Hosting/database decision documented | **Decided 2026-11-18** — Option A; provisioning is an owner action | `docs/decisions/2026-11-16-hosting-and-database.md` — Neon free Postgres + Render free API + Vercel hobby web, with a same-origin `/api` proxy so the session cookie stays first-party; `render.yaml` and `docs/deploy-runbook.md` carry the exact env contract. VPS remains the public-release option. |
| Release operations checklist | **Pass** — prepared, nothing executed | `docs/decisions/2026-11-16-release-and-operations.md` — GO/NO-GO gates, env/secret handling, migrations, backup+restore drill, rollback, rate limits, logging, post-deploy smoke tests |
| Environment configuration | **Pass** | `.env.example` for API+web documents all vars; production requires `BETTER_AUTH_SECRET`; mobile endpoints via `app.json extra` (D63); pglite is dev-only |
| Rate limiting, cache, secrets gate | **Pass** | In-memory fixed-window limiter (`apps/api/src/rate-limit.ts`): 60/min per IP for `/api/auth/*`, 30/min per account+IP for `PUT /api/progress`, `429` + `Retry-After`; `Cache-Control: no-store` on `/api/*`; `scripts/check-secrets.mjs` wired into `pnpm verify`; production boot requires a ≥32-char `BETTER_AUTH_SECRET`. Contract tested against an isolated API with the limiter on (`tests/e2e/rate-limit.spec.ts`). |
| Backup and recovery | **Requirement on file** | nightly `pg_dump` or provider PITR; a tested restore is a pre-launch gate in the operations checklist and hosting package |
| Migrations | **Pass** | applied on API start; append-only table strategy keeps forwards-only restores possible; migration target is Postgres |
| Secrets handling | **Pass** | none in repo (`.gitignore` enforced; `apps/api/.env.example` documents placeholders only) |
| License & content rights | **Decided 2026-11-18** — web texts served at `/licenses/*` (auto-built); mobile bundling at packaging time | Apache-2.0 code + All Rights Reserved content/brand in `LICENSE` and `LICENSE-CONTENT`; font OFL-1.1 text in `apps/web/public/fonts/OFL.txt` and `/licenses/OFL.txt`; `NOTICE` and `ATTRIBUTIONS.md` updated; `apps/web/app/licenses/page.tsx` exposes them; **nothing published** |
| Proxy-aware rate limiting | **Known alpha limitation** | The API keys `/api/auth/*` on `request.ip` and does not trust proxy headers. On Render the socket peer is the platform proxy, so the 60/min auth budget is shared by the service (this already applies to direct mobile traffic). Acceptable for a small controlled alpha. Before widening access, configure trusted proxy hops and verify `X-Forwarded-For` against the platform's documented chain; never trust arbitrary client-supplied headers on a publicly reachable API. |

## Merge state

`next/M2` awaits the owner's PR/merge into `main`. PR #5 merged the prior
`next/M2` work (`d5d6a74` league fix + `5e3c999` handoff docs) into `main` on
2026-11-18 (`82f0f3c`). Version remains `0.0.1`; nothing is published. The
branch now also carries the follow-up docs bookkeeping, the license files
(D79), and the hosting configuration (D80: proxy rewrite, Render blueprint,
runbook).

## Blockers for a public release

1. **Native-speaker review** of 305 draft exercises (≥1 reviewer × 10 locales).
2. **Android device QA**: the release-APK render pass is done (2026-11-17, Vivo V2336, `36A5D41D…`). Functional device QA is **waived for the internal alpha** by owner instruction (D78); headless Playwright covers the functional flows. A public launch still needs a real-device pass by the owner.
3. **Hosting provisioning and backups** (owner; Option A — Neon + Render + Vercel — is decided, and `render.yaml` + the runbook are ready). Includes a tested restore and secret rotation.
4. **License artifact bundling**: `LICENSE`, `NOTICE`, and the font OFL text must ship inside a distributed APK or site (or an in-app licenses screen). The license decision and repo files are done (2026-11-18).
5. **Audio decision** for listenChoose: publish with the exclusion (already implemented) or record/license audio for the 10 items. No audio exists today.

## What can ship now (bounded trial)

A controlled internal trial may run against the current build: it is
fail-closed, honest about content draft status, cannot pay out into fake
rewards, keeps guests' offline work, and never claims functional device verification.
Constraint: no external users, no store submission, no public domain yet,
and the trialers understand lessons are unreviewed draft. This is an
**AI-assisted-review-only** internal alpha: the owner accepts that risk
tolerance; the curriculum is not certified and this is not public-release
readiness.

## How the evidence was produced

Re-run everything: `pnpm verify` (typecheck + test + build + secrets + e2e),
`pnpm --filter @speeko/content build:courses` for the dist bundle,
`pnpm sync:content` for the web bundle, `pnpm --filter @speeko/content test`
for the content validator, `pnpm --filter @speeko/mobile build` for the
22 static routes, `node scripts/export-review.mjs` for the review package, and
`npx playwright test tests/e2e/progress-integrity.spec.ts` for the boundary
suite against the production-built API and database.

Historical counts (from the P12 cycle) are no longer the record; this document
reflects `d5d6a74` as run on 2026-11-18. Earlier snapshots remain in `docs/PROGRESS.md`.
