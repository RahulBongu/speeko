# M1 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Release APK build evidence (2026-11-17)

## Status: PASS (release APK) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â M1 complete on device (2026-11-17)

The release APK installs, cold-starts, loads the bundle (`ReactNativeJS: Running
"main"`), renders real course content (Bengali course path with lesson nodes), and
shows no fatal/hermes errors in logcat. The APK on the device is byte-identical to
the file that was built.

### Metro workspace-root root cause (fixed 2026-11-17 in `12c8044`)

The first release attempt failed with `Unable to resolve module ./index.ts from
C:\duo/.` Exporting `EXPO_NO_METRO_WORKSPACE_ROOT=1` in the shell made the build
pass, but that was not a fix ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â the same failure hit any shell or CI machine
without the export.

Root cause: `@expo/config#getMetroServerRoot` calls `resolveWorkspaceRoot()`
and misfires in this pnpm monorepo, resolving Metro's server root to the
repository root (`C:\duo`). Nothing in the Android gradle plugin reads
`EXPO_NO_METRO_WORKSPACE_ROOT` ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â the variable is consumed only by
`@expo/config` from the **Node process environment**, so the line in
`apps/mobile/android/gradle.properties` never reached the spawned Metro process.

Root fix: `apps/mobile/metro.config.js` now sets
`process.env.EXPO_NO_METRO_WORKSPACE_ROOT = '1'` **before** `@expo/metro-config`
is loaded, so every Metro entry point (`react-native bundle` from gradle, the
dev server, `expo export`) resolves the same deterministic server root ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â this
app ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â regardless of the caller's environment. The two lines are:

```js
process.env.EXPO_NO_METRO_WORKSPACE_ROOT = '1';

const { getDefaultConfig } = require('@expo/metro-config');
```

**Do not reorder them.** `@expo/config` reads the variable at require time;
requiring `@expo/metro-config` first (or removing the line) reintroduces the
misresolution and the build fails again.

The `gradle.properties` line is
left in place (harmless; it documents the requirement historically) but is no
longer load-bearing.

Proof: `./gradlew.bat assembleRelease` in a shell **without**
`EXPO_NO_METRO_WORKSPACE_ROOT` ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ `BUILD SUCCESSFUL in 2m 51s`;
`:app:createBundleReleaseJsAndAssets` wrote
`android\app\build\generated\assets\createBundleReleaseJsAndAssets\index.android.bundle`.

The paragraph that previously claimed the resulting APK was "byte-identical, as
expected" is **superseded** and removed ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â in that run `packageRelease` was
`UP-TO-DATE`, so the hash match proved nothing about the APK. See
"Byte-reproducibility check" below for the forced-rewrite measurement.

### What was done

Command (from `C:\duo\apps\mobile\android`):

```
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-17'
$env:ANDROID_HOME = 'C:\Users\rahul\AppData\Local\Android\Sdk'
$env:NODE_ENV = 'production'
.\gradlew.bat assembleRelease   # EXPO_NO_METRO_WORKSPACE_ROOT deliberately NOT set
```

Result: `BUILD SUCCESSFUL in 2m 51s` ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â `478 actionable tasks: 18 executed, 460 up-to-date`.

Artifact:

- Path: `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`
- Size: 21993757 bytes
- SHA-256: `150DE370B66B31C09B669B6A19378D458560A19A266D05D53C14CA200F5B9B2A`
- Modification time of the current APK: 2026-11-17 16:52:19

### Byte-reproducibility check (2026-11-17, prompted by identical hashes)

Identical hashes across builds are not automatically trustworthy as
reproducibility evidence ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â gradle may leave an `UP-TO-DATE` task untouched.
Verified explicitly:

1. First rebuild (bundle-output deleted, APK present): log lines
   `:app:createBundleReleaseJsAndAssets` (executed),
   `:app:mergeReleaseAssets UP-TO-DATE`,
   `:app:packageRelease UP-TO-DATE` ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â the APK at 16:19:27 was NOT rewritten.
   The identical hash there proved only that the bundle task is deterministic,
   not that the APK was rebuilt.
2. Forced rewrite: the generated bundle assets and the APK were removed, then
   `assembleRelease` was re-run **without** `EXPO_NO_METRO_WORKSPACE_ROOT`:
   `:app:createBundleReleaseJsAndAssets` (executed),
   `:app:packageRelease` (executed) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â `BUILD SUCCESSFUL in 2m 42s`.
   The new APK (mtime 16:52:19) has **the same size and the same SHA-256**
   (`150DE370ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦`) as the 16:19 build. Byte-for-byte reproducibility in this
   environment is confirmed, not inferred from an up-to-date no-op.

**Scope:** the APK is gitignored and is not committed; the reproducibility
claim rests on the hashes recorded in this document, not on anything a
reviewer can diff in git.

### On-device verification (2026-11-17, completed)

