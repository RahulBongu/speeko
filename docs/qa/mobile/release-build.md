# M1 — Release APK build evidence (2026-11-17)

## Status: APK builds without any environment variable; on-device release render NOT verified (device disconnected)

### Metro workspace-root root cause (fixed 2026-11-17 in `12c8044`)

The first release attempt failed with `Unable to resolve module ./index.ts from
C:\duo/.` Exporting `EXPO_NO_METRO_WORKSPACE_ROOT=1` in the shell made the build
pass, but that was not a fix — the same failure hit any shell or CI machine
without the export.

Root cause: `@expo/config#getMetroServerRoot` calls `resolveWorkspaceRoot()`
and misfires in this pnpm monorepo, resolving Metro's server root to the
repository root (`C:\duo`). Nothing in the Android gradle plugin reads
`EXPO_NO_METRO_WORKSPACE_ROOT` — the variable is consumed only by
`@expo/config` from the **Node process environment**, so the line in
`apps/mobile/android/gradle.properties` never reached the spawned Metro process.

Root fix: `apps/mobile/metro.config.js` now sets
`process.env.EXPO_NO_METRO_WORKSPACE_ROOT = '1'` **before** `@expo/metro-config`
is loaded, so every Metro entry point (`react-native bundle` from gradle, the
dev server, `expo export`) resolves the same deterministic server root — this
app — regardless of the caller's environment. The two lines are:

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
`EXPO_NO_METRO_WORKSPACE_ROOT` → `BUILD SUCCESSFUL in 2m 51s`;
`:app:createBundleReleaseJsAndAssets` wrote
`android\app\build\generated\assets\createBundleReleaseJsAndAssets\index.android.bundle`.

The paragraph that previously claimed the resulting APK was "byte-identical, as
expected" is **superseded** and removed — in that run `packageRelease` was
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

Result: `BUILD SUCCESSFUL in 2m 51s` — `478 actionable tasks: 18 executed, 460 up-to-date`.

Artifact:

- Path: `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`
- Size: 21993757 bytes
- SHA-256: `150DE370B66B31C09B669B6A19378D458560A19A266D05D53C14CA200F5B9B2A`
- Modification time of the current APK: 2026-11-17 16:52:19

### Byte-reproducibility check (2026-11-17, prompted by identical hashes)

Identical hashes across builds are not automatically trustworthy as
reproducibility evidence — gradle may leave an `UP-TO-DATE` task untouched.
Verified explicitly:

1. First rebuild (bundle-output deleted, APK present): log lines
   `:app:createBundleReleaseJsAndAssets` (executed),
   `:app:mergeReleaseAssets UP-TO-DATE`,
   `:app:packageRelease UP-TO-DATE` — the APK at 16:19:27 was NOT rewritten.
   The identical hash there proved only that the bundle task is deterministic,
   not that the APK was rebuilt.
2. Forced rewrite: the generated bundle assets and the APK were removed, then
   `assembleRelease` was re-run **without** `EXPO_NO_METRO_WORKSPACE_ROOT`:
   `:app:createBundleReleaseJsAndAssets` (executed),
   `:app:packageRelease` (executed) — `BUILD SUCCESSFUL in 2m 42s`.
   The new APK (mtime 16:52:19) has **the same size and the same SHA-256**
   (`150DE370…`) as the 16:19 build. Byte-for-byte reproducibility in this
   environment is confirmed, not inferred from an up-to-date no-op.

**Scope:** the APK is gitignored and is not committed; the reproducibility
claim rests on the hashes recorded in this document, not on anything a
reviewer can diff in git.

### What could not be done

The Vivo V2336 (`10BE2A1B5Q00054`) is not attached:

- `adb devices -l` → empty list
- `adb kill-server` + daemon restart → still empty
- `adb mdns services` → no wireless-debugging services found
- Windows PNP scan for V2336/vivo/BBK/ADB/MTP interfaces → none present

Therefore the following remain **unexecuted and unclaimed**:

- `adb install -r apps/mobile/android/app/build/outputs/apk/release/app-release.apk`
- Launching the release app on the phone
- `docs/qa/mobile/release-first-screen.png` — NOT captured (would be fabricated); PNG signature check not performed
- `docs/qa/mobile/release-ui-dump.xml` — NOT captured (would be fabricated); dump text comparison against debug not performed
- `docs/qa/mobile/logcat.txt` — NOT captured (would be fabricated)

The release render is only proven when those steps run with the phone attached.

### To finish on-device verification

1. Reconnect the Vivo V2336 with USB debugging authorized.
2. `adb reverse tcp:3001 tcp:3001` and start the API on 3001 (or point `app.json extra` at a reachable host).
3. `adb install -r apps/mobile/android/app/build/outputs/apk/release/app-release.apk`
4. `adb shell am force-stop com.speeko.app && adb shell am start -n com.speeko.app/.MainActivity`
5. Capture the screen with a **binary-safe** command — never
   `adb exec-out screencap -p > file.png` in PowerShell (it transcodes the PNG
   to UTF-16LE; all four captures of 2026-11-17 were corrupt and are rejected,
   see `docs/qa/rejected-captures/`):

   ```
   adb shell screencap -p /sdcard/release-first-screen.png
   adb pull /sdcard/release-first-screen.png docs/qa/mobile/release-first-screen.png
   ```

   Confirm the pulled file is a real PNG before accepting it:
   `xxd -l 8 docs/qa/mobile/release-first-screen.png` must start with
   `89 50 4E 47`. If it doesn't, it is corrupt — do not commit it.

   5b. Capture the text hierarchy of the same screen (the only text-comparable
   render evidence; lets a reviewer diff release against debug):

   ```
   adb shell uiautomator dump /sdcard/release-dump.xml
   adb pull /sdcard/release-dump.xml docs/qa/mobile/release-ui-dump.xml
   ```

6. Capture filtered logs with `cmd` (raw bytes — PowerShell's `>` writes
   UTF-16, the same failure that corrupted the screenshots):

   ```
   cmd /c "adb logcat -d | findstr /i \"hermes fatal ReactNative AndroidRuntime\" > docs\qa\mobile\logcat.txt"
   ```

7. Flip `docs/NEXT.md` and `docs/PROGRESS.md` to "PASS (release APK)" with the evidence.

### Clean-clone install check (2026-11-17)

Purpose: confirm the committed lockfile is complete (an earlier `pnpm add
expo-linking` had silently pruned `@react-native-async-storage` from
`node_modules` even though the lockfile referenced it).

Procedure: `git clone --branch next/M1 --single-branch <local repo> <tmp>` (clone of
the pushed commit `ea95aee`), then in the clone: `pnpm install --frozen-lockfile`.

Result: `Done in 1m 5.6s` — 1316 packages linked/added, **exit 0**, lockfile
unchanged. The committed dependency set is installable from scratch. The clone
directory was removed after the check.
