# Speeko — screenshot manifest

All files below are **real captures of the running application**. No Stitch mockups, composite illustrations or browser screenshots framed as native device captures are included. Platform and renderer are stated per group.

**Native device captures: NONE.** No device or emulator was attached; see `docs/qa/native-device-checklist.md`.

## Groups

### Web renderer — design screenshots

**Capture method:** Real Next.js web app in headless Chrome via Playwright (`docs/design` capture script); API origin localhost:3001. Browser capture, not native device.

| Path | Viewport | Route / state | Data scenario |
|---|---|---|---|
| `docs\design\screenshots\account-360x800.png` | 360×800 (file 360×800) | /account | guest default state |
| `docs\design\screenshots\account-390x844.png` | 390×844 (file 390×844) | /account | guest default state |
| `docs\design\screenshots\fox-reference-vs-render.png` | 1280×800 (file 640×320) | screen: fox-reference-vs-render | guest default state |
| `docs\design\screenshots\habits-360x800.png` | 360×800 (file 360×800) | /habits | guest default state |
| `docs\design\screenshots\habits-390x844.png` | 390×844 (file 390×844) | /habits | guest default state |
| `docs\design\screenshots\learn-1280x800.png` | 1280×800 (file 1280×800) | /learn | guest default state |
| `docs\design\screenshots\learn-360x800.png` | 360×800 (file 360×800) | /learn | guest default state |
| `docs\design\screenshots\learn-390x844.png` | 390×844 (file 390×844) | /learn | guest default state |
| `docs\design\screenshots\lesson-360x800.png` | 360×800 (file 360×800) | /lesson/hi-starter/hi-starter-u1-l1 | guest default state |
| `docs\design\screenshots\lesson-390x844.png` | 390×844 (file 390×844) | /lesson/hi-starter/hi-starter-u1-l1 | guest default state |
| `docs\design\screenshots\path-360x800.png` | 360×800 (file 360×800) | screen: path | guest default state |
| `docs\design\screenshots\path-390x844.png` | 390×844 (file 390×844) | screen: path | guest default state |
| `docs\design\screenshots\practice-360x800.png` | 360×800 (file 360×800) | /practice | real derived state |
| `docs\design\screenshots\practice-390x844.png` | 390×844 (file 390×844) | /practice | real derived state |
| `docs\design\screenshots\shop-360x800.png` | 360×800 (file 360×800) | /shop | guest default state |
| `docs\design\screenshots\shop-390x844.png` | 390×844 (file 390×844) | /shop | guest default state |

### Expo static web renderer — mobile-app screenshots

**Capture method:** Expo SDK 58 static web export served locally and captured in headless Chrome. This is the Expo **web** renderer, not a native device.

| Path | Viewport | Route / state | Data scenario |
|---|---|---|---|
| `docs\design\screenshots\mobile-app\account-360x800.png` | 360×800 (file 360×800) | /account | guest default state |
| `docs\design\screenshots\mobile-app\account-390x844.png` | 390×844 (file 390×844) | /account | guest default state |
| `docs\design\screenshots\mobile-app\learn-360x800.png` | 360×800 (file 360×800) | /learn | guest default state |
| `docs\design\screenshots\mobile-app\learn-390x844.png` | 390×844 (file 390×844) | /learn | guest default state |
| `docs\design\screenshots\mobile-app\lesson-360x800.png` | 360×800 (file 360×800) | /lesson/hi-starter/hi-starter-u1-l1 | guest default state |
| `docs\design\screenshots\mobile-app\lesson-390x844.png` | 390×844 (file 390×844) | /lesson/hi-starter/hi-starter-u1-l1 | guest default state |
| `docs\design\screenshots\mobile-app\path-360x800.png` | 360×800 (file 360×800) | screen: path | guest default state |
| `docs\design\screenshots\mobile-app\path-390x844.png` | 390×844 (file 390×844) | screen: path | guest default state |
| `docs\design\screenshots\mobile-app\practice-360x800.png` | 360×800 (file 360×800) | /practice | real derived state |
| `docs\design\screenshots\mobile-app\practice-390x844.png` | 390×844 (file 390×844) | /practice | real derived state |

### Responsive audit — all required web widths

**Capture method:** Real Next.js web app in headless Chrome via Playwright at the six required viewports; overflow and page-error metrics recorded in `docs/design/screenshots/responsive-audit/report.json`.