Device: Vivo V2336 (`10BE2A1B5Q00054`), Android 16. API running on the host at
`127.0.0.1:3001` (PGlite at `apps/api/data`), reached via `adb reverse tcp:3001 tcp:3001`.

What happened, in order:

1. **Signature mismatch on install.** `adb install -r` failed with
   `INSTALL_FAILED_UPDATE_INCOMPATIBLE: Existing package com.speeko.app signatures do not
   match newer version` ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â the installed app was the debug build (debug key); the release
   APK is signed with `release.keystore`. The debug build was uninstalled (wipes
   device-local guest progress) and the release APK installed cleanly.
2. **"Courses couldn't load ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Network request failed".** The release app could not reach
   `http://localhost:3001`: the debug manifest sets `usesCleartextTraffic="true"`; the
   main (release) manifest does not, so Android blocks cleartext HTTP by default. Fixed
   with a **loopback-only** network security config
   (`apps/mobile/android/app/src/main/res/xml/network_security_config.xml`: base-config
   blocks cleartext; a domain-config permits it ONLY for `localhost` and `127.0.0.1`),
   referenced as `android:networkSecurityConfig` on the `<application>` element. Nothing
   else is permitted in cleartext.
   **The `android/` directory is gitignored** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â but as of the latest commit the edit is
   reproducible from git: `apps/mobile/plugins/withQaLoopbackCleartext.js` is a config
   plugin (wired in `app.json` under `plugins`) that applies exactly this XML and this
   attribute **only when `SPEEKO_QA_LOOPBACK_CLEARTEXT=1`** is set at prebuild time;
   without it the plugin is a no-op, so release/store builds carry no cleartext
   exception. Verified: after `SPEEKO_QA_LOOPBACK_CLEARTEXT=1 npx expo prebuild
   --no-install --platform android`, the `xml` file and manifest attribute are
   identical to this hand edit, and everything else in the tree is unchanged except a
   trailing newline in `gradle.properties`.

   ```xml
   <network-security-config>
     <base-config cleartextTrafficPermitted="false">
       <trust-anchors><certificates src="system" /></trust-anchors>
     </base-config>
     <domain-config cleartextTrafficPermitted="true">
       <domain includeSubdomains="false">localhost</domain>
       <domain includeSubdomains="false">127.0.0.1</domain>
     </domain-config>
   </network-security-config>
   ```

   If loopback cleartext is ever needed permanently for release QA, the durable decision
   (prebuild/config plugin) belongs to the owner.
3. **Rebuilt and re-verified.** `assembleRelease` ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ `BUILD SUCCESSFUL in 6m 3s`
   (37 executed, 441 up-to-date). **The APK is no longer `150DE370ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦`** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â the manifest and
   the new resource changed it. Current artifact:
   - Path: `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`
   - Size: 21,994,289 bytes
   - SHA-256: `36A5D41D1D0872C80E0226894E75ADFA390421BB4BD19F1BBEAA1B1365625400`
   - `versionName=0.0.1`, `versionCode=1` (from `dumpsys package`)
4. **Install + hash check.** `adb install -r` succeeded. On-device APK:
   `adb shell pm path` ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢
   `/data/app/~~OGKYgJb4skPfE_9dsriQNA==/com.speeko.app-Pi2JRZBlxKEISWSd6sL9MQ==/base.apk`;
   `adb shell sha256sum` ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ `36a5d41d1d0872c80e0226894e75adfa390421bb4bd19f1bbeaa1b1365625400`
   ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â **identical to the local file**, size 21,994,289 bytes.
5. **Render evidence (cold start).** With the phone untouched during the capture window,
   a fresh guest (`pm clear` ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ force-stop ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ `am start`) cold-starts to the **learn
   screen** at ~2 seconds (`release-cold-start-learn-dump.xml`,
   `release-cold-start-learn.png` ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â 1080ÃƒÆ’Ã¢â‚¬â€2400, sig `89 50 4E 47`). Its key text matches
   the debug fresh-guest dump node-for-node: `speeko`, `Ten Indian languages Ãƒâ€šÃ‚Â· draft
   review`, `Learn`, `START LEARNING`, `Bengali`, `8 lessons Ãƒâ€šÃ‚Â· 23 exercises Ãƒâ€šÃ‚Â· A1`,
   `0 of 8 lessons complete`, `All courses`, `Bengali`, `DRAFT`.
   Additional release captures from the same session, all while the owner was actively
   tapping (not taken at cold start, and not claimed as such):
   `release-first-screen.png` / `release-ui-dump.xml` ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â course path screen showing
   UNIT 2 `Numbers` ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ `0/2 lessons done`; `release-telugu-path-dump.xml` ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â the Telugu
   starter path screen (previously misnamed `release-welcome-dump.xml`, renamed);
   `release-lesson-q1-dump.xml` ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â lesson in progress (`Question 1 of 3`, `CHOOSE THE
   MEANING`, `Hello & Thanks`). `release-first-launch-dump.xml` was an identical MD5
   duplicate of `release-welcome-dump.xml` and was deleted.
   Note: earlier dumps in this session (before the cold-start ritual) all showed a screen
   the owner had navigated to ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â the device was in constant use, which is why the like-for-like
   cold-start comparison required the explicit untouched-phone sequence.
