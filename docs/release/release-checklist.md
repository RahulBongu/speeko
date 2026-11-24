# Speeko — Release checklist (owner actions)

**Status:** draft. Nothing has been submitted or published.

## Pre-release (engineering, already done)

- [x] `pnpm verify` green — exact current counts and exit status are recorded in `docs/design/speeko-all-phases-progress.md` (the earlier 217-unit / 154-e2e figures were from the previous phase)
- [x] Android debug + release APK and AAB were built successfully in earlier owner phases (Vivo V2336 render evidence in `docs/qa/`). A fresh static build in the current workspace is **blocked** by a stale generated Android project vs installed Expo 58 / AGP 9; see `docs/qa/native-device-checklist.md`. Do not treat the earlier artifact as proof that the current source builds natively.
- [x] License texts bundled (web `/licenses/*`, mobile in-app `/licenses`)
- [x] Proxy-aware rate limiting implemented and verified
- [x] Store listing draft (`docs/release/store-listing.md`)
- [x] Privacy data inventory (`docs/release/privacy-data-inventory.md`)
- [x] Permissions rationale (`docs/release/permissions-rationale.md`)
- [x] `docs/FINAL_COMPLETION_AUDIT.md` with artifact checksums

## Owner actions before submission

1. **Merge** any pending PRs (currently none open).
2. **Hosting** — provision Neon + Render + Vercel per `docs/deploy-runbook.md`; set `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CLIENT_ORIGINS`, `TRUST_PROXY_HOPS=1`, `API_PROXY_TARGET`, `API_PROXY_SECRET`; run backups/restore drill and secret rotation.
3. **Native-speaker review** — recruit reviewers for the 321 shipped exercises across 10 locales. Use the generated worksheet `docs/content/native-speaker-review.md` (per-lesson script, intended meaning, audio filenames, grading rules, approve/correct/reject columns). Record a dated, attributable `reviewStatus` in the source courses and re-run `pnpm sync:content` when corrections are applied. No review is recorded yet.
4. **Audio decision** — record/license the 9 `listenChoose` items, or formally ship with the exclusion (already implemented).
5. **Keystore custody** — verify or create a production signing key; do not reuse the local development keystore for public distribution.
6. **Rebuild** a clean signed AAB/APK that includes the in-app `/licenses` screen, using the production key.
7. **Android permissions** — tracked config plugin `apps/mobile/plugins/withMinimalAndroidPermissions.js` removes `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE` and `SYSTEM_ALERT_WINDOW` on every prebuild (unit-tested). Verify the final merged manifest from the signed build; see `docs/release/store-readiness-inventory.md`.
8. **Store accounts** — create Play Console / App Store Connect accounts; accept agreements; pay fees.
9. **Store listing** — finalize copy, screenshots, splash and feature graphic from the grounded inventory in `docs/release/store-readiness-inventory.md`; complete data-safety and content-rating forms from the privacy inventory.
10. **Privacy policy** — publish a privacy policy URL and reference it in the listing.
11. **Account deletion** — `DELETE /api/account` exists and now removes legacy dependent rows in one transaction; add a user-facing "Delete account" control and confirm the UX/privacy wording before launch.
12. **Device QA** — owner-run functional pass on a real device before public launch. Exact build steps, pass/fail fields and evidence requirements are in `docs/qa/native-device-checklist.md`; nothing has been run here.
13. **Submit** for review (do not publish until all above are complete).

## Do NOT do (explicitly deferred)

- Do not provision hosting or deploy (deferred by owner).
- Do not create store accounts or submit listings without owner authorization.
- Do not fabricate native-speaker approvals or audio.
- Do not reuse the local development keystore for public distribution.
