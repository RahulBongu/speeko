# Speeko UI Rescue — Baseline Audit

## Current HEAD
- Branch: `main`
- HEAD: `cf9f126e89f978fc49af63e1c4a1ac32e1a9bc9b`
- Working tree: clean at audit start.

## Route / component map (mobile)
- `app/_layout.tsx` — root layout, providers, nav shell.
- `app/index.tsx` — welcome/hero screen; uses `Fox`, `SpeekoAppBar`-like brand row, `TactileButton`.
- `app/learn.tsx` — course list + continue card; currently a bare list with `SpeekoAppBar`.
- `app/path/[courseId].tsx` — winding lesson path, unit guidebook links, progress.
- `app/lesson/[courseId]/[lessonId].tsx` — lesson player, grading, hearts, XP, save, summary.
- `app/practice.tsx` / `app/practice/[courseId].tsx` — practice hub and course practice.
- `app/habits.tsx`, `app/shop.tsx`, `app/account.tsx`, `app/leagues.tsx`, `app/people.tsx` — feature routes.
- `app/onboarding/*` — language, level, motivation, daily goal, commitment.
- `app/guidebook/[courseId]/[unitIndex].tsx`, `app/licenses.tsx`.

## Shared mobile components
- `components/Screen.tsx` — safe-area scaffold, cream background.
- `components/Tactile.tsx` — extruded tactile primitives (`TactilePressable`, `TactileButton`, `TactileCard`, `SpeekoAppBar`, `ProgressTrack`).
- `components/Fox.tsx` — vector mascot with mood, tail/ear/arm animation, blink, speaking mouth.
- `components/ExerciseBody.tsx` — exercise board; supports the kinds listed in `lib/exercise.ts`.
- `components/AppNav.tsx` — five-destination bottom nav (Learn, Practice, Habits, Shop, Account), emoji icons.
- `components/onboarding/*` — onboarding frame and option buttons.

## Web parity components
- `apps/web/components/Fox.tsx` — vector mascot with moods, accessories, speaking.
- `apps/web/components/SingingFox.tsx` — animated brand mark.
- `apps/web/components/lesson/LessonPlayer.tsx` — lesson flow and mascot events.
- `apps/web/components/lesson/AudioPrompt.tsx` — audio playback and listening events.
- `apps/web/lib/mascotVoice.ts` — speaking/listening event bus.

## Design tokens
Mobile tokens live in `apps/mobile/lib/theme.ts` (`COLORS`): cream `#FFF9E0`, creamDeep `#FDF0D5`, green `#16A34A`, greenDark `#15803D`, greenSoft `#E8F5E9`, fox `#F97316`, dark `#3F2A1D`, muted `#7A6156`, line `#E8DEC8`. The Stitch reference uses slightly warmer paper `#FFF8EE`, warm border `#E7D9C5`, muted cocoa `#8A7466`, atlas green `#147A4B`, marigold `#F59E0B`. These are close but not centralized; screens repeat magic values.

## Visual inconsistencies observed
- `Screen` uses `COLORS.cream` (`#FFF9E0`) while Stitch uses `#FFF8EE`.
- `AppNav` uses emoji icons (`📚`, `🔁`, `📅`, `🛍️`, `🦊`) and has no active indicator beyond background; the Stitch direction asks for vector icons and a compact five-item nav.
- `learn.tsx` is a bare course list with a `SpeekoAppBar` and plain text; it does not have a featured continue card, daily goal, quick actions, or course progress beyond a simple completion badge.
- `path/[courseId].tsx` is functional but visually dense; the current lesson is not strongly differentiated.
- `lesson/[courseId]/[lessonId].tsx` has a compact prompt, answer cards, and bottom action, but no mascot beside feedback and no celebration summary mascot.
- `index.tsx` welcome screen uses a large fox raster/fox vector and a simple brand row; it does not integrate the animated fox into a dashboard composition.
- `Tactile` primitives carry the old extruded game-board style (2px ink borders, offset slabs). This is intentional and tactile, but inconsistent with the softer Stitch card language.
- Web `Fox` and mobile `Fox` have related but not identical geometry (web has bindi, mobile does not; mobile uses different arm/ear rotations). Both now share `resolveFoxAnimation`.

## Reusable components to preserve
- `TactilePressable`, `TactileButton`, `TactileCard`, `ProgressTrack`, `SpeekoAppBar`, `Screen`, `Fox`, `ExerciseBody`, `AppNav`.
- Shared core grading, progress, session, SRS, mascot reaction APIs must not change.

## Commands
- Typecheck: `pnpm typecheck` (root) or `pnpm --filter @speeko/mobile typecheck`
- Unit tests: `pnpm test` (root) or `pnpm --filter @speeko/mobile test`
- Web lint: `pnpm --filter @speeko/web lint`
- Mobile lint: `pnpm --filter @speeko/mobile lint`
- Build: `pnpm build`
- Secrets: `pnpm check:secrets`
- Licenses: `pnpm check:licenses`
- E2E: `pnpm e2e`

