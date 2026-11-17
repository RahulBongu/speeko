# M1 — Android app renders

## Result: PASS (debug APK, dev Metro) — release render NOT yet verified on device

Release APK **builds** cleanly from this tree; installing and launching it on the phone
is blocked — the Vivo V2336 is disconnected (see `docs/qa/mobile/release-build.md`).

### Verified on 2026-11-17

- Device: Vivo V2336 (`10BE2A1B5Q00054`), Android 16.
- API running locally on `127.0.0.1:3001`, reachable from the device via
  `adb reverse tcp:3001 tcp:3001`.
- Metro running from `C:\duo\apps\mobile` with `EXPO_NO_METRO_WORKSPACE_ROOT=1`
  in the environment (the `gradle.properties` line alone does not reach the Node
  Metro process).
- Debug APK built from this tree installed via `adb install -r`.
- App launched, loaded the bundle, and rendered the learn screen with the course list.
- Release APK: `assembleRelease` → `BUILD SUCCESSFUL in 10m 14s`;
  `app-release.apk` (21,993,757 bytes), SHA-256
  `150DE370B66B31C09B669B6A19378D458560A19A266D05D53C14CA200F5B9B2A`
  (see `docs/qa/mobile/release-build.md`). Install/launch on device: **not done** —
  phone not attached.

### UI evidence (UI dump)

- `text="speeko"`
- `text="Ten Indian languages · draft review"`
- `text="Learn"`
- `text="Bengali"`
- `text="8 lessons · 23 exercises · A1"`
- `text="0 of 8 lessons complete"`
- `text="All courses"`

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

### Regression coverage

`apps/mobile/__tests__/root-layout.test.tsx` renders the Expo Router root layout in
Jest (mocks `expo-router`'s `Stack` and `expo-status-bar`). Passing as of this edit.

### Evidence files

- `docs/qa/mobile-first-screen-success.png` — learn screen after the fix (debug)
- `docs/qa/mobile-first-screen-after-fix.png` — first attempt after the Metro fix
- `docs/qa/mobile-first-screen-error.png` — pre-fix Hermes failure
- `docs/qa/mobile/release-build.md` — release APK build evidence + device blocker
- `docs/qa/mobile/release-first-screen.png` — **NOT captured** (device disconnected)
- `docs/qa/mobile/logcat.txt` — **NOT captured** (device disconnected)

### Commands

- `pnpm --filter @speeko/mobile start`
- `./gradlew.bat assembleDebug`
- `adb install -r`
- `adb shell am start -n com.speeko.app/.MainActivity`
- `adb shell uiautomator dump`
- `EXPO_NO_METRO_WORKSPACE_ROOT=1 ./gradlew.bat assembleRelease`

### Git state

Committed on branch `next/M1` (based on `de57065`). All P12–P17 work and the M1 fixes
and evidence live on `next/M1`. Not pushed.

### Not verified yet

- **Release APK render on device** — blocked on the phone being reconnected; see
  `docs/qa/mobile/release-build.md` for the exact remaining steps.
- Full functional device QA: sign-up/sign-in, lesson completion, cross-device progress
  sync, shop, habits, sign-out. M2 tracks this.
