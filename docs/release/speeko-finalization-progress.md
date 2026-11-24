# Speeko — Finalization checkpoint

**Start time:** 2026-11-24 15:37:00 +05:30
**Scope:** `SPEEKO_FINALIZATION_MASTER_EXECUTION_PROMPT.md` (Phases 0–13). This file is the single resumable checkpoint for this run. Prior history is preserved in `docs/design/speeko-all-phases-progress.md`, `docs/design/ui-rescue-audit.md` and `docs/design/implementation-notes.md`.

## Live baseline (Phase 0 — inspected, not assumed)

| Item | Live result |
|---|---|
| Repository root | `C:\duo` |
| Branch / tracking | `main...origin/main`, no ahead/behind marker |
| HEAD | `cf9f126 feat(mascot): free animated vector fox across web and mobile` |
| Staged | none (`git diff --cached --stat` empty) |
| Changed paths | 48 total = 42 modified tracked + 6 untracked (`git status --short --branch`) |
| Modified tracked (42) | README.md; api `account.ts`, `social.ts`; mobile `__tests__/fox.test.tsx`, `app/{account,habits,learn,practice,shop}.tsx`, `app/lesson/[courseId]/[lessonId].tsx`, `app/path/[courseId].tsx`, `components/{AppNav,ExerciseBody,Fox,Tactile}.tsx`, `lib/theme.ts`; web `app/globals.css`, `app/layout.tsx`, `app/learn/LearnClient.tsx`, `app/learn/[courseId]/page.tsx`, `components/{AppHeader,AuthForm,Fox}.tsx`, `components/lesson/{AudioPrompt,ExerciseBody,LessonPlayer}.tsx`, `lib/speech.ts`, `tailwind.config.ts`; 12 QA PNGs under `docs/qa/{desktop-1280x800,mobile-390x844}`; `docs/release/release-checklist.md`; `tests/e2e/habits.spec.ts` |
| Untracked (6) | `apps/mobile/components/Icons.tsx`, `design/reference/`, `docs/content/`, `docs/design/`, `docs/qa/native-device-checklist.md`, `tests/e2e/account-deletion.spec.ts` |
| `git diff --stat` | 42 files changed, 1376 insertions(+), 1355 deletions(-) |
| Scripts (root) | `build`, `dev`, `lint`, `typecheck`, `test`, `e2e`, `check:secrets`, `check:licenses`, `verify`, `sync:content` (exact strings in `package.json`) |

### Versions detected (no secret values)

Node v26.13.0 · pnpm 11.22.0 · Expo 58.0.26 · React Native 0.88.1 · React 19.3.0 · react-native-svg 15.16.0 · Reanimated 4.7.1 · Next 15.1.3 · Fastify 5.12.8 · Drizzle 0.45.4 · Better Auth 1.7.25 · TypeScript 6.0.3 · Playwright 1.65.1.
Java 17.0.12 LTS · Android SDK `C:\Users\rahul\AppData\Local\Android\Sdk` with platforms 35/36/37 and build-tools 35.0.0/36.0.0 · Gradle wrapper 8.13 (generated, gitignored `apps/mobile/android/`) · AGP resolves to a version requiring Gradle 9.4.1 (observed from real build failure) · `adb` present, no device attached.

### Route/feature inventory (live filesystem)

Web App Router: `/`, `/learn`, `/learn/[courseId]`, `/learn/[courseId]/guidebook/[unitIndex]`, `/lesson/[courseId]/[lessonId]`, `/practice`, `/habits`, `/shop`, `/account`, `/leagues`, `/people`, `/conversation`, `/stories`, `/studio`, `/studio/[id]`, `/profile/[username]`, `/licenses`, `/sign-in`, `/sign-up`, `/onboarding` + 5 steps, plus `error`, `global-error`, `not-found`.
Mobile Expo Router: `/`, `/learn`, `/path/[courseId]`, `/lesson/[courseId]/[lessonId]`, `/practice`, `/practice/[courseId]`, `/habits`, `/shop`, `/account`, `/leagues`, `/people`, `/licenses`, `/sign-in`, `/sign-up`, `/guidebook/[courseId]/[unitIndex]`, `/onboarding` + 5 steps.
API (Fastify): 21 routes across health/locales, auth, courses, progress, lesson-completions, habits, account, shop/gems, social/leagues, AI status/conversation.
Features: onboarding, email+password sessions, course selection, locked path, graded lessons (chooseMeaning/typeTranslation/matchPairs/listenChoose), SRS, XP/hearts/streaks/goals, shop ownership/gems/freezes, account/settings/sync, habits, leagues/follow, stories/studio, licenses, owner-gated voice conversation.

No owner work was discarded. No git state was mutated. Phase 0 **PASS**.

## Phase status

