# M1 — Android app renders

## Result: PASS (release APK) — loads and renders real server-fed content, no fatals

Not compared like-for-like to the debug screen: the debug dump shows the learn
screen, the release dumps show the Bengali course path (the app cold-starts there for
returning guests; fresh guests for this course see UNIT 1 "START · LESSON 1"). The
debug-era corrupt captures were thrown out; no like-for-like learn screen was captured
on release during this run.

Debug render also passed (2026-11-17). Full functional QA (M2) is still pending.

### Verified on 2026-11-17

- Device: Vivo V2336 (`10BE2A1B5Q00054`), Android 16.
- API running on `127.0.0.1:3001` (PGlite at `apps/api/data`), reached from the device via `adb reverse tcp:3001 tcp:3001`.
- Debug APK built and installed; it rendered the learn screen (see `docs/qa/mobile/learn-screen-ui-dump.xml`).
- Release APK: after a loopback-only cleartext fix, installed via `adb install -r`; cold start loads the bundle; Bengali course path renders with lesson nodes.
- On-device APK hash matches the local file (`36A5D41D1D0872C80E0226894E75ADFA390421BB4BD19F1BBEAA1B1365625400`).

### Release-APK evidence

- `docs/qa/mobile/release-first-screen.png` — valid PNG 1080×2400, sig `89 50 4E 47`; course path screen (device in live use; UNIT 2 visible)
- `docs/qa/mobile/release-ui-dump.xml` — UI hierarchy of the same screen (UNIT 2 Numbers … "0/2 lessons done")
- `docs/qa/mobile/release-first-launch-dump.xml`, `release-welcome-dump.xml` — same path screen for a fresh guest (`pm clear`): UNIT 1 Greetings, `START · LESSON 1`, `0 of 8 lessons complete` (UNIT 2 unlocked earlier is explained in `release-build.md`)
- `docs/qa/mobile/logcat.txt` — no fatal/hermes errors for any app process; `E fatal : runForegroundReporters` attributed to `com.instagram.android` (PID 29827, per `ps -A`); PIDs 12520/17213/19097/19328 = app; full record in `release-build.md`
- APK `versionName=0.0.1`, `versionCode=1`; on-device sha256 == local sha256
- Full record: `docs/qa/mobile/release-build.md`

### Root cause fixes (M1)

1. `apps/mobile/metro.config.js`: `resolver.unstable_conditionNames = ['require']` (Hermes `_interopRequireDefault is not a function`).
2. Metro workspace root pinned to the app via `process.env.EXPO_NO_METRO_WORKSPACE_ROOT = '1'` **before** `require('@expo/metro-config')` — release build and dev bundle now work with no shell export.
3. Explicit `expo-linking` dependency (native module was not autolinked).
4. API `CONTENT_DIR` repointed to repo-root `content/dist`.
5. Android release build: loopback-only cleartext allowed via `apps/mobile/plugins/withQaLoopbackCleartext.js`, a QA-only config plugin (no-op unless `SPEEKO_QA_LOOPBACK_CLEARTEXT=1` at prebuild; store/release builds carry no cleartext exception). See `release-build.md`.

### Regression coverage (and its limit)

`apps/mobile/__tests__/root-layout.test.tsx` renders the root layout in Jest (mocks `expo-router`/`expo-status-bar`). It proves only that the layout module executes — not a device render. Device evidence is the screenshot and dumps above.

### Evidence files

- `docs/qa/mobile/learn-screen-ui-dump.xml` — intact UI dump from the debug passing session
- `docs/qa/mobile/release-first-screen.png`, `release-ui-dump.xml` — release render evidence (path screen)
- `docs/qa/mobile/release-first-launch-dump.xml`, `release-welcome-dump.xml` — fresh-guest release dumps
- `docs/qa/mobile/logcat.txt` — filtered logcat; attribution in `release-build.md`
- `docs/qa/mobile/release-build.md` — build + reproducibility + on-device record
- `docs/qa/rejected-captures/` — earlier corrupt captures (UTF-16 transcodes), rejected

### Not verified yet (M2)

- Sign-up and sign-in on device, completing a lesson, cross-device progress sync, shop, habits, sign-out.
- The M2 test account (`m2-qa2@speeko.test`) exists on the local PGlite DB; its credentials are stored in `apps/api/data/qa-account.local.json` (gitignored), not in git or chat.
- Note: the debug→release handoff required uninstalling the debug build (signature mismatch), which wiped device-local guest progress.

### Git state

Branch `next/M1` (based on `de57065`). Latest pushed commit includes this evidence pack confirmation; earlier commits `ea95aee`, `12c8044`, `47f8bfd`, `73ebfff`, `9bbdd83`.
