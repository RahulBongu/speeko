# Speeko — Release checklist (owner actions)

**Status:** draft. Nothing has been submitted or published.

## Pre-release (engineering, already done)

- [x] `pnpm verify` green (typecheck 6/6, 217 unit, build 5/5, secrets 0/160, licenses PASS, 154 e2e)
- [x] Android debug + release APK and AAB build successfully
- [x] License texts bundled (web `/licenses/*`, mobile in-app `/licenses`)
- [x] Proxy-aware rate limiting implemented and verified
- [x] Store listing draft (`docs/release/store-listing.md`)
- [x] Privacy data inventory (`docs/release/privacy-data-inventory.md`)
- [x] Permissions rationale (`docs/release/permissions-rationale.md`)
- [x] `docs/FINAL_COMPLETION_AUDIT.md` with artifact checksums

## Owner actions before submission

1. **Merge** any pending PRs (currently none open).
2. **Hosting** — provision Neon + Render + Vercel per `docs/deploy-runbook.md`; set `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CLIENT_ORIGINS`, `TRUST_PROXY_HOPS=1`, `API_PROXY_TARGET`, `API_PROXY_SECRET`; run backups/restore drill and secret rotation.
3. **Native-speaker review** — recruit reviewers for 315 items × 10 locales; use `scripts/export-review.mjs` and `review/REVIEWER_ONBOARDING.md`; track in `review/REVIEW_TRACKER.md`; validate returns with `scripts/import-review.mjs`.
4. **Audio decision** — record/license the 9 `listenChoose` items, or formally ship with the exclusion (already implemented).
5. **Keystore custody** — verify or create a production signing key; do not reuse the local development keystore for public distribution.
6. **Rebuild** a clean signed AAB/APK that includes the in-app `/licenses` screen, using the production key.
7. **Remove unnecessary Android permissions** (`READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `SYSTEM_ALERT_WINDOW`) per `docs/release/permissions-rationale.md`.
8. **Store accounts** — create Play Console / App Store Connect accounts; accept agreements; pay fees.
9. **Store listing** — finalize copy, screenshots, icon, feature graphic; complete data-safety and content-rating forms from the privacy inventory.
10. **Privacy policy** — publish a privacy policy URL and reference it in the listing.
11. **Account deletion** — decide whether to add self-service deletion before launch (recommended).
12. **Device QA** — owner-run functional pass on a real device before public launch.
13. **Submit** for review (do not publish until all above are complete).

## Do NOT do (explicitly deferred)

- Do not provision hosting or deploy (deferred by owner).
- Do not create store accounts or submit listings without owner authorization.
- Do not fabricate native-speaker approvals or audio.
- Do not reuse the local development keystore for public distribution.
