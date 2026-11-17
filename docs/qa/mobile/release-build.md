# M1 — Release APK build evidence (2026-11-17)

## Status: APK built; on-device release render NOT verified (device disconnected)

### What was done

Command (from `C:\duo\apps\mobile\android`):

```
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-17'
$env:ANDROID_HOME = 'C:\Users\rahul\AppData\Local\Android\Sdk'
$env:NODE_ENV = 'production'
$env:EXPO_NO_METRO_WORKSPACE_ROOT = '1'
.\gradlew.bat assembleRelease
```

Result: `BUILD SUCCESSFUL in 10m 14s` — `478 actionable tasks: 149 executed, 329 up-to-date`
(first attempt of the same command, without `EXPO_NO_METRO_WORKSPACE_ROOT`, failed with
`Execution failed for task ':app:createBundleReleaseJsAndAssets'` —
`Unable to resolve module ./index.ts from C:\duo/.` — because `EXPO_NO_METRO_WORKSPACE_ROOT`
is read by `@expo/config` from the **Node process environment**;
the `EXPO_NO_METRO_WORKSPACE_ROOT=1` line in `apps/mobile/android/gradle.properties`
does not propagate to the spawned Metro process. The environment variable must be exported
when invoking `gradlew`.)

Artifact:

- Path: `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`
- Size: 21993757 bytes
- Modified: 2026-11-17 16:19
- SHA-256: `150DE370B66B31C09B669B6A19378D458560A19A266D05D53C14CA200F5B9B2A`

The APK is a build output and is **not** committed to git (gitignored with
`apps/mobile/android/`).

### What could not be done

After the build, the Vivo V2336 (`10BE2A1B5Q00054`) was no longer attached:

- `adb devices -l` → empty list
- `adb kill-server` + daemon restart → still empty
- `adb mdns services` → no wireless-debugging services found
- Windows PNP scan for V2336/vivo/BBK/ADB/MTP interfaces → none present

Therefore the following remain **unexecuted and unclaimed**:

- `adb install -r apps/mobile/android/app/build/outputs/apk/release/app-release.apk`
- Launching the release app on the phone
- `docs/qa/mobile/release-first-screen.png` — NOT captured (would be fabricated)
- `docs/qa/mobile/logcat.txt` — NOT captured (would be fabricated)

The release render is only proven when those steps run with the phone attached.

### To finish on-device verification

1. Reconnect the Vivo V2336 with USB debugging authorized.
2. `adb reverse tcp:3001 tcp:3001` and start the API on 3001 (or point `app.json extra` at a reachable host).
3. `adb install -r apps/mobile/android/app/build/outputs/apk/release/app-release.apk`
4. `adb shell am force-stop com.speeko.app && adb shell am start -n com.speeko.app/.MainActivity`
5. Capture the screen: `adb exec-out screencap -p > docs/qa/mobile/release-first-screen.png`
6. Capture filtered logs: `adb logcat -d | findstr /i "hermes fatal ReactNative"` > `docs/qa/mobile/logcat.txt`
   (PowerShell: `adb logcat -d | Select-String -Pattern 'hermes|fatal|ReactNative' -CaseInsensitive`)
7. Flip `docs/NEXT.md` and `docs/PROGRESS.md` to "PASS (release APK)" with the evidence.

### Dependency incident during this cycle (repaired)

The first `assembleRelease` attempt died in `:app:lintVitalReportRelease` with
`Could not resolve project :react-native-async-storage_async-storage ... No variants exist`.
Investigation showed the package had disappeared from `node_modules` (the preceding
`pnpm add expo-linking` had pruned a large part of the store) even though the lockfile
and `apps/mobile/package.json` still referenced it. Repaired with
`pnpm install --frozen-lockfile` (1361 virtual-store packages reconciled; the lockfile
was unchanged). Separately, `jest` resolves from the workspace-root `node_modules/.bin`
(e.g. via `pnpm --filter @speeko/mobile test`), not from `apps/mobile/node_modules/.bin`.
