# Changelog

## Unreleased (0.1.0-alpha cut)

### Trust & integrity
- One-time completion rewards per lesson (XP + gems), replay-safe; practice never mints XP
- Append-only gem and quest ledgers; shop purchases transactional; concurrent double-spend rejected
- Zero-XP reward backfill filtered; reward migration smoke-tested on fresh and populated databases
- API rate limiting (`/api/auth/*` per IP, `PUT /api/progress` per account) with 429 + Retry-After
- `Cache-Control: no-store` on all `/api/*`; boot refuses to start in production without a 32+ character `BETTER_AUTH_SECRET`
- Build-output secrets scan (`scripts/check-secrets.mjs`) wired into `pnpm verify`

### Mobile
- Cold-start renders the learn screen (release APK, verified on device)
- Full onboarding: language → motivation → level → daily goal → first lesson (6 taps)
- All published exercise kinds supported, including word bank, arrange-the-sentence, listen-and-type, and record-yourself speaking (no automatic scoring)
- Tactile UI consistent across screens; safe-area aware layout; no dead-ends in empty/error/signed-out states

### Web
- Focus rings on all interactive elements; contrast-corrected palette; gold/ice tokens; on-brand locale ramps
- Studio re-skinned to the house style; global `not-found`/`error` routes; per-route metadata

### Honest limits
- All curriculum content remains `reviewStatus: "draft"`; no native-speaker review has been completed
- Listening exercises are unavailable until licensed audio exists
- No store listing, no public release
- Android functional QA is headless-verified; on-device pass is pending

No public release has occurred; version remains 0.0.1 pending an owner decision.
