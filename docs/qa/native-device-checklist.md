# Speeko — Native device QA checklist

**Status: NOT RUN — no physical device or emulator is attached to this workspace.**

This checklist is the reproducible remaining manual QA path for the native apps. Web/Expo-web evidence in `docs/design/screenshots/` is **not** proof of native device behavior and must not be relabelled as such.

## Environment detected during this pass

| Item | Result |
|---|---|
| Repository / branch / HEAD | `C:\duo`, branch `main`, HEAD `cf9f126e89f978fc49af63e1c4a1ac32e1a9bc9b` (work uncommitted) |
| Node / pnpm | v26.13.0 / 11.22.0 |
| Expo SDK | 58.0.26 (`apps/mobile/app.json`) |
| New architecture | enabled (`newArchEnabled: true`) |
| Android SDK | `%ANDROID_HOME% = C:\Users\rahul\AppData\Local\Android\Sdk`; platforms 35, 36, 37; build-tools 35.0.0, 36.0.0 |
| Java | 17.0.12 LTS (Gradle 8.13 wrapper cached) |
| `adb` | present, `adb devices` → **no devices attached** |
| Emulator binary | not on `PATH` (`emulator` unavailable) |
| Xcode / iOS simulator | unavailable on Windows (`xcrun` unavailable) |
| Android project | `apps/mobile/android/` exists, gitignored, `gradlew.bat` present |
| EAS profiles | `development` (developmentClient, internal), `preview` (internal), `production` (`apps/mobile/eas.json`) |

## Static native validation that can be run here

1. `pnpm --filter @speeko/mobile typecheck` — TypeScript validation of all native screens/components.
2. `pnpm --filter @speeko/mobile test` — 17 suites / 86 tests (Jest).
3. `pnpm --filter @speeko/mobile build` — Expo static web export (renderer only, not a native APK).
4. `cd apps/mobile/android && .\gradlew.bat assembleDebug --no-daemon` — compiles the native Android app **without** a device. Produces `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk` when successful. This validates Gradle configuration, Java/Kotlin compilation and native dependency resolution; it does **not** validate runtime UI/animation/permissions.

**The owner's local `apps/mobile/android/` is stale and this command currently fails there.** A read-only diagnosis and a disposable-copy experiment in this pass established:
- The native directories are entirely gitignored. Only `apps/mobile/app.json`, `apps/mobile/eas.json` and the config plugins are tracked; per official Expo CNG docs, `npx expo prebuild --clean` is the supported way to regenerate them and manual edits to `android/` do not survive regeneration.
- `npx --no-install expo install --check` → "Dependencies are up to date" for Expo SDK 58. The installed JS dependencies are therefore aligned; the failure is in the generated native project.
- Owner's generated wrapper is Gradle **8.13**; a fresh prebuild from the installed Expo 58 template generates Gradle **9.4.1** plus matching `app/build.gradle` / root `build.gradle` (RN 0.88 autolinking and Kotlin plugin resolution). Old files cause "Minimum supported Gradle version is 9.4.1", then duplicate Kotlin `kotlin` extension, then `expo-constants` `libraryVariants` errors when only the wrapper is patched.
- In a disposable copy under `%TEMP%`, `npx expo prebuild --platform android --no-install --clean` generated a fresh project; `assembleDebug` with Gradle 9.4.1 completed **501 build tasks**, including all Java/Kotlin compilation and native dependency resolution, then failed only at `:app:buildCMakeDebug[arm64-v8a]` with `ninja: error: mkdir(CMakeFiles/appmodules.dir/C_/Users/rahul/AppData/Local/Temp/opencode/speeko-prebuild-test/...): No such file or directory`. That is a Windows path-length/format artifact of the deep disposable location, not a source defect. **No APK was produced in either location.**

Exact owner next action (safe, preserves signing material):
1. Back up `apps/mobile/android/app/*.keystore`, `*.keystore.password` and any local `gradle.properties` signing lines to a secure location OUTSIDE the repo. Do not commit or share them.
2. From `apps/mobile`, run `EXPO_NO_GIT_STATUS=1 npx expo prebuild --platform android --clean --no-install`, then restore only the backed-up signing config into the regenerated project.
3. Run `.\gradlew.bat assembleDebug --no-daemon` from `apps/mobile/android`. A short project path (e.g. `C:\duo`) avoids the CMake temp-path failure seen in `%TEMP%`.
4. Verify `app/build/outputs/apk/debug/app-debug.apk` exists, record its SHA-256, then install on a device/emulator with `adb install -r <apk>` and run the checklist below.

Record the exact command output and exit status in the progress report. Do not describe an APK build as device QA.

## Required development-build steps before device QA

Expo SDK 58 with `expo-audio`, `expo-router`, `expo-asset` and the local config plugins `./plugins/withQaLoopbackCleartext` and `./plugins/withMinimalAndroidPermissions` should be treated as a **development build**, not assumed to work in Expo Go. The latter strips `SYSTEM_ALERT_WINDOW` and legacy external-storage permissions that a fresh prebuild otherwise adds; it is covered by `apps/mobile/__tests__/permissions-plugin.test.ts`.

`withQaLoopbackCleartext` is a no-op unless `SPEEKO_QA_LOOPBACK_CLEARTEXT=1` is set at prebuild time. For a **local QA build only**, prepend it to the prebuild command: `SPEEKO_QA_LOOPBACK_CLEARTEXT=1 EXPO_NO_GIT_STATUS=1 npx expo prebuild --platform android --clean --no-install`. It permits cleartext HTTP solely to `localhost`/`127.0.0.1`. The plugin hard-refuses when `EAS_BUILD_PROFILE=production`, so it cannot silently ship in a production build; do not set it for store/production builds.

