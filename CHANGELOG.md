# Changelog

## Unreleased (alpha cut)

### 2026-11-19 — polish, romanization and content hardening

- Learning paths now climb bottom-to-top (unit 1 at the base, next unlocked unit above) with a current-lesson auto-scroll; mobile mirrors the same order
- Web landing page expanded into a long, functional marketing page: at-a-glance stats, how-it-works, mascot-voice demo buttons, ten-script greeting grid, FAQ, and direct links to practice/habits/leagues
- Romanization engine for the ten starter scripts: practical learner-facing readings, common English spellings and doubled consonants folded into grading, Dravidian vowel handling and Malayalam word-final virama support
- Starter curriculum now teaches the number Eight (all 10 starter courses; 305 → 315 exercises); Odia's fallback `Good morning` item redesigned to a reverse-direction choice; an odd filler removed earlier remains removed
- Web typing exercises accept English-keyboard spellings; "Show letters" exposes romanized readings; mobile typing and speaking surfaces show romanized helpers
- Romanization/grading regression coverage expanded (149 core tests)
- Content review documented at `docs/product/language-content-review.md`; Mural voice-conversation option rejected as a post-M1/owner-gated provider integration (`docs/product/mural-voice-assessment.md`)
- Web mascot rebuilt as an animated SVG rig with limbs, breathing, hopping and talking-state mouth; mobile remains raster-based pending a new SVG asset (assets/mixing is out of scope)

### Licensing
- Source code is Apache-2.0 (`LICENSE`, verbatim from apache.org); course content, brand, design, and docs are All Rights Reserved (`LICENSE-CONTENT`)
- Baloo 2 and Nunito now ship with their full OFL-1.1 text (`apps/web/public/fonts/OFL.txt`); third-party attribution collected in `NOTICE` and `ATTRIBUTIONS.md`
- The web artifact now ships the license texts at `/licenses/*` (auto-built by `sync-licenses.mjs`); `/licenses` exposes them and an e2e check guards the page and all four files
- The mobile app ships the same texts in an in-app `/licenses` screen, generated into `apps/mobile/assets/licenses/licenses.json` and guarded against drift by `pnpm check:licenses`

### Trust & integrity
- One-time completion rewards per lesson (XP + gems), replay-safe; practice never mints XP
- Append-only gem and quest ledgers; shop purchases transactional; concurrent double-spend rejected
- Zero-XP reward backfill filtered; reward migration smoke-tested on fresh and populated databases
- API rate limiting (`/api/auth/*` per client IP, `PUT /api/progress` per account+client IP) with 429 + Retry-After
- Proxy-aware client IPs: the web proxy forwards a secret-signed address, direct deployments trust a configured number of hops, and spoofed/missing secrets fall back to the request address instead of bypassing the limit
- `Cache-Control: no-store` on all `/api/*`; boot refuses to start in production without a 32+ character `BETTER_AUTH_SECRET`
- Build-output secrets scan (`scripts/check-secrets.mjs`) wired into `pnpm verify`

### Mobile
- Cold-start renders the learn screen (release APK, verified on device)
- Full onboarding: language -> motivation -> level -> daily goal -> first lesson (6 taps)
- All published exercise kinds supported, including word bank, arrange-the-sentence, listen-and-type, and record-yourself speaking (no automatic scoring)
- Tactile UI consistent across screens; safe-area aware layout; no dead-ends in empty/error/signed-out states
- Practice now syncs its SRS review schedule to the signed-in account after a session (best-effort, retry once; offline results stay local and sync on the next sign-in, account, or shop visit); practice never awards lesson XP or gems
- Mascot reactions: the fox now speaks original English reaction lines (Edge TTS `en-US-AvaNeural`) on correct, incorrect, lesson-complete, discovery, streak, and encouragement events, with an independent mascot-voice mute preference and an animated celebration on completion

### Web
- Focus rings on all interactive elements; contrast-corrected palette; gold/ice tokens; on-brand locale ramps
- Studio re-skinned to the house style; global `not-found`/`error` routes; per-route metadata
- Mascot reactions integrated on correct/incorrect answers and lesson completion; `apps/web/lib/mascotVoice.ts` bundles six original TTS reaction lines (`public/mascot/*.mp3`), `/mascot/*` sound-effect assets, and a separate mascot-voice preference toggle in the Sound preferences section of the Account page

### Deployment
- Free alpha stack chosen (D80): Neon Postgres + Render API + Vercel web; `render.yaml` defines the Render service with a `/health` check and uncommitted secrets
- Same-origin `/api` middleware keeps the Better Auth session cookie first-party across `*.vercel.app` and `*.onrender.com`; it also forwards the browser IP plus a shared secret so rate limits stay per client. The middleware is inert when `API_PROXY_TARGET` is unset, so local dev and e2e are unchanged
- Proxy verified locally at two levels: a mock upstream confirms a browser-supplied trust header is replaced, the secret and POST body reach the upstream, and both `Set-Cookie` headers survive; a real Chrome → Next middleware → API run confirms the host-only `SameSite=Lax` session cookie, the sign-up/sign-out lifecycle, and per-client 429 separation with forged trust headers stripped

### Performance
- League standings resolve active learners' profiles in one batch per request instead of one query per learner (with ~1.4k weekly learners in a test database, the endpoint dropped from 16-30s to under 1s locally)

### Honest limits
- All curriculum content ships `reviewStatus: "automated_reviewed"`; no native-speaker review has been completed
- Listening exercises use synthetic speech, not licensed/native-speaker audio
- No store listing, no public release
- Android functional QA was verified headlessly against web/API; no on-device functional pass has been completed

No public release has occurred; version remains 0.0.1 pending an owner decision.
