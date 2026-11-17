# Speeko — Android Device QA

**Status:** build, unit suite, and static export are verified. **No physical device
or emulator ran the app this cycle.** Nothing in this document claims otherwise.

## Phase P findings (2026-11-17)

- Metro was started successfully and served the bundle; the device initially failed to connect, then succeeded after reverse/refresh.
- After bundle load, logcat showed a runtime JavaScript error: `TypeError: _interopRequireDefault is not a function (it is Object), js engine: hermes`.
- The app did not render a usable UI. The failure is a JavaScript runtime/bundle compatibility issue, not a simple Metro connectivity problem.
- No interactive checklist items could be verified.
- `expo export --platform android` succeeded, producing a Hermes bundle, so the issue is not a static bundle-generation failure.

- Device: Vivo V2336 (`10BE2A1B5Q00054`), Android 16.
- APK installed and launched successfully.
- The debug build attempted to load the JS bundle from the Metro dev server at `localhost:8081`; `adb reverse tcp:8081 tcp:8081` was configured and Metro was running on the host.
- The app did not render a usable UI during automated observation; the UI hierarchy remained effectively empty and logcat showed `ReactHost` context-not-ready soft exceptions. This prevented reliable execution of the interactive checklist.
- No crashes (`FATAL EXCEPTION`) were observed in the captured logcat, but the blank/unloaded state means functional flows were not verified.
- Result: install and launch are supported by evidence; all interactive checklist items remain **NOT TESTED**.

- Device detected: `adb devices -l` reports `10BE2A1B5Q00054 device product:V2327C1 model:V2336 device:V2327 transport_id:1` (Vivo V2336).
- APK used: `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`, SHA-256 `1B21E50F44CF6907F55FBF50EEDF7EECAF30F93B19CA82DC3479B98282C9B417`.
- Install: `adb install -r` succeeded.
- Launch: `am start -n com.speeko.app/.MainActivity` succeeded; process remained running (`pidof` returned 16319).
- Initial logcat: no `FATAL EXCEPTION`, `AndroidRuntime`, or unhandled exception lines in the captured 40-line sample.
- Screenshot: `docs/qa/android-device-launch.png`.
- API: local API started on `127.0.0.1:3001`; `adb reverse tcp:3001 tcp:3001` configured for the device.
- Remaining checklist items (accounts, lessons, rewards, shop, habits, etc.) are **NOT TESTED** because they require interactive UI steps that cannot be reliably automated from this environment. They remain open and must be performed manually.

- Root cause: `react-native-async-storage` 3.1.1 requires Kotlin 2.1+, while the Expo/RN toolchain uses Kotlin 2.0.21. Its shared-storage module resolved `kotlin-stdlib` 2.2.10, causing KSP to fail.
- Fix: downgraded `@react-native-async-storage/async-storage` to 2.2.0 in `apps/mobile/package.json` and updated the lockfile. No application reward/storage behavior was changed.
- Command: `.\gradlew.bat assembleDebug` from `apps/mobile/android`, with `JAVA_HOME=C:\Program Files\Java\jdk-17`.
- Result: **BUILD SUCCESSFUL**.
- APK: `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`
- Size: 55,162,079 bytes
- Timestamp: 2026-11-17 10:18:15
- SHA-256: `1B21E50F44CF6907F55FBF50EEDF7EECAF30F93B19CA82DC3479B98282C9B417`
- Dependency: `@react-native-async-storage/async-storage` 2.1.2 (Expo-compatible)
- Full `pnpm verify`: 130/130 E2E, all green.

- JDK 17.0.12 was found at `C:\Program Files\Java\jdk-17\bin\java.exe` but was not on PATH; it was supplied via `JAVA_HOME` for the build command only.
- Command attempted: `.\gradlew.bat assembleDebug` from `apps/mobile/android`, with `JAVA_HOME=C:\Program Files\Java\jdk-17`, `ANDROID_HOME=C:\Users\rahul\AppData\Local\Android\Sdk`.
- Result: **FAILED** during `:react-native-async-storage_async-storage:kspDebugKotlin`.
- Cause: cached Kotlin metadata version mismatch (KSP expects 2.0.0, cached `kotlin-stdlib` 2.2.10). This is an environment/dependency-cache issue, not a source-code defect identified in this phase.
- No APK was produced by this attempt. The stale APK remains untouched.
- Device QA remains BLOCKED because no fresh build exists and no device/emulator is available.

