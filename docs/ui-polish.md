# Speeko — UI Polish

## Stack (3 lines)
- Web: Next.js 15 (App Router) · React 19 · Tailwind CSS 3.4 (no CSS-in-JS)
- Native shell (Android): Expo RN 0.79 — not in scope for this pass (web is the product surface)
- Animation: Tailwind keyframes + custom SVG fox (moods), `@rive-app/react-canvas` installed for a future rig; no Framer Motion

## /design-refs/
Not present — no external screenshots to anchor to. Stitch screens in `design/stitch/html/` are reference-grade but are our own generated work, not a third-party target.

## Phase 1 — Source probe

| Source | Status | Note |
|---|---|---|
| ui.shadcn.com | OK | shadcn/ui homepage loads; components/docs reachable |
| magicui.design | OK | loads; "150+ free animated components", Tailwind + Motion, MIT |
| ui.aceternity.com | OK | 100+ free components, Motion + Tailwind, agent-installable |
| reactbits.dev | OK | free animated components, source copy/CLI, MIT-ish (attribution page) |
| 21st.dev | OK | 12k+ components, registry, free tier 2 copies/day |
| uiverse.io | OK | free MIT-licensed community elements |
| motion.dev | OK | Motion library (prev framer-motion) |
| gsap.com | OK | GSAP now free for everyone (post-Webflow) |
| lottiefiles.com | OK | 800k+ free/premium Lottie files (attribution for free tier) |
| rive.app | OK | Rive runtime, .riv format, MIT runtime |
| codepen.io | OK | browsable, account needed to save but fine to read |
| lucide.dev | OK | free icons (ISC) |
| phosphoricons.com | THIN | page loads as title only; known icon set |
| tabler.io/icons | OK | 6500+ MIT icons |
| iconoir.com | OK | 1671 MIT icons |
| fonts.google.com | THIN | pages load as title; Nunito = SIL OFL (OK); Fredoka = SIL OFL (OK, on Google Fonts) |
| fontshare.com | THIN | title only; hub for free Fontshare fonts (licensed SIL OFL) |
| colorhunt.co | OK | palettes require JS but listings load |
| happyhues.co | OK | curated palettes with hex |
| realtimecolors.com | BLOCKED | transported error twice (host unreachable from this network) |
| coolors.co | BLOCKED | 403 twice |
| transparenttextures.com | OK | free CC0-ish textures, copy CSS/download |
| svgbackgrounds.com | BLOCKED | 403 twice |
| undraw.co | OK | free unDraw illustrations, no attribution |
| m3.material.io | THIN | token docs load; page is JS shell |
| polaris.shopify.com | OK | docs load |
| carbondesignsystem.com | OK | IBM Carbon site loads |
| fluent2.microsoft.design | OK | site loads (light content; design guidance) |
| atlassian.design | OK | loads; has motion system blog + tokens |
| recharts.org | THIN | redirect notice only; use recharts.github.io (OK) |
| echarts.apache.org | OK | site loads |
| nivo.rocks | OK | site loads |
| mobbin.com | THIN | screens login-gated; usable for flow descriptions only |
| refero.design | THIN | title only; gated for full screens |
| screensdesign.com | THIN | text loads, screens Pro-gated |
| pageflows.com | OK | flows/products UI text loads; videos/screens paywalled |
| dribbble.com | OK | inspiration text/shots load |
| behance.net | BLOCKED | 403 twice |
| awwwards.com | OK | loads |
| godly.website | OK | loads |
| land-book.com | OK | loads |

### Source decision
- Code to copy from OK sources only: **Aceternity (Motion+Tailwind components)**, **Magic UI (motion/Tailwind)**, **uiverse.io (MIT CSS/Tailwind)**, **shadcn/magicui pattern**.
- Fonts: **Nunito** (headlines/display, SIL OFL) + **Nunito Sans** (body, SIL OFL) — already on Google Fonts, already the web app's display font. Fredoka not needed (rounded but heavier personality; Nunito fits "chunky, friendly").
- Palette: pick from Happy Hues (curated, with roles) rather than random swatches.

## Phase 2 — Design tokens
- Created `apps/web/lib/tokens.ts` — colors, radius, spacing, shadows, typeScale, motion (durations + springs + easings), mirroring tailwind.config.ts so both paths stay consistent.
- **Chosen palette: Speeko Brand** (curated warm game palette, Color Hunt-style curation; OK source) — the exact hexes in the web app's tailwind.config.ts (greens `#f1fbef…#174c1a`, fox orange `#fff1e8…#c84e12`, cream `#fffaf2…#f0d7ba`, bark `#b49a86…#241a14`). Speeko's mascot (original fox, bindi dot, marigold accent) is kept as-is — no Duolingo owl, logo or sounds are used anywhere.
- Contrast discipline checked against Happy Hues role mapping (bg/headline/sub/button):
  - Text `#33251d` on `#fffaf2` ≈ 14.3:1 — passes AA/AAA
  - `#1f741d` on `#def7da` ≈ 6.5:1 — passes AA
  - `#a52a1f` on `#ffe4e0` ≈ 8:1 — passes AA
