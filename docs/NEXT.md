# M1 — Android app renders

## Result: PASS (debug APK, dev Metro) — release render NOT yet verified on device

Release APK **builds** cleanly from this tree; installing and launching it on the phone
is blocked — the Vivo V2336 is disconnected (see `docs/qa/mobile/release-build.md`).

### Verified on 2026-11-17

- Device: Vivo V2336 (`10BE2A1B5Q00054`), Android 16.
- API running locally on `127.0.0.1:3001`, reachable from the device via
  `adb reverse tcp:3001 tcp:3001`.
- Metro running from `C:\duo\apps\mobile`; `apps/mobile/metro.config.js` pins Metro's
  server root to this app (before `@expo/metro-config` loads), so no environment
  variable is needed. See `docs/qa/mobile/release-build.md`.
- Debug APK built from this tree installed via `adb install -r`.
- App launched, loaded the bundle, and rendered the learn screen with the course list.
- Release APK: `assembleRelease` without `EXPO_NO_METRO_WORKSPACE_ROOT` exported →
  `BUILD SUCCESSFUL in 2m 51s` after the Metro workspace-root fix in
  `apps/mobile/metro.config.js`; `app-release.apk` (21,993,757 bytes), SHA-256
  `150DE370B66B31C09B669B6A19378D458560A19A266D05D53C14CA200F5B9B2A`
  (see `docs/qa/mobile/release-build.md`). Install/launch on device: **not done** —
  phone not attached.

### UI evidence (uiautomator dump — the only intact render evidence)

Captured in the post-fix session; `adb pull`-ed dump
`docs/qa/mobile/learn-screen-ui-dump.xml` (17,608 bytes, valid UTF-8 XML):

- `text="speeko"`
- `text="Ten Indian languages · draft review"`
- `text="Learn"`
- `text="START LEARNING"`
- `text="Bengali"`
- `text="8 lessons · 23 exercises · A1"`
- `text="0 of 8 lessons complete"`
- `text="All courses"`
- `content-desc="Start learning"`, `content-desc="Bengali course, 0 of 8 lessons complete"`

### Screenshots: none — all four captures were corrupt and are rejected

Every `adb exec-out screencap -p > …` used PowerShell redirection, which
transcoded the PNGs to UTF-16LE. No `.png` from 2026-11-17 is a valid image.
All four are moved to `docs/qa/rejected-captures/` and labeled there (see its
README). **No screenshot evidence exists for M1**; the render evidence is the
uiautomator dump above. This must be redone on-device before M1 can close.

### Root cause fix

`apps/mobile/metro.config.js`: set `config.resolver.unstable_conditionNames = ['require']`
to force the resolver to select the CommonJS `@babel/runtime/helpers/interopRequireDefault`,
instead of the ESM variant selected by `['require', 'import']`. This removed the Hermes
`_interopRequireDefault is not a function` failure.

### Additional fix

Added explicit `expo-linking` dependency to `apps/mobile/package.json` (was only a
transitive dep and was not autolinked), resolving the `Cannot find native module
'ExpoLinking'` error.

### API fix

`apps/api/src/routes/courses.ts`: `CONTENT_DIR` repointed to repo-root `content/dist`;
`/api/courses` returned 500 before the fix and serves 11 courses after it.

### Regression coverage (and its limit)

`apps/mobile/__tests__/root-layout.test.tsx` renders the Expo Router root layout in
Jest (mocks `expo-router`'s `Stack` and `expo-status-bar`). It proves only that the
layout module and its import chain execute under Jest. It does **not** show that the
app renders on a device — the debug on-device evidence is the uiautomator dump above;
there is no screenshot. The release-APK render is unverified until the phone reconnects.

### Evidence files

- `docs/qa/mobile/learn-screen-ui-dump.xml` — intact uiautomator dump from the passing debug session (the render evidence)
- `docs/qa/rejected-captures/` — all four `adb exec-out` screencaps from 2026-11-17; corrupt (UTF-16LE transcode), rejected, not valid PNGs
- `docs/qa/mobile/release-build.md` — release APK build evidence + device blocker
- `docs/qa/mobile/release-first-screen.png` — **NOT captured** (device disconnected; capture must use the binary-safe procedure in `docs/qa/rejected-captures/README.md`)
- `docs/qa/mobile/logcat.txt` — **NOT captured** (device disconnected)

### Commands

- `pnpm --filter @speeko/mobile start`
- `./gradlew.bat assembleDebug`
- `adb install -r`
- `adb shell am start -n com.speeko.app/.MainActivity`
- `adb shell uiautomator dump`
- `./gradlew.bat assembleRelease` (no environment variable needed; see `docs/qa/mobile/release-build.md`)

### Git state

Committed on branch `next/M1` (based on `de57065`). `ea95aee` (M1 release
build evidence) is pushed; the evidence-correction commit that follows it on the
branch contains the rejected-capture cleanup and the PROGRESS/NEXT duplicate
fixes.

### Not verified yet

- **Release APK render on device** — blocked on the phone being reconnected; see
  `docs/qa/mobile/release-build.md` for the exact remaining steps.
- Full functional device QA: sign-up/sign-in, lesson completion, cross-device progress
  sync, shop, habits, sign-out. M2 tracks this.