1. Install EAS CLI if absent: `npm i -g eas-cli`. Sign in with an owner account (`eas login`) — owner credential, not available here.
2. From `apps/mobile`, run `eas build --profile development --platform android` (or `--platform ios` on macOS). This builds an installable development client with the native modules above.
3. Install the resulting build on a device/emulator. For a local emulator, create an AVD via Android Studio (platform 35+, Google APIs) and start it, then confirm `adb devices` lists it.
4. Start the dev server with a LAN-reachable API origin. The committed default `extra.apiUrl` is `http://localhost:3001`, which on a physical device points at the device itself. For a physical device set `EXPO_PUBLIC_API_URL` (or the app's actual API override) to the host machine's LAN IP, e.g. `http://192.168.x.x:3001`, and ensure the API's `CLIENT_ORIGINS`/CORS allows that origin. For an emulator, `10.0.2.2:3001` is the host loopback equivalent.
5. Open the development build, load the bundle from the dev server, and sign in with a **test** account. Never use owner credentials or production data.

## Remaining manual checks (exact steps)

Run these on Android first; repeat the applicable subset on iOS only if a Mac, Xcode and simulator/device are available.

### Launch / navigation
1. Cold start → loading state → welcome/onboarding or restored session → first usable screen.
2. Onboarding steps in order: language, level, motivation, daily goal, commitment → first lesson.
3. Visit all five mobile navigation destinations (Learn, Practice, Habits, Shop, Account) and confirm active state and back behavior.
4. Pull-to-refresh/reopen: background the app, kill it, relaunch → session and progress restored; no flash of another user's data.

### Lesson / exercise
5. Start a lesson from the path; answer with correct and incorrect options; use hint/retry; continue; reach the completion screen.
6. Exercise each supported type: `chooseMeaning`, `typeTranslation`, `matchPairs`, `listenChoose` (the nine bundled MP3s). Confirm audio plays only after a user action.
7. Confirm XP/hearts/streak/completion match the web behavior for the same test account; replay is practice-only.
8. Confirm the fox reacts once per event (correct/incorrect/complete) and settles back to idle; no continuous replay after re-renders or screen focus.

### Motion / accessibility
9. In Android Settings → Accessibility → Remove animations (or iOS Reduce Motion), confirm mascot continuous motion is reduced while expression/feedback remains.
10. With TalkBack/VoiceOver on, traverse each screen: every control has a meaningful name; decorative fox art is not chatty; icon-only buttons are labelled.
11. Set font size to maximum in OS settings: primary actions and bottom bars remain reachable, no clipped text.

### Platform behavior
12. Safe areas: notch/status bar and bottom gesture bar on a cutout device; fixed bottom action bar not clipped.
13. Keyboard: type in a `typeTranslation` exercise; keyboard avoidance keeps the input and Continue button visible; dismiss returns layout to normal.
14. Permissions: deny microphone when a voice surface asks; confirm the UI explains the gate and does not present an unresponsive control. Keep the voice/conversation owner gate intact.
15. Network failure: enable airplane mode mid-flow → explainable error and retry, no crash, no fake success. Repeat taps on purchase/completion must not double-count.
16. Orientation: portrait is the committed default (`orientation: portrait`); confirm no broken layout if rotation is enabled on device.
17. Low-memory/slow device: background several apps, return to Speeko → state restored, no animation loop or blank screen.

### Pass/fail recording fields (copy per run)

| Field | Value |
|---|---|
| Device/emulator model + OS version | NOT RUN |
| Build type (local debug APK / EAS development client / EAS preview) | NOT RUN |
| APK path + SHA-256 (if built) | NOT RUN |
| Expo SDK / app version | 58.0.26 / 0.0.1 |
| Date / tester | NOT RUN |
| Launch → Learn PASS/FAIL | NOT RUN |
| Five navigation destinations PASS/FAIL | NOT RUN |
| Lesson correct/wrong/finish/replay PASS/FAIL | NOT RUN |
| Recorded audio plays + stops on screen exit PASS/FAIL | NOT RUN |
| Fox idle/reaction/settle + reduced motion PASS/FAIL | NOT RUN |
| Practice / Habits / Shop / Account PASS/FAIL | NOT RUN |
| TalkBack/VoiceOver + 200% text PASS/FAIL | NOT RUN |
| Offline/API error + session expiry PASS/FAIL | NOT RUN |
| Voice gate shows honest unavailable state PASS/FAIL | NOT RUN |

### Evidence to capture when run
- Confirm the runtime is actually attached before starting: `adb devices` must list a row whose second column is `device` (not `unauthorized` or `offline`). Record its serial.
- Device/emulator model, OS version, build type (development client vs local debug APK), Expo SDK, date.
- Real device screenshots or short recordings for launch, a lesson in progress, lesson completion, Habits, Shop, Account and reduced-motion state.
- Store them under `docs/qa/native-<device-os>/` with a manifest row in `docs/design/screenshot-manifest.md`, clearly labelled `native device`.
- Do not use an Expo-web screenshot as native evidence.

## Owner-only external steps (not performed here)

- EAS account login, development/production builds and store credentials.
- Play Store / App Store accounts, signing keys/keystore and submission.
- Provisioning of the free Neon/Render/Vercel stack and secret rotation (see `docs/deploy-runbook.md`).

**Do not mark this checklist complete until a real device or emulator has been used and the evidence above exists.**
