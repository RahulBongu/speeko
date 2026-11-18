# Speeko — Permissions rationale (draft)

**Status:** draft for owner review before store submission.

## Android permissions

| Permission | Needed? | Rationale |
|---|---|---|
| `INTERNET` | Yes | All API calls (auth, progress, shop, social, courses). |
| `VIBRATE` | Yes | Haptic feedback on button presses and correct/incorrect answers. |
| `READ_EXTERNAL_STORAGE` | No | Not used by app functionality. Likely a dev-client artifact. Remove before release. |
| `WRITE_EXTERNAL_STORAGE` | No | Not used by app functionality. Likely a dev-client artifact. Remove before release. |
| `SYSTEM_ALERT_WINDOW` | No | Not used by app functionality. Likely a dev-client artifact. Remove before release. |

## Recommended change before release

Remove the three unnecessary permissions from the release manifest. The cleanest path is to set `expo.android.permissions` in `app.json` to an explicit allow-list (`["INTERNET", "VIBRATE"]`) and regenerate the Android project, then rebuild and re-verify. This has not been done yet to avoid an untested build change; it is a pre-submission task.

## Web

No special permissions are requested by the web app. Camera/microphone access is not used (the `speak` exercise is self-reported and does not record audio).

## iOS (future)

Not currently configured. If an iOS build is added, review the equivalent permission declarations and the `NSMicrophoneUsageDescription` (not needed unless recording is implemented).