| Phase | Status | Evidence / next action |
|---|---|---|
| 0 Baseline | PASS | Live snapshot above; owner work preserved, nothing staged. |
| 1 Re-verify prior work | PASS | Fixes present; screenshots newer than source; Expo static console has 0 transform-origin/invalid-DOM warnings. |
| 2 Local quality work | PASS | Secrets scanner + duplicate-purchase narrowing fixed; lint now zero warnings; axe found 14 real violations which were fixed; 20 automated audits clean. |
| 3 Native build investigation | PASS (diagnosis, no artifact) | Stale gitignored project confirmed; fresh prebuild generates Gradle 9.4.1 and compiled 501 tasks in disposable copy; no APK produced. Permissions config plugin added and unit-tested. |
| 4 Native device QA | BLOCKED (no device/emulator) | Runbook updated with exact build/prebuild steps, pass/fail fields and evidence rules. |
| 5 Responsive/screenshots | PASS | 48 browser audits at six viewports: 0 overflow/errors; final screenshots regenerated from final source; 132-entry manifest. |
| 6 Content/review process | PASS (structure) / BLOCKED (human review) | 321 unique exercises, 10 locales, 0 structural problems; operational review packet with reviewer guide; no human approval. |
| 7 Voice provider | PASS (unconfigured) / BLOCKED (provider) | Exact env names `AI_API_KEY`/`AI_API_URL`; honest 503 confirmed and E2E-tested; no provider client implemented. |
| 8 Security/privacy | PASS (source) / BLOCKED (deployed) | 20 explicit routes + Better Auth mount; account deletion/search/shop fixes tested; deployed config not accessible. |
| 9 Reliability/performance | PARTIAL | Mobile audio cleanup fixed + tested; error/backup checklists prepared; no performance numbers claimed; restore drill blocked. |
| 10 Production config | PASS (source) / BLOCKED (deployed) | Env names/placeholders validated, production startup guard tested; owner-run smoke checklist written. |
| 11 Release/store inventory | PASS (prepared) / BLOCKED (submission) | Grounded identity/assets/permissions/deletion inventory; legal/store/signing actions remain. |
| 12 Final verification | PASS | See work log for exact counts; full command set re-run after all code edits. |
| 13 Final audit/decision | PASS | Checkpoint, release checklist, native checklist, content packet, manifest and smoke checklist saved. |

## Work log

### Phase 1 — PASS (re-verification, no churn)

- Inspected live source: `AudioPrompt.tsx` calls `void audio.play()` and `play()` from the autoplay path, routes all state through `setPlayingState`, calls `cancelSpeech()` and `emitMascotListening(false)` on unmount. `account.ts` deletes legacy dependents inside `db.transaction(...)`. `social.ts` escapes `[\\%_]` and uses `ilike ... escape '\'`. Mobile `Fox.tsx` uses `rotate(deg cx cy)` strings with no `originX`/`originY` animated props; both Foxes import mood semantics from `@speeko/core`. `LearnClient.tsx` counts distinct locales (10).
- Screenshot freshness: `apps/web/app/learn/LearnClient.tsx` 15:22:06, `docs/design/screenshots/learn-390x844.png` 15:23:57, `report.json` 15:24:26 — captures are newer than every relevant source edit. `fox-reference-vs-render.png` 09:36:28 is newer than web `Fox.tsx` 09:35:24; later mobile Fox edits were accessibility props only (no artwork change).
- Expo-web console: `pnpm --filter @speeko/mobile build` (static export) then served `apps/mobile/dist` locally; Playwright loaded `/`, `/learn`, `/lesson/hi-starter/hi-starter-u1-l1` in Chrome. **0** console messages matching `transform-origin|originX|originY|Invalid DOM property`. No globally suppressed warnings were added.
- Note: `expo start --web` dev server cannot resolve `./node_modules/expo-router/entry` under pnpm's isolated layout (`UnableToResolveError`, HTTP 404 JSON for `entry.bundle`); the supported static-export renderer was used instead. The CORS messages in that ad-hoc run came from the temporary origin `localhost:19007` not being in `CLIENT_ORIGINS`, not from the app. An earlier React #418 hydration error was traced to the temporary server falling back to `index.html` for dynamic routes; after fixing the route mapping it disappeared. Neither is an application defect.
- Commands: `pnpm --filter @speeko/mobile build` (exit 0), `node <temp>/serve-static.cjs`, `node <temp>/expo-console-check.cjs` (exit 0).

### Phase 2 — PASS