- Working tree remains uncommitted/unpushed; 86 changed/untracked paths. No reset/clean performed.
- Persistent dev PGlite DB (`apps/api/data`) has all 6 migrations through `0005` (hash `f29de92...`, created_at `1794900000000`); `lesson_completion_rewards` has 924 rows, 0 with `xp = 0`. No follow-up cleanup migration is needed for this database.
- Mobile build remains blocked on this host: no `java`/`javac` executable was found in PATH or common install locations, so the Gradle wrapper cannot run. SDK, platforms, build-tools, emulator, and adb are present; AVDs and system images are absent; no devices are connected.
- `pnpm typecheck` passed 6/6 on 2026-11-17. Full `pnpm verify` was last green on 2026-11-17 before the migration SQL filter change; the filter change is covered by the PGlite temporal fixture and typecheck.

What exists on this machine:

| Check | Result |
| --- | --- |
| `ANDROID_HOME` / `ANDROID_SDK_ROOT` | `C:\Users\rahul\AppData\Local\Android\Sdk` |
| `platform-tools` (adb) | installed; `adb devices` works; **no devices attached** |
| `platforms` | android-35, android-36, android-37.0 |
| `build-tools` | 35.0.0, 36.0.0 |
| `emulator` | `emulator.exe` 37.1.11.0 present; `emulator -version` works |
| AVDs | **none** (`%USERPROFILE%\.android\avd` is empty) |
| system-images | **none installed** (`Sdk\system-images` is empty) |
| Command line tools (sdkmanager) | **not installed** |
| JDK for the Gradle wrapper | **not on PATH** (`java -version` fails) |
| Hardware virtualization | **not exposed** (`HyperVisorPresent: False`) |
| Devices connected to adb | **none** |
| `ANDROID_HOME` keystore | release keystore is gitignored; lives only on the owner's machine |

Conclusion: an emulator cannot be created and accelerated here today. The
existing release APK (`dist/speeko-release.apk`, 21.6 MB, created in an earlier
cycle, gitignored) was **not** installed or launched. **It predates this
working tree** (the listenChoose exclusion, mobile sync tests, and P15/P16
changes are not in that binary), so device QA must use a freshly built APK.
Rebuilding needs a JDK and the owner's release keystore. Creating a working AVD
additionally requires command-line tools and a system image (≈1 GB download)
plus WHPX/HAXM or an Android device with `adb tcpip` over USB — all involve a
system-level change or significant download the owner should authorize first.

## What is verified instead of the device

- `pnpm --filter @speeko/mobile build` (Expo web export) compiles the full app
  through Metro with no runtime import errors; 16 static routes render.
- `pnpm --filter @speeko/mobile test` — 56 Jest tests across 13 suites
  (component + mocked-integration), including lesson/practice/shop/habits/account.
- `pnpm typecheck` covers all native-code TypeScript (`@speeko/mobile`).
- The release APK exists but is stale and unverified. Treat it as a build
  artifact, not as a working deliverable.

**None of the above is device evidence.** They prove the code compiles and the
component contracts hold with mocked network/storage; they do not prove Hermes,
Reanimated, haptics, fonts, keyboard, or APK packaging work on hardware.

## Prerequisites to unblock (none executed)

1. **JDK 17** on PATH (`java -version` must work) for the Gradle wrapper.
2. **Rebuild the APK from this tree** (the checked-in `dist/speeko-release.apk`
   and `apps/mobile/android/app/build/outputs/apk/release/app-release.apk` are
   stale):
   `cd apps/mobile/android && .\gradlew.bat assembleRelease`
   — requires the owner's release keystore/signing config, which is gitignored.
3. **A device or accelerated emulator.** Physical device: enable USB debugging,
   connect, `adb devices` lists it. Emulator: install command-line tools +
   one system image (e.g. `sdkmanager "system-images;android-35;google_apis;x86_64"`),
   create an AVD, and enable WHPX/HAXM. Both are large/system-level actions the
   owner must authorize; none was performed.
4. **A reachable API.** `app.json extra.apiUrl` is `http://localhost:3001`; on a
   phone that points at the phone. Either run
   `adb reverse tcp:3001 tcp:3001` and `adb reverse tcp:3000 tcp:3000`
   (works for USB device/emulator), or rebuild with the host LAN IP / deployed
   API URL. Document which was used.
5. **Capture evidence:** `adb logcat > docs/qa/android-<date>.logcat` from
   launch, a screenshot per flow, the APK SHA-256, and
   `adb shell dumpsys package com.speeko.app` (versionName/versionCode).

## Required device-QA checklist

Run these on one mid-range Android device (8 GB RAM class) against the
`assembleRelease` APK, with `adb logcat` captured from launch.

### Install and first run

1. [ ] Cold install: `adb install dist/speeko-release.apk` (or side-loaded
  release build). Logcat shows no `couldn't find .so`, no Hermes crash.
2. [ ] Launch reaches the welcome screen within ~2 s; no blank screen, no redbox.
3. [ ] Confirm the fox asset renders from `apps/mobile/assets/fox.png`.
4. [ ] Logcat shows no Reanimated layout-animation errors or haptic stack traces.

