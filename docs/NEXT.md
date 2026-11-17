# M1 — Android app renders

## Result: PASS (release APK) — cold-starts to the learn screen; loads, fetches, navigates, no fatals

Debug render also passed (2026-11-17). Full functional QA (M2) is still pending.

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

### Git state

Branch `next/M1` (based on `de57065`); pushed. Evidence was collected 2026-11-17 with the owner actively using the device.

### Not verified yet (M2)

- Sign-up and sign-in on device, completing a lesson, cross-device progress sync, shop, habits, sign-out.
- The M2 test account (`m2-qa2@speeko.test`) exists on the local PGlite DB; its credentials are stored in `apps/api/data/qa-account.local.json` (gitignored), not in git or chat.
- Note: the debug→release handoff required uninstalling the debug build (signature mismatch), which wiped device-local guest progress.