## Notes for implementation
- Preserve all user modifications and untracked files.
- Do not commit or push during this rescue pass.
- Do not change grading, hearts, XP, unlocking, completion saving, shop ownership, or auth behavior except where a separately tested functional bug is explicitly fixed.
- Use real progress/course data; no hard-coded fake stats.
- Keep five navigation destinations reachable.
- Use the supplied fox reference for the SVG artwork, but retain independent animated SVG groups.

## Implementation summary (this pass)

### Audit findings / concrete UI problems
- `learn.tsx` was a bare course list with a green continue card; no daily-goal card, no quick actions, and no mascot in the primary CTA composition.
- `AppNav` used emoji icons and had no compact active indicator beyond a soft background.
- `path/[courseId].tsx` used emoji lock/play/check glyphs and had no fox reaction near the current node.
- `lesson/[courseId]/[lessonId].tsx` rendered its Check/Continue button inside the scrolling content, so the primary action could be clipped by the keyboard or small viewport; feedback had a raster-style icon rather than a vector state marker.
- `practice.tsx` showed four plain stat cards and a small CTA; no mascot or prominent due-review hero.
- Web header overflowed horizontally at 390px and 360px (nav pushed 41px/71px past the viewport).
- Fox scarf was Speeko green rather than the reference's teal.

### Routes / components changed
- `apps/mobile/app/learn.tsx` — real data dashboard: streak/XP app bar, featured continue card with Fox, daily-goal progress, quick actions, course list with real completion counts, five-destination `AppNav`.
- `apps/mobile/app/path/[courseId].tsx` — vector icons for lock/check/play/guidebook, Fox cheer beside the current lesson, preserved winding path/locking/auto-scroll.
- `apps/mobile/app/lesson/[courseId]/[lessonId].tsx` — fixed bottom action bar above safe area, hint text, mascot in feedback; grading/attempt/hearts/XP/save logic unchanged.
- `apps/mobile/app/practice.tsx` — due-review hero with Fox, real overview stats, empty states, course practice CTA.
- `apps/mobile/components/AppNav.tsx` — five compact vector-icon destinations.
- `apps/mobile/components/Icons.tsx` — new shared SVG icon set.
- `apps/mobile/components/ExerciseBody.tsx` — vector check/close state markers on answer options.
- `apps/mobile/components/Fox.tsx`, `apps/web/components/Fox.tsx` — scarf retinted to `#159CA6`/`#4ABFC7`/`#0E7C86`; existing mood/animation API preserved.
- `apps/web/components/AppHeader.tsx`, `apps/web/app/globals.css` — compact scrollable nav on small screens; no horizontal overflow.
- `design/reference/fox-mascot-reference.png` — supplied visual reference copied into repo.

### Fox reference translation
The supplied PNG is a flattened illustration, so it was not used as an animated image. Its colour and silhouette cues were translated into the existing SVG Fox: orange fur, cream muzzle/chest, large glossy brown eyes, pointed ears, open smile with tongue, fluffy cream-tipped tail, dark paws, and a teal scarf. Independent animated groups (head, ears, eyes/pupils, mouth, arms, tail, feet, scarf) remain, so mood events still drive real vector motion. `@speeko/core` remains the semantic source of truth via `resolveFoxAnimation` and `foxMoodForReaction`; existing tests cover the mapping and key mascot states.

### Screenshots and viewport dimensions verified
- Web app captures (real Next.js app, not Stitch): `docs/design/screenshots/` — Learn, Path, Lesson, Practice, Account at **390×844** and **360×800**, plus Learn at **1280×800**. No horizontal overflow at 390/360 after the header fix; console errors: 0.
- Mobile app web export captures (real Expo app renderer served from `apps/mobile/dist`): `docs/design/screenshots/mobile-app/` — Learn, Path, Lesson, Practice, Account at **390×844** and **360×800**. API origin was set for the static server so real course/progress data loaded; console errors: 0.
- E2E suite also regenerated `docs/qa/mobile-390x844/*` and `docs/qa/desktop-1280x800/*` real app captures.
- No physical device capture was performed.

### Commands actually run
- `pnpm --filter @speeko/mobile typecheck` — PASS
- `pnpm --filter @speeko/web typecheck` — PASS
- `pnpm --filter @speeko/mobile test` — PASS (86 tests / 17 suites)
- `pnpm --filter @speeko/web build` — PASS
- `pnpm --filter @speeko/mobile build` — PASS
- `pnpm lint` — PASS (0 errors; 1 pre-existing warning in `account.tsx`)
- `pnpm verify` — PASS (typecheck, unit tests, build, secrets, licenses, e2e 156/156)