| Path | Viewport | Route / state | Data scenario |
|---|---|---|---|
| `docs\design\screenshots\responsive-audit\account-1024x768.png` | 1024×768 (file 1024×768) | /account | guest default state |
| `docs\design\screenshots\responsive-audit\account-1280x800.png` | 1280×800 (file 1280×800) | /account | guest default state |
| `docs\design\screenshots\responsive-audit\account-320x568.png` | 320×568 (file 320×568) | /account | guest default state |
| `docs\design\screenshots\responsive-audit\account-360x800.png` | 360×800 (file 360×800) | /account | guest default state |
| `docs\design\screenshots\responsive-audit\account-390x844.png` | 390×844 (file 390×844) | /account | guest default state |
| `docs\design\screenshots\responsive-audit\account-768x1024.png` | 768×1024 (file 768×1024) | /account | guest default state |
| `docs\design\screenshots\responsive-audit\course-path-1024x768.png` | 1024×768 (file 1024×768) | /learn/hi-starter | guest default state |
| `docs\design\screenshots\responsive-audit\course-path-1280x800.png` | 1280×800 (file 1280×800) | /learn/hi-starter | guest default state |
| `docs\design\screenshots\responsive-audit\course-path-320x568.png` | 320×568 (file 320×568) | /learn/hi-starter | guest default state |
| `docs\design\screenshots\responsive-audit\course-path-360x800.png` | 360×800 (file 360×800) | /learn/hi-starter | guest default state |
| `docs\design\screenshots\responsive-audit\course-path-390x844.png` | 390×844 (file 390×844) | /learn/hi-starter | guest default state |
| `docs\design\screenshots\responsive-audit\course-path-768x1024.png` | 768×1024 (file 768×1024) | /learn/hi-starter | guest default state |
| `docs\design\screenshots\responsive-audit\habits-1024x768.png` | 1024×768 (file 1024×768) | /habits | guest default state |
| `docs\design\screenshots\responsive-audit\habits-1280x800.png` | 1280×800 (file 1280×800) | /habits | guest default state |
| `docs\design\screenshots\responsive-audit\habits-320x568.png` | 320×568 (file 320×568) | /habits | guest default state |
| `docs\design\screenshots\responsive-audit\habits-360x800.png` | 360×800 (file 360×800) | /habits | guest default state |
| `docs\design\screenshots\responsive-audit\habits-390x844.png` | 390×844 (file 390×844) | /habits | guest default state |
| `docs\design\screenshots\responsive-audit\habits-768x1024.png` | 768×1024 (file 768×1024) | /habits | guest default state |
| `docs\design\screenshots\responsive-audit\home-1024x768.png` | 1024×768 (file 1024×768) | / | guest default state |
| `docs\design\screenshots\responsive-audit\home-1280x800.png` | 1280×800 (file 1280×800) | / | guest default state |
| `docs\design\screenshots\responsive-audit\home-320x568.png` | 320×568 (file 320×568) | / | guest default state |
| `docs\design\screenshots\responsive-audit\home-360x800.png` | 360×800 (file 360×800) | / | guest default state |
| `docs\design\screenshots\responsive-audit\home-390x844.png` | 390×844 (file 390×844) | / | guest default state |
| `docs\design\screenshots\responsive-audit\home-768x1024.png` | 768×1024 (file 768×1024) | / | guest default state |
| `docs\design\screenshots\responsive-audit\learn-1024x768.png` | 1024×768 (file 1024×768) | /learn | guest default state |
| `docs\design\screenshots\responsive-audit\learn-1280x800.png` | 1280×800 (file 1280×800) | /learn | guest default state |
| `docs\design\screenshots\responsive-audit\learn-320x568.png` | 320×568 (file 320×568) | /learn | guest default state |
| `docs\design\screenshots\responsive-audit\learn-360x800.png` | 360×800 (file 360×800) | /learn | guest default state |
| `docs\design\screenshots\responsive-audit\learn-390x844.png` | 390×844 (file 390×844) | /learn | guest default state |
| `docs\design\screenshots\responsive-audit\learn-768x1024.png` | 768×1024 (file 768×1024) | /learn | guest default state |
| `docs\design\screenshots\responsive-audit\lesson-1024x768.png` | 1024×768 (file 1024×768) | /lesson/hi-starter/hi-starter-u1-l1 | guest default state |
| `docs\design\screenshots\responsive-audit\lesson-1280x800.png` | 1280×800 (file 1280×800) | /lesson/hi-starter/hi-starter-u1-l1 | guest default state |
| `docs\design\screenshots\responsive-audit\lesson-320x568.png` | 320×568 (file 320×568) | /lesson/hi-starter/hi-starter-u1-l1 | guest default state |
| `docs\design\screenshots\responsive-audit\lesson-360x800.png` | 360×800 (file 360×800) | /lesson/hi-starter/hi-starter-u1-l1 | guest default state |
| `docs\design\screenshots\responsive-audit\lesson-390x844.png` | 390×844 (file 390×844) | /lesson/hi-starter/hi-starter-u1-l1 | guest default state |
| `docs\design\screenshots\responsive-audit\lesson-768x1024.png` | 768×1024 (file 768×1024) | /lesson/hi-starter/hi-starter-u1-l1 | guest default state |
| `docs\design\screenshots\responsive-audit\practice-1024x768.png` | 1024×768 (file 1024×768) | /practice | real derived state |
| `docs\design\screenshots\responsive-audit\practice-1280x800.png` | 1280×800 (file 1280×800) | /practice | real derived state |
| `docs\design\screenshots\responsive-audit\practice-320x568.png` | 320×568 (file 320×568) | /practice | real derived state |
| `docs\design\screenshots\responsive-audit\practice-360x800.png` | 360×800 (file 360×800) | /practice | real derived state |
| `docs\design\screenshots\responsive-audit\practice-390x844.png` | 390×844 (file 390×844) | /practice | real derived state |
| `docs\design\screenshots\responsive-audit\practice-768x1024.png` | 768×1024 (file 768×1024) | /practice | real derived state |
| `docs\design\screenshots\responsive-audit\shop-1024x768.png` | 1024×768 (file 1024×768) | /shop | guest default state |
| `docs\design\screenshots\responsive-audit\shop-1280x800.png` | 1280×800 (file 1280×800) | /shop | guest default state |
| `docs\design\screenshots\responsive-audit\shop-320x568.png` | 320×568 (file 320×568) | /shop | guest default state |
| `docs\design\screenshots\responsive-audit\shop-360x800.png` | 360×800 (file 360×800) | /shop | guest default state |
| `docs\design\screenshots\responsive-audit\shop-390x844.png` | 390×844 (file 390×844) | /shop | guest default state |
| `docs\design\screenshots\responsive-audit\shop-768x1024.png` | 768×1024 (file 768×1024) | /shop | guest default state |