- `scripts/check-secrets.mjs`: now loads env values from root/API/web/mobile `.env` files (names only) **and** always runs the fallback patterns. `pnpm check:secrets` → 187 files, 0 hits.
- `apps/api/src/routes/shop.ts`: duplicate-purchase replay narrowed to `unique constraint|duplicate key` **and** `gem_ledger_user_source_idx`. `pnpm e2e -- tests/e2e/shop.spec.ts` → 12/12 passed.
- `<img>` lint warning fixed with `next/image` (`unoptimized`, explicit dimensions) in `ExerciseBody.tsx`. `pnpm lint` → **no ESLint warnings or errors**.
- Real axe-core audit injected from the existing dependency found **14 routes with serious violations**: low-contrast `bark-400` (never actually darkened in the prior pass), `bark-300`, `opacity-70` text, `ice-700` at 4.49:1, `cream-300` numbers, and `label-content-name-mismatch`. Fixed by darkening web tokens (`bark-300 #806b5a`, `bark-400 #7a5f4c`, `ice-700 #2a6b99`), removing text `opacity-70`/card `opacity-80`, using accessible heart/number colours, and removing/correcting mismatched `aria-label`s. Added `tests/e2e/a11y.spec.ts` (10 routes × 2 projects) → 20/20 passed; `docs/qa/axe-report.json` → 0 violations across 20 audits.

### Phase 3 — PASS (diagnosis; no artifact)

Native dirs are fully gitignored; only app.json, eas.json and plugins are tracked. Official Expo CNG docs consulted: prebuild is source of truth, `--clean` required for fresh sync, manual `android/` edits do not survive. `npx --no-install expo install --check` → "Dependencies are up to date". Fresh prebuild in a disposable copy (owner `android/` untouched) generated Gradle 9.4.1 vs owner's 8.13 and different autolinking/Kotlin files. `assembleDebug` in that copy: 501 tasks executed, all Java/Kotlin compiled, failed at CMake ninja with a deep-temp-path `mkdir(...C_/Users/rahul/AppData/Local/Temp/opencode/...)` error. No APK/AAB produced. Added tracked `apps/mobile/plugins/withMinimalAndroidPermissions.js` + `app.json` registration + `__tests__/permissions-plugin.test.ts` (1/1 passed).

### Phase 4 — BLOCKED

`adb devices` → no devices; no emulator binary; Windows host without Xcode. `docs/qa/native-device-checklist.md` updated with exact prebuild/build/install commands, backup-before-prebuild warning, pass/fail field table, evidence rules and 17 manual checks. All are marked NOT RUN.

### Phase 5 — PASS

Final browser captures: 15 screens (7 primary routes at 390×844 and 360×800, Learn at 1280×800), 0 overflow, 0 console/page errors. Responsive audit: 48 checks at 320×568, 360×800, 390×844, 768×1024, 1024×768, 1280×800 → 0 issues after fixing a real 320px Habits calendar overflow with `min-w-0 flex-1 overflow-x-auto`. `docs/design/screenshot-manifest.md` regenerated: 132 indexed captures. Axe re-run: 20 audits, 0 violations.

### Phase 6 — PASS structure / BLOCKED human review

Structural validator: 11 course entries, 107 lessons, **321 unique exercise IDs**, 10 locales, 0 problems. `docs/content/native-speaker-review.md` regenerated with one row per exercise and columns for locale, script/meaning/naturalness/cultural/audio checks, reviewer alias/qualification, date, severity, suggested correction, disposition and status; reviewer guide covers regional variation, severity examples, abstain/escalate and approval recording. No reviewer, signature or approval was fabricated.

### Phase 7 — PASS unconfigured / BLOCKED provider

`apps/api/src/routes/ai.ts` requires `AI_API_KEY` **and** `AI_API_URL`, requires a session, and returns honest 503 both when unconfigured and even when configured (no provider client exists). Web `/conversation` states both cases accurately. Added `tests/e2e/ai-gate.spec.ts` → 4/4 passed. `.env.example` now documents the two optional names/placeholders and no longer references unused Rive. No credential was read or used.

### Phase 8 — PASS source / BLOCKED deployed

20 explicit routes counted from source plus the Better Auth mount (= 21). Every user-owned query is scoped by `session.user.id`; account deletion transaction, LIKE escaping and narrowed purchase-replay handling verified with real E2E against a disposable local PGlite DB. `pnpm check:secrets` 0 hits. Deployed configuration, DB roles and secret rotation require owner access.

### Phase 9 — PARTIAL

Mobile audio cleanup fixed: `lib/audio.ts` and `lib/mascot.ts` now store/remove playback-status subscriptions and lesson/practice screens call the stop helpers on unmount. Added `__tests__/audio-cleanup.test.ts` → 4/4 passed. Backup/restore procedure exists in `docs/monitoring.md` and `docs/deploy-runbook.md`; no isolated restore drill performed. No performance numbers claimed.

### Phase 10 — PASS source / BLOCKED deployed

All env names inventoried from source; `.env.example` files are placeholders only; production startup guard E2E-tested (4 tests). Added `docs/release/deployment-smoke-checklist.md` with 13 owner gates. No deployment, DNS, domain or secret change was made.