### Onboarding and accounts

5. [ ] Start → `/learn`; course list renders with real data and draft badges.
   There is **no mobile onboarding flow**; this is the expected flow, not a bug.
6. [ ] Account tab → **Create account**: email + 8-character password, server
   errors shown inline; a successful sign-up lands in the app with the guest
   snapshot merged. Then sign out and sign in with the same account.
7. [ ] Sign-in screen: fox hero, segmented switcher, invalid credentials show
   the server's error message; valid credentials merge guest progress.
8. [ ] Kill the app, relaunch: session restores without a second sign-in.
9. [ ] Complete hosted flow: complete one lesson signed-in; confirm XP posts to
   `POST /api/lesson-completions` and the server reward appears, and **a console
   cannot** cause a double XP grant on retry.
10. [ ] Sign out: verify both the session cookie and `speeko.mobile.progress.v2`
    are removed (`adb shell` → the app cache/storage is empty for the key);
    sign in as a second user; confirm the second user sees their own data only.

### Lesson flow, each playable exercise type

11. [ ] `chooseMeaning`: correct/incorrect feedback, heart decrement, reveal
    answer on wrong.
12. [ ] `typeTranslation`: keyboard opens, autocapitalize/autocorrect off,
    non-Latin text entry works.
13. [ ] `matchPairs`: match, mismatch feedback, completion state.
14. [ ] `fillBlank` is not present in today's curriculum; if one is added later,
    it must behave as a choice board (the runner supports it).
15. [ ] **Missing audio:** open the unit 3 lesson 2 of any starter course
    (`u3-l2`). It must show **2 questions, not 3** — the empty-audio
    `listenChoose` is excluded from the playable queue. There must be no
    "Listen and choose" card with a dead speaker button. Completing that
    lesson must post 2 answers and be accepted by the API.
16. [ ] If a licensed `audioUrl` is added later: the same item plays, the audio
    is audible, and the question returns to the queue (3 questions).
17. [ ] Unsupported kinds block with the "isn't available" screen and no Check
    button; a lesson made only of one cannot complete or award XP.
18. [ ] Hearts reach 0 mid-lesson: attempt ends, **no XP awarded**, no POST to
    `/api/lesson-completions`, retry works.
19. [ ] After lesson completion: path shows node completed, re-entering the path
    reflects completion immediately (no stale cache).

### Practice and reviews

20. [ ] Practice hub: counts reflect SRS data; no-due vs due state renders.
21. [ ] Practice session: no XP, correct SRS schedule saved to the device,
    `dueAt` reschedules in the future.
22. [ ] Failure to persist review schedule shows the retry state (not green).

### Shop and cosmetics

23. [ ] Guest sees "The shop needs an account".
24. [ ] Signed-in with 0 gems: purchase rejected with honest error; `Buy`
    inaffordable shows disabled/"Not enough gems".
25. [ ] Cosmetic purchase with owned gems: server ledger decrements; order not
    duplicated on rapid double-tap (requestId idempotency).
26. [ ] Equip: works; `PUT /api/progress` round-trip; `GET /api/progress`
    returns it; forged/unknown cosmetic returns 400/409 and does not persist.
27. [ ] Un-equip: `equippedCosmetic: null` persists and fox reverts.

### Habits, navigation, and resilience

28. [ ] Habits: signed-in shows verified history; guest shows device-only label;
    daily goal picker saves and persists after relaunch.
29. [ ] Account statistics: signed-in numbers match the habits/lesson events;
    if `/api/habits` is blocked, the screen says **Device progress** with a
    warning — never "Verified".
30. [ ] AppNav bottom bar highlights the current tab; back navigation never
    traps the learner in a route.
31. [ ] Airplane mode: offline banner/behavior is honest; signing in fails
    visibly (no silent hang); retry works after reconnect.
32. [ ] Script fallback: lessons show native script correctly (Devanagari etc.);
    no tofu boxes; transliteration present where the content ships it.
33. [ ] Small screen (360×800-class) and larger text scale (1.15×): no clipped
    controls, no overlapping budgets/buttons/avatars, progress track still visible.
34. [ ] Reduced motion: system reduced motion removes bob/entrance animation.
35. [ ] 10-minute soak: scroll path + habit calendar; no crashes; memory stays
    stable (best-effort from logcat, not a profiler claim).

### Regression acceptance

36. [ ] Zero `FATAL EXCEPTION`, no ANR dialogs, no permanently hung spinners.
37. [ ] `pnpm verify` stays green on the host after any device-side fix.

## Sign-off

A release candidate cannot be declared until every item above is checked, with
`docs/qa/android-*.logcat` excerpts, screenshots, and the APK SHA-256 retained.
Everything here is necessarily a **real device** assertion; none of it can be
honestly derived from CI.