### Known limitations / outstanding gaps (Phase 1)
- Habits, Shop, and Account were not fully re-skinned screen-by-screen at the time of the Phase 1 note.
- No physical device QA; all screenshots are from web renderers at recorded viewports.
- Voice conversation remains owner-gated and was not touched.
- Native-speaker review of content remains open.
- No commit or push was performed, per the rescue brief.

## Phase 2 — Visual polish, mascot fidelity and final QA

### Rendered-screen audit
Reviewed real app captures in `docs/design/screenshots/` and `docs/qa/` at mobile 390×844/360×800 and desktop 1280×800. Findings:
- Habits, Shop and Account still used the older flat card style and emoji accents; they now use the shared tactile cards, vector icons, Fox, hero cards, stat grids and section hierarchy.
- The mascot was a small, simplified fox with modest eyes and tail; it did not read as the supplied illustrated character. The vector artwork was rebuilt in both mobile and web.
- Web small-screen header overflow was fixed in Phase 1; rechecked after Phase 2 at 390/360 with 0 overflow.
- Lesson action bar now sits fixed above the safe area; verified in mobile captures at both viewports.

### Screens / components changed in Phase 2
- `apps/mobile/app/habits.tsx` — hero empty state with Fox, stat cards, daily-goal chips, calendar, quests and achievements in shared cards/vector icons.
- `apps/mobile/app/shop.tsx` — signed-out hero with Fox, gem balance, featured card, cosmetic and freeze sections with vector icons; ownership/purchase/equip logic unchanged.
- `apps/mobile/app/account.tsx` — profile hero, 2×2 verified/device stat grid, sectioned actions with vector icons; auth and sign-out logic unchanged.
- `apps/mobile/lib/theme.ts` — added Luminous Atlas tokens (`paper`, `sand`, `border`, `cocoa`, `atlas`, `marigold`, `coral`, `audio`).
- `apps/mobile/components/Fox.tsx` and `apps/web/components/Fox.tsx` — rebuilt SVG artwork and animation groups; same mood/reaction API preserved.
- `apps/web/tailwind.config.ts` — added one-shot cheer keyframes so celebration settles instead of looping forever.

### Fox reference fidelity
`docs/design/screenshots/fox-reference-vs-render.png` shows the supplied PNG beside the rendered mobile fox (cropped from the Learn screen). The rendered fox now has the reference's large glossy eyes with highlights, wide cream muzzle, pointed warm inner ears, fluffy cream-tipped tail, dark brown paws/feet and teal scarf with knot/tails. It is a flatter, simplified vector interpretation, not a pixel copy of the shaded illustration. Evidence: `docs/design/screenshots/fox-reference-vs-render.png`, `docs/design/screenshots/mobile-app/learn-390x844.png`, `docs/design/screenshots/learn-1280x800.png`.

### Animation verification
- Computed CSS animation names were inspected on the real web app: idle has `fox-breathe`, `wag`, `arm-sway`, `blink`; after a correct answer and voice completion the fox label becomes "delighted" with one-shot `fox-hop` and `arm-cheer`. This confirms event-driven mood changes, not just static styling.
- Mobile Reanimated groups remain independent (tail, head, ears, pupils, mouth, arms, blink) and celebration/wave are now one-shot sequences that settle to idle.
- Reduced-motion paths remain in place in both components and the global CSS rule.
- Physical device/emulator QA was not available; animation was verified in Expo web + static export web renderers and via unit tests, not on a native device.

### transform-origin warning
The Expo web warning came from `react-native-svg` 15.16.0's web `prepare.js`, which converts `originX`/`originY` props into a DOM `transform-origin` attribute. The mobile Fox used those props on `AnimatedG`. We removed them and now animate SVG `transform` strings with explicit centres (`rotate(deg cx cy)`). Verification: Expo web loaded `/learn` with 0 `transform-origin`/`Invalid DOM property` console messages; static mobile export captures show 0 page errors. Web's CSS `transformOrigin` uses valid React style properties and produces no warning.

### Final checks
- `pnpm --filter @speeko/mobile typecheck` — PASS
- `pnpm --filter @speeko/web typecheck` — PASS
- `pnpm --filter @speeko/mobile test` — PASS (86 tests / 17 suites)
- `pnpm --filter @speeko/web build` — PASS
- `pnpm --filter @speeko/mobile build` — PASS
- `pnpm lint` — PASS (0 errors; 1 pre-existing warning in web `ExerciseBody.tsx`)
- `pnpm verify` — PASS (typecheck, unit tests, build, secrets, licenses, e2e 156/156)

### Remaining gaps
- No physical device QA; no native emulator was available.
- The fox is a flat, simplified vector interpretation of the supplied shaded illustration, not a pixel-perfect copy.
- Voice conversation remains owner-gated and untouched; native-speaker content review remains open.
- All Phase 2 changes are uncommitted and unpushed, per the brief.
