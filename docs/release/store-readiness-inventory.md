# Speeko — store and release readiness inventory (prepared, not submitted)

Everything below was read from the current source/config. Nothing was submitted to a store, no keystore was generated or uploaded, and no legal URL or support address was invented.

## App identity (from `apps/mobile/app.json`)

| Item | Value | Status |
|---|---|---|
| Name | Speeko | Present |
| Version | 0.0.1 | Present; owner must increment version and set an Android build number before any store upload |
| Orientation | portrait | Present |
| UI style | light | Present |
| Deep-link scheme | `speeko` | Present (no verified universal/app links); example `speeko://learn/hi-starter` |
| Android package | `com.speeko.app` | Present |
| iOS bundle id | `com.speeko.app` | Present |
| New architecture | enabled | Present |
| Config plugins | `expo-router`, `expo-asset`, `./plugins/withQaLoopbackCleartext`, `expo-status-bar`, `expo-audio`, `./plugins/withMinimalAndroidPermissions` | Present |

## Icons and splash

| Asset | Path | Status |
|---|---|---|
| App icon | `apps/mobile/assets/icon.png` | Present (flat vector singing-fox mark) |
| Android adaptive foreground | `apps/mobile/assets/icon-foreground.png` | Present |
| Adaptive background color | `#16a34a` in `app.json` | Present |
| Splash image | — | **Not configured**; owner decision before store listing |
| Feature graphic / store screenshots | — | **Not present**; owner/legal action |

## Runtime permissions

Fresh Expo prebuild adds `SYSTEM_ALERT_WINDOW`, `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE`. The tracked config plugin `withMinimalAndroidPermissions` removes them; expected manifest permissions after prebuild are only:

- `android.permission.INTERNET`
- `android.permission.VIBRATE`

No `RECORD_AUDIO` permission is declared: the app plays bundled audio and uses browser speech recognition on web, not native microphone recording. Verify the final merged manifest on a real build; do not assert compliance from source alone.

## Privacy, support and account deletion

| Requirement | Current state | Owner action |
|---|---|---|
| Privacy policy URL | **Not present in app or listing** | Legal/owner supplies URL and stores it in app config/listing |
| Terms of service URL | **Not present** | Legal/owner decision |
| Support contact | **Not present** | Owner supplies real address |
| Data-safety declarations | Draft inventory in `docs/release/privacy-data-inventory.md` | Owner reviews against current platform requirements |
| Account deletion — web | `DELETE /api/account` + "Delete account" control in `apps/web/components/AccountPanel.tsx` | Verify wording and confirmation UX |
| Account deletion — mobile | **No in-app control** (endpoint exists) | Engineering/legal decision: add mobile UI with confirmation, or document launch policy |

## Grounded store-listing facts

Use only these in copy: ten Indian languages; bite-size graded lessons; original content; original fox mascot; XP, hearts, streaks and daily goals; review/practice with SRS; shop with owned cosmetics and streak freezes; free/local-first design. Do not claim native-speaker-reviewed content, working AI conversation, cloud saves without sign-in, or device-certified performance — none are true today.

## Blocked distribution gates

Store accounts, developer agreements/fees, legal review, signing-key custody, signed AAB/APK, listing assets and submission are all owner/third-party actions. This pass only prepared the inventory.
