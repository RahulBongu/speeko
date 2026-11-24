# Speeko — implementation notes

Companion to `docs/design/ui-rescue-audit.md` (Phase 1/2 history) and `docs/design/speeko-all-phases-progress.md` (phase status). This note explains where the shared design decisions live and how to reproduce the checks.

## Fox rig and semantic animation

- **Source of truth for mood/reaction mapping:** `packages/core/src/mascot.ts`. Both renderers consume the same `FoxMood` / `FoxAnimation` catalog and reaction resolution; do not add screen-local mood logic.
- **Web:** `apps/web/components/Fox.tsx` + CSS keyframes in `apps/web/tailwind.config.ts` and `apps/web/app/globals.css`. Idle = breathe / wag / arm sway / blink. Answer feedback uses one-shot hop and arm-cheer that settle back to idle. `prefers-reduced-motion` neutralizes continuous motion via the global CSS media query.
- **Mobile:** `apps/mobile/components/Fox.tsx` uses Reanimated shared values on independently animated SVG groups (head, ears, tail, arms, pupils, blink, mouth) with `rotate(deg cx cy)` transform strings instead of animated `originX`/`originY` (that change removed the Expo-web transform-origin warning). `AccessibilityInfo.isReduceMotionEnabled()` reduces continuous loops. Timers and loops are cleaned up on unmount.
- **Accessibility:** only a Fox with an `onTap` handler is a button. A Fox with `title` but no handler is an image; a purely decorative Fox is hidden from assistive technology (`accessible={false}`). This is covered by `apps/mobile/__tests__/fox.test.tsx`.
- **Audio:** recorded listening clips resolve by `exercise.audioUrl` to bundled MP3s in `apps/web/public/courses/audio/` and `apps/mobile/assets/audio/`. Web autoplay and manual tap share one `play()` path in `AudioPrompt.tsx`; unmount stops audio, cancels `speechSynthesis` and clears the mascot listening state. On mobile, `lib/audio.ts` and `lib/mascot.ts` store playback-status subscriptions so `stopMobileAudio()` / `stopMascotVoice()` release player + listener; lesson and practice screens call both on unmount (`apps/mobile/__tests__/audio-cleanup.test.ts`). Mascot reaction audio is separate from lesson content.
- **Native generation:** `apps/mobile/android/` is gitignored and disposable. `apps/mobile/app.json` config plugins are the source of truth: `withQaLoopbackCleartext` (QA-only localhost cleartext) and `withMinimalAndroidPermissions` (removes three unwanted permissions on every prebuild). Regenerate with `EXPO_NO_GIT_STATUS=1 npx expo prebuild --platform android --clean --no-install`, preserving backed-up signing config; see `docs/qa/native-device-checklist.md`.
- **No paid tooling:** no Rive, no external animation service, no paid stock assets.

## Theme tokens

- **Web:** `apps/web/tailwind.config.ts` — `speeko`, `gold`, `fox`, `cream`, `bark`, `ice` scales plus shadows and keyframes. Tokens verified by real axe-core runs, not estimates: `bark-300 #806b5a`, `bark-400 #7a5f4c`, `speeko-600 #217a1b`, `gold-700 #8a5d00`, `fox-700 #a33d0a`, `ice-700 #2a6b99`. Continuous amber/orange illustration colours remain decorative. Text `opacity-70`/`opacity-80` was removed from small labels because it reduced real contrast below 4.5:1.
- **Automated accessibility guard:** `tests/e2e/a11y.spec.ts` injects the already-installed `axe-core` bundle (no new dependency) and fails on serious/critical WCAG A/AA violations for 10 routes × 2 Playwright projects. Raw audit output is `docs/qa/axe-report.json`.
- **Mobile:** `apps/mobile/lib/theme.ts` — `COLORS` mirrors the web palette. Primary green is `#15803D` so white button text reaches 5.02:1; `greenSoft` is `#EFFAF0` so light text on green reaches 4.68:1; `goldInk` `#8A5D00` is the text-on-paper gold.
- Do not introduce a second theme. Add a token in these two files and use it everywhere.

## Responsive rules

- Required web widths: 320, 360, 390, 768, 1024, 1280. Verified 0 page-wide horizontal overflow on all primary routes at every width.
- `apps/web/components/AppHeader.tsx`: the header clips accidental page-wide overflow; the nav is the only intentional horizontal scroller and has internal padding so focus rings are not clipped. Nav starts left on small screens and right from `sm` upward.
- Never allow an accidental page-wide horizontal scrollbar; a discoverable scroller inside the nav is acceptable.
- Mobile respects safe areas; fixed bottom bars and primary actions must stay reachable. `apps/mobile/app.json` is portrait-oriented.
- Reduced motion: web CSS media query; mobile `AccessibilityInfo` / `useReducedMotion`.

## Re-running checks and captures

```bash
pnpm typecheck
pnpm test
pnpm lint
pnpm build
pnpm verify              # typecheck, test, build, secrets, licenses, e2e
pnpm e2e                 # requires a prior build; Playwright + installed Chrome
pnpm sync:content        # regenerate apps/web/public/courses from content/
```

Screenshots:
- Browser captures: real Next.js app at the viewports listed in `docs/design/screenshot-manifest.md`.
- Expo renderer captures: Expo static export served locally — label as **Expo web renderer**, never as native device.
- Native device captures require the steps in `docs/qa/native-device-checklist.md`. None exist in this checkout.

## Content review

`docs/content/native-speaker-review.md` is generated from `content/dist/*.json`. It is a worksheet, not a review result. Shipped courses are `automated_reviewed` (structure only); a qualified human must complete the packet before any native-speaker claim is made.