6. **Unit 2 was explained, not assumed.** The server held zero lesson completions for
   the QA account (/api/progress returned completed: {}, /api/habits totals 0 XP / 0
   lessons) and bmgr list sets reports No restore sets - so no seeding and no
   backup restore occurred. The device was in active use during verification (the API
   log shows te-starter course fetches and 401 lesson-completions from the phone
   at 17:26-17:27) - the Unit 2 unlocked observation came from live use on the
   device, not from seeded state. adb shell pm clear com.speeko.app resets the app to
   a fresh guest: cold start shows the learn screen within ~2 seconds (see
   release-cold-start-learn-dump.xml). The path states seen later were reached by
   the owner navigating; there is no automatic route - checked index.tsx /
   learn.tsx.
7. **Logcat PID attribution.** com.speeko.app PIDs across this session: 12520
   (debug build, 17:11), 17213, 19097, 19328 (release builds). None logged fatal or
   hermes errors. The E fatal : runForegroundReporters entries come from PID 29827,
   which ps -A (run AFTER the events, around 17:44) identifies as com.instagram.android -
   probable, not proven: Android reuses PIDs, so the mapping is an observation taken
   after the fact, not a controlled attribution. PID 15035 exited before it could be
   mapped; it is not com.speeko.app; the mapping for that one was not checked.
8. **Known harmless warning.** `ReactNativeJNI: Component property map contains
   multiple entries for 'borderColor'/'borderStyle'` appears on every launch; it is a
   React Native prop-map duplicate (RN internal), not an app defect; no action taken;
   track it if RN is upgraded.
9. **Functional QA is NOT done** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â sign-up/sign-in, completing a lesson, sync, shop,
   habits, sign-out: all pending (M2). This run verified render only.

The earlier "unexecuted" list is superseded by this section. The APK hash above is the
one built for device verification; the byte-reproducibility evidence below refers to
`150DE370ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦`, the pre-manifest-fix build.

### Device steps (COMPLETED 2026-11-17 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â kept for reference)

The steps below were executed as written (plus the uninstall and the network
security config noted above). The output lives in the files named, not in prose.

1. Reconnect the Vivo V2336 with USB debugging authorized.
2. `adb reverse tcp:3001 tcp:3001` and start the API on 3001 (or point `app.json extra` at a reachable host).
3. `adb install -r apps/mobile/android/app/build/outputs/apk/release/app-release.apk`
4. `adb shell am force-stop com.speeko.app && adb shell am start -n com.speeko.app/.MainActivity`
5. Capture the screen with a **binary-safe** command ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â never
   `adb exec-out screencap -p > file.png` in PowerShell (it transcodes the PNG
   to UTF-16LE; all four captures of 2026-11-17 were corrupt and are rejected,
   see `docs/qa/rejected-captures/`):

   ```
   adb shell screencap -p /sdcard/release-first-screen.png
   adb pull /sdcard/release-first-screen.png docs/qa/mobile/release-first-screen.png
   ```

   Confirm the pulled file is a real PNG before accepting it:
   `xxd -l 8 docs/qa/mobile/release-first-screen.png` must start with
   `89 50 4E 47`. If it doesn't, it is corrupt ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â do not commit it.

   6. Capture the text hierarchy of the same screen (the only text-comparable
   render evidence; lets a reviewer diff release against debug):

   ```
   adb shell uiautomator dump /sdcard/release-dump.xml
   adb pull /sdcard/release-dump.xml docs/qa/mobile/release-ui-dump.xml
   ```

7. Capture filtered logs with `cmd` (raw bytes ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â PowerShell's `>` writes
   UTF-16, the same failure that corrupted the screenshots):

   ```
   cmd /c "adb logcat -d | findstr /i \"hermes fatal ReactNative AndroidRuntime\" > docs\qa\mobile\logcat.txt"
   ```

8. Flip `docs/NEXT.md` and `docs/PROGRESS.md` to "PASS (release APK)" with the evidence.

### Clean-clone install check (2026-11-17)

Purpose: confirm the committed lockfile is complete (an earlier `pnpm add
expo-linking` had silently pruned `@react-native-async-storage` from
`node_modules` even though the lockfile referenced it).

Procedure: `git clone --branch next/M1 --single-branch <local repo> <tmp>` (clone of
the pushed commit `ea95aee`), then in the clone: `pnpm install --frozen-lockfile`.

Result: `Done in 1m 5.6s` ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â 1316 packages linked/added, **exit 0**, lockfile
unchanged. The committed dependency set is installable from scratch. The clone
directory was removed after the check.