### E2E QA — mobile viewport

**Capture method:** Playwright `mobile-390x844` project against the real web app/API; captured by E2E specs with animations disabled.

| Path | Viewport | Route / state | Data scenario |
|---|---|---|---|
| `docs\qa\mobile-390x844\account.png` | 390×844 (file 390×844) | /account | guest default state |
| `docs\qa\mobile-390x844\conversation.png` | 390×844 (file 390×844) | /conversation (owner-gated status) | guest default state |
| `docs\qa\mobile-390x844\course-hi-starter.png` | 390×844 (file 390×844) | /learn/hi-starter | guest default state |
| `docs\qa\mobile-390x844\guidebook-hi-starter-unit-1.png` | 390×844 (file 390×844) | /learn/hi-starter/guidebook/1 | guest default state |
| `docs\qa\mobile-390x844\habits-goal.png` | 390×844 (file 390×844) | /habits (goal picker) | real derived state |
| `docs\qa\mobile-390x844\habits-guest.png` | 390×844 (file 390×844) | /habits (guest) | guest/device-local data |
| `docs\qa\mobile-390x844\habits-signed-in.png` | 390×844 (file 390×844) | /habits (signed in) | signed-in test account |
| `docs\qa\mobile-390x844\habits.png` | 390×844 (file 390×844) | /habits | guest default state |
| `docs\qa\mobile-390x844\home.png` | 390×844 (file 390×844) | / | guest default state |
| `docs\qa\mobile-390x844\leagues.png` | 390×844 (file 390×844) | screen: leagues | guest default state |
| `docs\qa\mobile-390x844\learn.png` | 390×844 (file 390×844) | /learn | guest default state |
| `docs\qa\mobile-390x844\lesson-complete-error.png` | 390×844 (file 390×844) | /lesson (completion save error / Retry) | forced/real save failure |
| `docs\qa\mobile-390x844\lesson-complete-practice.png` | 390×844 (file 390×844) | /lesson (completion, practice-only replay) | real derived state |
| `docs\qa\mobile-390x844\lesson-complete-signed-in.png` | 390×844 (file 390×844) | /lesson (completion, signed in) | signed-in test account |
| `docs\qa\mobile-390x844\lesson-feedback.png` | 390×844 (file 390×844) | /lesson (feedback state) | real derived state |
| `docs\qa\mobile-390x844\lesson-hi-starter-u1-l1.png` | 390×844 (file 390×844) | /lesson/hi-starter/hi-starter-u1-l1 | guest default state |
| `docs\qa\mobile-390x844\onboarding-first-lesson.png` | 390×844 (file 390×844) | /onboarding → first lesson | guest default state |
| `docs\qa\mobile-390x844\onboarding-language.png` | 390×844 (file 390×844) | /onboarding/language | guest default state |
| `docs\qa\mobile-390x844\people.png` | 390×844 (file 390×844) | screen: people | guest default state |
| `docs\qa\mobile-390x844\practice-hub.png` | 390×844 (file 390×844) | /practice | real derived state |
| `docs\qa\mobile-390x844\practice-trouble-complete.png` | 390×844 (file 390×844) | /practice (trouble review complete) | real derived state |
| `docs\qa\mobile-390x844\practice-unit-complete.png` | 390×844 (file 390×844) | /practice (unit practice complete) | real derived state |
| `docs\qa\mobile-390x844\practice.png` | 390×844 (file 390×844) | /practice | real derived state |
| `docs\qa\mobile-390x844\shop.png` | 390×844 (file 390×844) | /shop | guest default state |
| `docs\qa\mobile-390x844\sign-in.png` | 390×844 (file 390×844) | screen: sign-in | guest default state |
| `docs\qa\mobile-390x844\sign-up.png` | 390×844 (file 390×844) | screen: sign-up | guest default state |
| `docs\qa\mobile-390x844\stories.png` | 390×844 (file 390×844) | screen: stories | guest default state |
| `docs\qa\mobile-390x844\studio-hi-starter.png` | 390×844 (file 390×844) | screen: studio-hi-starter | guest default state |
| `docs\qa\mobile-390x844\studio.png` | 390×844 (file 390×844) | screen: studio | guest default state |