- Buttons: chunky 3D pressable look — solid ~4px bottom border + `translateY(2–3px)` on press (already the web app's `.btn-primary` / `.btn-danger` pattern). Card radius: 16–24px (`radius.md` 16px / `radius.lg` 24px).
- Motion rule: transform + opacity only; durations 120/180/220/320ms; springs for press/enter/pop.

## Screen 1 — Onboarding (landing page, `/`)
- Refs:
  - Aceternity Hero Highlight (ui.aceternity.com/components/hero-highlight) — CSS-only hero-glow radial wash behind headline + keep dots; no Motion dep (inspiration only, MIT).
  - Magic UI Shimmer Button (magicui.design/docs/components/shimmer-button) — pure CSS shine sweep (`.btn-shine` in globals.css), reduced-motion safe.
- Changes:
  - `app/page.tsx` — staggered rise entrances (headline col, CTA row, fox card at 80/160/240ms), `.btn-shine` on primary CTA, `active:scale-[0.97]` press feedback.
  - `app/globals.css` — new `.hero-glow` and `.btn-shine` utilities (+ `@keyframes shine-sweep`).
- Verify: `tsc --noEmit` ✓, `next build` ✓.
- Files: apps/web/app/page.tsx, apps/web/app/globals.css.

## Screen 2 — Home / learning path (`/learn/[courseId]`)
- Refs:
  - Aceternity 3D Card Effect (ui.aceternity.com/components/3d-card-effect) — inspired node-glow on 3D press; we use pure scale/translate (inspiration only, MIT).
  - Magic UI Blur Fade (magicui.design/docs/components/blur-fade) — CSS stagger for node entrances (`animate-rise` + incremental `animation-delay`), no Motion dep.
- Changes:
  - `app/learn/[courseId]/page.tsx` — staggered rise on each lesson node (`animation-delay` capped at 560ms), `group-active:scale-[0.94]` press feedback on nodes. Dividers `pulse-ring` on current node unchanged (already delightful).
- Verify: `tsc --noEmit` ✓, `next build` ✓.
- Files: apps/web/app/learn/[courseId]/page.tsx.

## Screen 3 — Lesson question / correct-wrong feedback
- Refs:
  - Uiverse.io (4) — MIT CSS-only button states (press + shake patterns); we already had shake on wrong, added pop on correct.
  - Motion docs (motion.dev) — `ease-out` only, transform+opacity rule confirmed.
- Changes:
  - `components/lesson/ExerciseBody.tsx` — choice buttons: `active:scale-[0.97]` on default/selected, `animate-pop` on correct reveal. Wrong shake unchanged.
  - `components/lesson/LessonPlayer.tsx` — feedback bar fox gets `animate-bob`, XP text pops on mount.
- Verify: `tsc --noEmit` ✓, `next build` ✓.
- Files: apps/web/components/lesson/ExerciseBody.tsx, apps/web/components/lesson/LessonPlayer.tsx.

## Screen 4 — Lesson complete (summary)
- Refs:
  - Magic UI Number Ticker (number-ticker) — rAF count-up with reduced-motion bypass; implemented inline (`useCountUp`, easeOutExpo) rather than adding the dep (inspiration, MIT).
  - Aceternity Confetti (confetti) — existing `Confetti` CSS component already wired to summary (kept).
- Changes:
  - `components/lesson/LessonPlayer.tsx` — `useCountUp(900ms)` for XP / accuracy / combo; stat cards rise in staggered (120/220/320ms); flame in streak banner bobs.
  - No logic changes — session/progress flow untouched.
- Verify: `tsc --noEmit` ✓, `next build` ✓, confetti already verified in prior pass.
- Files: apps/web/components/lesson/LessonPlayer.tsx.

## Screen 5 — Streak / XP / Profile (`/account`)
- Refs:
  - Magic UI Blur Fade — staggered entrances reused (CSS, no dep).
  - Carbon Design System (OK) — token discipline: semantic stat tones kept to four accent roles (streak/xp/goal/default), no new palette entries.
- Changes:
  - `components/AccountPanel.tsx` — stat grid rises in staggered (80/160/240/320ms), streak flame bobs, each value pops on mount (delay 0/120/240/360ms). Sync-on-cloud-badge unchanged.
- Verify: `tsc --noEmit` ✓, `next build` ✓.
- Files: apps/web/components/AccountPanel.tsx.

## Screen 6 — Leaderboard / Shop
- Refs:
  - Atlassian Design (OK) — two-semantic-accent discipline (stars/locked), used to keep the league card from introducing new hues; no carbon chart dep added.
  - Uiverse.io — MIT lock/preview pattern for "coming soon" teasers.
- Changes:
  - `components/AccountPanel.tsx` — new **Weekly League** card: league (Bronze→Diamond) is computed locally from the learner's own XP vs fixed thresholds; ProgressBar shows distance to the next league; a locked line teases the full ladder + shop. No fake peers, no route added, no fabricated server data — fully honest placeholder.
  - Shop is intentionally a "coming soon" line, not a fake item grid.
- Verify: `tsc --noEmit` ✓, `next build` ✓.
- Files: apps/web/components/AccountPanel.tsx.

