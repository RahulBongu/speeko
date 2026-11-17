# Speeko — Milestones

> This file now summarizes the current state. M1 historical record lives at the bottom.

## Current state (2026-11-17) — Phase 4

- **Phase 1 landed** (`next/M2`): M2 headless sign-off; M4 hardening — rate limiting (429 + Retry-After), no-store on `/api/*`, secrets-in-bundle guard wired into `pnpm verify`, production boot guard (≥32-char `BETTER_AUTH_SECRET`).
- **Phase 2 landed**: mobile onboarding ported (6 taps to first lesson, guest-first) and `wordBank` / `arrangeSentence` / `typeWhatYouHear` / `speak` shipped with mobile test coverage (77 Jest tests).
- **Phase 3 landed**: tactile/safe-area consistency pass (every route screens under `<Screen>`); dead-end error/signed-out states eliminated (single recovery CTA + Back); web design-token + a11y polish; focus rings; contrast fixes; corporate ramps; studio re-skin; `/not-found`, `/error`, `/global-error`.
- **Phase 4 landed**: alpha build verified (`pnpm verify` green; 148/148 e2e); Android AAB builds (`app-release.aab`, SHA-256 `BFB0A0F9…`); `.github/workflows/verify.yml`; `CHANGELOG.md`; `docs/deploy-runbook.md`; Play store listing copy in `docs/store/metadata/en-US/` (content is explicitly draft, honest).
- **Not merged / not published**: `next/M1`, `next/M2` are review branches; no store accounts exist; no license chosen; native speakers have reviewed nothing.

### What the owner must do next

1. License decision + OFL attribution + LICENSE file.
2. Hosting/database authorization + backups + secret rotation.
3. Native-speaker review of the 305 draft exercises.
4. Audio decision for listenChoose (10 items), or formally keep them excluded.
5. Store accounts (Play Console) + re-sign keystore/devOps (AAB from a clean prebuild, no cleartext exception).

---

## M1 — Android app renders (closed 2026-11-17)

## Result: PASS (release APK) — cold-starts to the learn screen; loads, fetches, navigates, no fatals

Debug render also passed (2026-11-17). Full functional QA on-device is not complete (headless M2 is; see NEXT section in `docs/PROGRESS.md`).

### Verified on 2026-11-17

- Device: Vivo V2336 (`10BE2A1B5Q00054`), Android 16.
- API running on `127.0.0.1:3001` (PGlite at `apps/api/data`), reached from the device via `adb reverse tcp:3001 tcp:3001`.
- **Cold start**: `pm clear` → force-stop → `am start` → uiautomator dump at ~2 s shows the
  **learn screen** with the same key text as the debug fresh-guest dump — `speeko`,
  `Ten Indian languages · draft review`, `Learn`, `START LEARNING`, `Bengali`,
  `8 lessons · 23 exercises · A1`, `0 of 8 lessons complete`, `All courses`,
  `Bengali`, `DRAFT`. See `release-cold-start-learn-dump.xml` +
  `release-cold-start-learn.png` (1080×2400, valid PNG sig `89 50 4E 47`).
- The phone was in active use during this session (the owner tapped through the app while
  evidence was being captured); every capture shows the app navigating real content and
  rendering server-fed strings. No like-for-like path difference exists beyond that.
- On-device APK hash matches the local build (`36A5D41D…`).

### Release-APK evidence

- `release-cold-start-learn-dump.xml` — learn screen at cold start (fresh guest)
- `release-cold-start-learn.png` — screenshot of the same
- `release-lesson-q1-dump.xml` — in-progress lesson (Question 1 of 3, CHOOSE THE MEANING), same session
- `release-first-screen.png` — course path screen (returning guest; UNIT 2 Telugu … `0/2 lessons done`)
- `release-ui-dump.xml` — hierarchy for the path screen
- `release-telugu-path-dump.xml` — Telugu course path hierarchy (returning guest; the file previously committed as `release-welcome-dump.xml`, was misnamed)
- `logcat.txt` — filtered; no fatal/hermes errors for any app PID (12520, 17213, 19097, 19328); `E fatal : runForegroundReporters` attributed to `com.instagram.android` (PID 29827 — **probable**, mapping taken after the events; Android reuses PIDs)
- APK `versionName=0.0.1`, `versionCode=1`; on-device sha256 == local sha256
- Full record: `docs/qa/mobile/release-build.md`

### Root cause fixes (M1)

1. `apps/mobile/metro.config.js`: `resolver.unstable_conditionNames = ['require']` (Hermes `_interopRequireDefault is not a function`).
2. Metro workspace root pinned to the app via `process.env.EXPO_NO_METRO_WORKSPACE_ROOT = '1'` **before** `require('@expo/metro-config')` — release build and dev bundle work with no shell export.
3. Explicit `expo-linking` dependency (native module was not autolinked).
4. API `CONTENT_DIR` repointed to repo-root `content/dist`.
5. QA-only loopback cleartext ships as a committed config plugin (`apps/mobile/plugins/withQaLoopbackCleartext.js`, wired in `app.json`): no-op unless `SPEEKO_QA_LOOPBACK_CLEARTEXT=1` at prebuild; **hard-refuses when `EAS_BUILD_PROFILE=production`**; store builds carry no cleartext exception.

### Regression coverage (and its limit)

`apps/mobile/__tests__/root-layout.test.tsx` renders the root layout in Jest (mocks `expo-router`/`expo-status-bar`). It proves only that the layout module executes — not a device render. Device evidence is the screenshots and dumps above.

### Not verified yet (on-device)

- Functional M2 pass remains open on hardware (headless coverage exists instead).
- Note: the debug→release handoff required uninstalling the debug build (signature mismatch), which wiped device-local guest progress.
