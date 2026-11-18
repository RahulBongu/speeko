# Speeko — Privacy and data inventory (draft)

**Status:** draft for owner review. No privacy policy has been published and no data-safety form has been submitted.

## Data collected

| Data | Source | Stored where | Purpose | Shared? |
|---|---|---|---|---|
| Email address | Sign-up | API database (Better Auth) | Account identity and sign-in | No |
| Password (hashed) | Sign-up | API database (Better Auth, scrypt-family) | Authentication | No |
| Display name | Sign-up | API database | Profile display | Shown on public profile if the user has one |
| Session cookie | Sign-in | Browser/device (httpOnly, SameSite=Lax, host-only) | Session | No |
| Progress snapshot | Client | API database (`progress_snapshots`) | Sync completed lessons, XP, SRS, preferences across devices | Shown in aggregated/derived form on public profile |
| Lesson events | Server | API database (`lesson_events`) | Streaks, habit history, reward audit | Derived stats only on public profile |
| Reward ledger (XP, gems) | Server | API database (`lesson_completion_rewards`, `gem_ledger`) | Authoritative rewards and shop balance | Derived stats only on public profile |
| Shop purchases / inventory | Server | API database | Ownership and equipment | No |
| Habits / daily goals | Client + server | API database (via progress snapshot and lesson events) | Streaks and goals | No |
| Cosmetic equipment | Client + server | API database | Sync equipped item | No |
| Time zone | Client | API database (progress snapshot) | Day boundaries for streaks | No |

## Data NOT collected

- No analytics SDK is integrated (no PostHog, Mixpanel, Firebase Analytics, Sentry, or similar).
- No advertising identifiers.
- No location data.
- No microphone audio is uploaded (the `speak` exercise is self-reported; no transcript is sent unless the platform provides one, and the API's AI conversation endpoint is unavailable in this build).
- No contacts, photos, or files beyond the app's own storage.
- No third-party tracking.

## Third-party services (when hosted)

- **Neon (Postgres)** — stores all account and progress data. (Deferred: not provisioned yet.)
- **Render** — runs the API. (Deferred.)
- **Vercel** — serves the web app and proxies `/api/*`. (Deferred.)
- **Better Auth** — authentication library (in-process, not a separate service).

No other external services are used. The AI conversation feature is disabled in this build (`AI_API_KEY`/`AI_API_URL` unset).

## Permissions (Android)

Requested in `apps/mobile/android/app/src/main/AndroidManifest.xml`:

- `INTERNET` — required (API calls).
- `VIBRATE` — haptic feedback on interactions.
- `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `SYSTEM_ALERT_WINDOW` — appear to be dev-client artifacts from the Expo template; **review and remove before release** (they are not needed by the app's functionality).

## Data retention and deletion

- Account data persists until the user requests deletion. No self-service deletion endpoint exists yet; deletion is an owner-handled request.
- Guest progress is stored only on the device and is cleared on sign-out.
- Session cookies expire after 30 days.

## Owner actions before submission

- Confirm the final data-safety form answers against this inventory.
- Decide whether to add self-service account deletion (recommended before public launch).
- Remove the unnecessary Android permissions noted above.
- Publish a privacy policy URL and reference it in the store listing.
- Confirm no additional data is collected if analytics are added later (would require updating this inventory and the store form).
