# M1 — Android app renders

## Result: PASS — app renders on device

### Verified on 2026-11-17
- Device: Vivo V2336 (`10BE2A1B5Q00054`), Android 16.
- API running locally on `127.0.0.1:3001`, reachable from the device via `adb reverse tcp:3001 tcp:3001`.
- Metro running from `C:\duo\apps\mobile` with `EXPO_NO_METRO_WORKSPACE_ROOT=1` in `apps/mobile/android/gradle.properties`.
- Debug APK built from this tree installed via `adb install -r`.
- App launched, loaded the bundle, and rendered the learn screen with course list.

### UI evidence (UI dump)
- `text="speeko"`
- `text="Ten Indian languages · draft review"`
- `text="Learn"`
- `text="Bengali"`
- `text="8 lessons · 23 exercises · A1"`
- `text="0 of 8 lessons complete"`
- `text="All courses"`

### Root cause fix
`apps/mobile/metro.config.js`: set `config.resolver.unstable_conditionNames = ['require']` to force the resolver to select the CommonJS `@babel/runtime/helpers/interopRequireDefault`, instead of the ESM variant selected by `['require', 'import']`. This removed the Hermes `_interopRequireDefault is not a function` failure.

### Additional fix
Added explicit `expo-linking` dependency to `apps/mobile/package.json` (was only a transitive dep and was not autolinked), resolving the `Cannot find native module 'ExpoLinking'` error.

### Evidence files
- `docs/qa/mobile-first-screen-success.png`
- `docs/qa/mobile-first-screen-error.png` (before fix)
- `docs/qa/mobile-first-screen.png` (after fix attempt)

### Commands
- `pnpm --filter @speeko/mobile start`
- `./gradlew.bat assembleDebug`
- `adb install -r`
- `adb shell am start -n com.speeko.app/.MainActivity`
- `adb shell uiautomator dump`

### Working tree
No git commit or push performed; working tree preserves all existing changes. Branch: `next/M1`.