### E2E QA — desktop viewport

**Capture method:** Playwright `desktop-1280x800` project against the real web app/API; captured by E2E specs with animations disabled.

| Path | Viewport | Route / state | Data scenario |
|---|---|---|---|
| `docs\qa\desktop-1280x800\account.png` | 1280×800 (file 1280×800) | /account | guest default state |
| `docs\qa\desktop-1280x800\conversation.png` | 1280×800 (file 1280×800) | /conversation (owner-gated status) | guest default state |
| `docs\qa\desktop-1280x800\course-hi-starter.png` | 1280×800 (file 1280×800) | /learn/hi-starter | guest default state |
| `docs\qa\desktop-1280x800\guidebook-hi-starter-unit-1.png` | 1280×800 (file 1280×800) | /learn/hi-starter/guidebook/1 | guest default state |
| `docs\qa\desktop-1280x800\habits-goal.png` | 1280×800 (file 1280×800) | /habits (goal picker) | real derived state |
| `docs\qa\desktop-1280x800\habits-guest.png` | 1280×800 (file 1280×800) | /habits (guest) | guest/device-local data |
| `docs\qa\desktop-1280x800\habits-signed-in.png` | 1280×800 (file 1280×800) | /habits (signed in) | signed-in test account |
| `docs\qa\desktop-1280x800\habits.png` | 1280×800 (file 1280×800) | /habits | guest default state |
| `docs\qa\desktop-1280x800\home.png` | 1280×800 (file 1280×800) | / | guest default state |
| `docs\qa\desktop-1280x800\leagues.png` | 1280×800 (file 1280×800) | screen: leagues | guest default state |
| `docs\qa\desktop-1280x800\learn.png` | 1280×800 (file 1280×800) | /learn | guest default state |
| `docs\qa\desktop-1280x800\lesson-complete-error.png` | 1280×800 (file 1280×800) | /lesson (completion save error / Retry) | forced/real save failure |
| `docs\qa\desktop-1280x800\lesson-complete-practice.png` | 1280×800 (file 1280×800) | /lesson (completion, practice-only replay) | real derived state |
| `docs\qa\desktop-1280x800\lesson-complete-signed-in.png` | 1280×800 (file 1280×800) | /lesson (completion, signed in) | signed-in test account |
| `docs\qa\desktop-1280x800\lesson-feedback.png` | 1280×800 (file 1280×800) | /lesson (feedback state) | real derived state |
| `docs\qa\desktop-1280x800\lesson-hi-starter-u1-l1.png` | 1280×800 (file 1280×800) | /lesson/hi-starter/hi-starter-u1-l1 | guest default state |
| `docs\qa\desktop-1280x800\onboarding-first-lesson.png` | 1280×800 (file 1280×800) | /onboarding → first lesson | guest default state |
| `docs\qa\desktop-1280x800\onboarding-language.png` | 1280×800 (file 1280×800) | /onboarding/language | guest default state |
| `docs\qa\desktop-1280x800\people.png` | 1280×800 (file 1280×800) | screen: people | guest default state |
| `docs\qa\desktop-1280x800\practice-hub.png` | 1280×800 (file 1280×800) | /practice | real derived state |
| `docs\qa\desktop-1280x800\practice-trouble-complete.png` | 1280×800 (file 1280×800) | /practice (trouble review complete) | real derived state |
| `docs\qa\desktop-1280x800\practice-unit-complete.png` | 1280×800 (file 1280×800) | /practice (unit practice complete) | real derived state |
| `docs\qa\desktop-1280x800\practice.png` | 1280×800 (file 1280×800) | /practice | real derived state |
| `docs\qa\desktop-1280x800\shop.png` | 1280×800 (file 1280×800) | /shop | guest default state |
| `docs\qa\desktop-1280x800\sign-in.png` | 1280×800 (file 1280×800) | screen: sign-in | guest default state |
| `docs\qa\desktop-1280x800\sign-up.png` | 1280×800 (file 1280×800) | screen: sign-up | guest default state |
| `docs\qa\desktop-1280x800\stories.png` | 1280×800 (file 1280×800) | screen: stories | guest default state |
| `docs\qa\desktop-1280x800\studio-hi-starter.png` | 1280×800 (file 1280×800) | screen: studio-hi-starter | guest default state |
| `docs\qa\desktop-1280x800\studio.png` | 1280×800 (file 1280×800) | screen: studio | guest default state |

