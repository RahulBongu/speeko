# Rejected device-capture artifacts (2026-11-17)

All four files in this directory are **corrupt and are not valid PNG images**.
They must not be cited as evidence of any screen.

## What happened

Captures were taken with PowerShell redirection, e.g.
`adb exec-out screencap -p > docs/qa/mobile-first-screen-success.png`.
`adb exec-out` writes raw bytes to stdout; PowerShell's `>` decodes stdout as
text and re-encodes it, transcoding the PNG to UTF-16LE (every byte pair gains
a `00` lead/interleave; the file starts with the `FF FE` BOM). Image libraries
reject the result (GDI+: "Out of memory" on load).

## Provenance of each file

| File | Bytes | Captured during |
| --- | --- | --- |
| `mobile-first-screen-error.png` | 391,386 | The Hermes `_interopRequireDefault is not a function` failure state (red box). |
| `mobile-first-screen.png` | 31,172 | First post-fix attempt; the notification shade held focus; UI dump showed no app text. |
| `mobile-first-screen-after-fix.png` | 826,930 | Same session whose UI dump showed `Cannot find native module 'ExpoLinking'` (red box with DISMISS/RELOAD). Not the app. |
| `mobile-first-screen-success.png` | 139,584 | The session whose uiautomator dump showed the learn screen (see `docs/qa/mobile/learn-screen-ui-dump.xml`). The image itself is corrupt, so it is rejected as evidence. |

**None of these files shows the app.** They are retained only so the capture
history is not silently rewritten.

## Correct capture procedure (binary-safe)

On the device shell, then pull the file — never `adb exec-out ... > file` in
PowerShell:

```
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png .
# or on cmd.exe (not PowerShell):
cmd /c "adb exec-out screencap -p > screen.png"
```

The uiautomator dumps pulled with `adb pull` (e.g.
`docs/qa/mobile/learn-screen-ui-dump.xml`) are intact and are the only
device-render evidence from 2026-11-17.
