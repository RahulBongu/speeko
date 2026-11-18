# Speeko — Milestones

> This file now summarizes the current state. M1 historical record lives at the bottom.

## Current state (2026-11-18) — engineering complete, owner gates open

**Repository state**

| Ref | Contents | CI |
| --- | --- | --- |
| `main` | `5762c09` (merge of PR #7) — M1 render work + M2 headless sign-off + M4 hardening + self-provisioned e2e + league profile batching (`d5d6a74`) + handoff docs + license files (D79) + hosting configuration (D80) + web license bundling + in-app mobile licenses + proxy-aware rate limiting | Push run on `5762c09` |

- `next/M1`, `next/M2`, and `next/M3` are merged into `main` via PRs #4-#7. Nothing is open.
- Working tree clean, version `0.0.1` (`versionCode 1`). No store submission, nothing published. No pull requests are open.
- Full `pnpm verify` on `5762c09`: typecheck 6/6, unit **217** (108 core + 16 content + 12 API + 81 mobile), build 5/5, secrets **0 hits / 160 files**, licenses PASS, e2e **154/154 in 4.1m with 0 flakes**. (The earlier `d5d6a74` cut was 201 unit and 148/148 e2e; the merged license-artifact check brought e2e to 150.)
- **License decided (D79):** Apache-2.0 for source code, All Rights Reserved for course content/brand/design/docs, OFL-1.1 text for the bundled fonts. Web texts ship at `/licenses/*` (auto-built, e2e-guarded); the mobile app ships an in-app `/licenses` screen from a generated bundle, guarded by `pnpm check:licenses`.

**What landed**

- **M2 + M4:** headless sign-off; `/api/auth/*` limited to 60 requests/min per IP; `PUT /api/progress` limited to 30/min per account+IP; `429` + `Retry-After`; `Cache-Control: no-store` on `/api/*`; build-output secrets scan wired into `pnpm verify`; production boot refuses a missing or <32-character `BETTER_AUTH_SECRET`.
- **Mobile parity:** onboarding (6 taps to the first lesson), `wordBank`, `arrangeSentence`, `typeWhatYouHear`, `speak`; 9 of 10 published kinds render, `chooseImage` blocks honestly and is not used by any curriculum item.
- **Design + hardening:** tactile/safe-area consistency, honest dead-end states, focus rings, contrast fixes, web design-token pass, `/not-found`, `/error`, `/global-error`.
- **Release package:** Android AAB (`app-release.aab`, SHA-256 `BFB0A0F94BDB7067BF1A4A9588DD419A909A4D125EB267B7409E05D7F8D3ABE0`), CI workflow, `CHANGELOG.md`, deploy runbook, honest Play listing copy.
- **Post-merge fixes:** e2e accounts self-provision through the real sign-up API (no fixture or credential in source); the rate-limit contract runs against an isolated API with the limiter forced on; `/api/leagues` resolves profiles in one batch (1,453 weekly learners: 16–30 s → <1.2 s).

### What the owner must do next

0. **Done** — PR #7 merged the mobile licenses and proxy-aware rate limiting as `5762c09`. Render deploys from `main`.
1. License: decided 2026-11-18 (Apache-2.0 code, All Rights Reserved content/brand, OFL fonts). Web texts ship at `/licenses/*` (auto-built); the mobile app ships an in-app `/licenses` screen. Rebuild the signed Android artifact so it includes the new screen.
2. Hosting: Option A (Neon + Render + Vercel) is decided and configured in `render.yaml` + `docs/deploy-runbook.md`. Create the three projects, set the secrets (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CLIENT_ORIGINS`, `TRUST_PROXY_HOPS=1`, plus `API_PROXY_TARGET` and the shared `API_PROXY_SECRET` on both Vercel and Render), deploy, then arrange backups and secret rotation.
3. Native-speaker review of the 305 draft exercises (10 locales).
4. Audio decision for `listenChoose` (10 items), or formally keep them excluded.
5. Store accounts (Play Console) + a clean release prebuild (no cleartext exception).
6. Optional, owner-only: an on-device functional pass. The assistant must not reconnect the phone; headless web/API verification is the accepted evidence for this alpha.

---

## M1 — Android app renders (closed 2026-11-17)

## Result: PASS (release APK) — cold-starts to the learn screen; loads, fetches, navigates, no fatals

Debug render also passed (2026-11-17). Full functional QA on-device is not performed — the owner waived it (D78); headless M2 covers the flows (see `docs/PROGRESS.md`).

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

- Functional device QA is unperformed; the owner waived it for the internal alpha (D78) — headless web/API coverage stands in.
- Note: the debug→release handoff required uninstalling the debug build (signature mismatch), which wiped device-local guest progress.