## Comparison artifact

| Path | Purpose |
|---|---|
| `docs/design/screenshots/fox-reference-vs-render.png` (640×320) | Supplied fox reference beside the rendered vector mascot; visual comparison only, not a native capture. |

## Notes

- "Data scenario" is inferred from capture filename and the originating E2E spec; it is not a claim about a specific persisted account.
- `docs/design/screenshots/report.json` records console-error arrays for the design captures; all are empty.
- `docs/design/screenshots/responsive-audit/report.json` records per-viewport overflow/accessibility metrics from the final responsive pass.
- All captures are 8-bit PNG; dimensions are recorded in the Viewport column and verified against file metadata.
- `docs/qa/axe-report.json` records zero serious/critical WCAG A/AA violations across 10 routes × 2 viewports; the guard is `tests/e2e/a11y.spec.ts`.

## Regenerating evidence

- Browser captures and responsive audit: run the real web app and API (`pnpm dev` or `pnpm build && pnpm --filter @speeko/web start` plus `node apps/api/dist/index.js`), then capture with Playwright at the listed viewports against `http://localhost:3000`. Keep `report.json` alongside the images.
- E2E QA screenshots are produced by `pnpm e2e` (Playwright projects `mobile-390x844` and `desktop-1280x800`).
- Expo-web captures: `pnpm --filter @speeko/mobile build`, serve `apps/mobile/dist`, and label every image as **Expo web renderer**.
- Native captures require the steps in `docs/qa/native-device-checklist.md`; none exist yet. Never relabel a browser or Expo-web image as a device capture.