### Phase 11 — PASS prepared / BLOCKED submission

`docs/release/store-readiness-inventory.md` records real identifiers, version, scheme, icons, permissions, privacy/support gaps and the mobile account-deletion gap. No legal URL, support address, store metadata or keystore was invented.

### Phase 12 — PASS (after one investigated failure and fix)

First full `pnpm verify` after all code edits: 182 E2E passed, **2 failed** — `onboarding.spec.ts:90` "checkpoint unlocks and opens a practice-only lesson" in both projects. The failure was `getByRole('link', { name: /Checkpoint:/ })` finding no element. Root cause: my Phase 2 accessibility fix removed a stale `aria-label={`${label}: ${sub}`}` whose colon the test depended on; the accessible name is now the visible link text. I did **not** revert the accessibility fix. Both locators were changed to `/Checkpoint/` (still precise: one checkpoint link), and `pnpm e2e -- tests/e2e/onboarding.spec.ts` → **12/12 passed** as a stable repeat. Final full `pnpm verify` result is recorded below.

### Phase 13 — PASS

This checkpoint, release checklist, native checklist, content packet, screenshot manifest, store inventory and deployment smoke checklist are saved. Prior audit history preserved.

## Final verification results (last full run)

| Command | Result |
|---|---|
| `pnpm typecheck` | 6/6 Turbo tasks successful |
| `pnpm test` | 5/5 tasks: 156 core + 18 content + 12 API Vitest; 91 Jest tests / 19 mobile suites |
| `pnpm build` | web, API, mobile-web static export and content all succeed |
| `pnpm check:secrets` | 187 files across 3 dirs, 0 hits (7 fallback patterns; no env values available) |
| `pnpm check:licenses` | PASS |
| `pnpm lint` | 2/2 tasks, no warnings or errors |
| `pnpm e2e` | **184 passed (5.9m)**, 0 failed; desktop-1280x800 and mobile-390x844 |
| `pnpm verify` | **green** (full chain above), exit 0 |
| Focused repeats | shop 12/12, a11y 20/20, ai-gate 4/4, account-deletion 4/4, audio-cleanup 4/4, permissions-plugin 1/1, onboarding 12/12 |
| Browser audits | 48 responsive checks / 0 issues; 20 axe audits / 0 violations; 15 final captures / 0 overflow / 0 console errors |

## Final git status / decision

- **Post-run owner authorization:** the owner explicitly requested GitHub pushes. All work was committed and pushed on 2026-11-24; the commit sequence is listed below. This supersedes the earlier uncommitted/unpushed status recorded during the autonomous run.
- Before that authorized push: branch `main`, HEAD `cf9f126...`, 69 changed paths, nothing staged, `git diff --check` clean (LF→CRLF notices only). No secret, keystore, `.env`, build output or test result was staged.
- 69 changed paths: 54 modified tracked + 15 untracked.
- Untracked: `apps/mobile/__tests__/audio-cleanup.test.ts`, `apps/mobile/__tests__/permissions-plugin.test.ts`, `apps/mobile/components/Icons.tsx`, `apps/mobile/plugins/withMinimalAndroidPermissions.js`, `design/reference/`, `docs/content/`, `docs/design/`, `docs/qa/axe-report.json`, `docs/qa/native-device-checklist.md`, `docs/release/deployment-smoke-checklist.md`, `docs/release/speeko-finalization-progress.md`, `docs/release/store-readiness-inventory.md`, `tests/e2e/a11y.spec.ts`, `tests/e2e/account-deletion.spec.ts`, `tests/e2e/ai-gate.spec.ts`.
- No tag, release, deploy, production mutation, purchase, real-account deletion or secret disclosure occurred. The only commit/push is the owner-authorized one described above.

**Commit history after owner authorization (all on `main`, all pushed):**

| Commit | Summary |
|---|---|
| `ff2f1b2` | Polish Speeko release candidate: accessibility, native config, tests and handoff |
| `2559e7e` | Record authorized push in finalization checkpoint |
| `1b5cf1d` | docs: correct mobile SDK version in README |
| `c3566c7` | docs: refresh README roadmap to current scope |
| `1e00765` | docs: point release checklist at final verification record |
| `5686166` | docs: record post-run disposition in phase log |
| `91139db` | docs: document test-only API env flags |
| `f66372f` | docs: clarify QA-only cleartext prebuild flag |
| `66806b2` | docs: link README to finalization checkpoint |
| `9af3fe4` | docs: add evidence regeneration steps to screenshot manifest |

**Final decision: NOT READY — EXTERNAL GATES OPEN.** Local code, tests, builds, browser UI, accessibility and screenshots are green. The mandatory native build artifact, native device/accessibility QA, human content review, configured voice provider, deployed security validation and backup restore drill are not satisfied, and owner/legal/store readiness is incomplete. Release authorization is not appropriate.
