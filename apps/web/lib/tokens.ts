// Speeko design tokens — single source of truth for the web app's
// polish layer. Values intentionally mirror tailwind.config.ts so
// components can choose either path.
//
// Palette: Speeko Brand (curated warm game palette, Color Hunt-style).
// Contrast discipline: Happy Hues role mapping (bg / headline / sub /
// button / secondary / tertiary) was used to sanity-check pairs; the
// Speeko hues already pass AA for body text (#33251d on #fffaf2).

export const colors = {
  // Brand green (primary CTA / progress) — Speeko Brand curated palette
  speeko: {
    50: '#f1fbef',
    100: '#def7da',
    200: '#bcedb4',
    300: '#8add7f',
    400: '#58c94d',
    500: '#37b02c',
    600: '#269020',
    700: '#1f741d',
    800: '#1b5c1c',
    900: '#174c1a',
  },
  // Fox orange (energy / XP / streak accent) — Speeko Brand
  fox: {
    100: '#fff1e8',
    200: '#ffd9c2',
    300: '#ffc59b',
    400: '#ffa567',
    500: '#ff8a3d',
    600: '#ef6a1c',
    700: '#c84e12',
  },
  // Gold (gems / XP highlights) — mirrors tailwind.config.ts
  gold: {
    100: '#fff9e0',
    200: '#ffe9a8',
    700: '#a06b00',
  },
  // Ice (streak freezes) — mirrors tailwind.config.ts
  ice: {
    100: '#e8f4ff',
    200: '#d9edff',
    300: '#9ccdf4',
    400: '#8fc8f2',
    600: '#3b82b8',
    700: '#2f74a8',
  },
  // Cream surfaces — Speeko Brand
  cream: {
    50: '#fffaf2',
    100: '#fff4e4',
    200: '#f9e7d1',
    300: '#f0d7ba',
  },
  // Bark / ink neutrals — Speeko Brand
  bark: {
    300: '#b49a86',
    400: '#8f735f',
    500: '#715845',
    600: '#5a4535',
    700: '#453328',
    800: '#33251d',
    900: '#241a14',
  },
  // Semantic (lesson feedback)
  correct: { bg: '#def7da', border: '#bcedb4', text: '#1f741d' },
  wrong: { bg: '#ffe4e0', border: '#ffb4ab', text: '#a52a1f' },
} as const;

export const radius = {
  sm: '0.75rem', // 12px
  md: '1rem', // 16px — cards & buttons
  lg: '1.5rem', // 24px — feature cards
  xl: '2rem', // 32px — hero containers
  full: '9999px',
} as const;

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
} as const;

export const shadows = {
  // Chunky 3D pressable look (solid bottom edge, not blur)
  card: '0 4px 0 0 #f0d7ba',
  cardSm: '0 2px 0 0 #f0d7ba',
  green: '0 4px 0 0 #1f741d',
  greenSm: '0 2px 0 0 #1f741d',
  fox: '0 4px 0 0 #c84e12',
  foxSm: '0 2px 0 0 #c84e12',
  none: '0 0 0 0 transparent',
} as const;

export const typeScale = {
  display: { size: '2.5rem', line: '1.05', weight: 800 },
  headline: { size: '1.5rem', line: '1.2', weight: 800 },
  title: { size: '1.125rem', line: '1.35', weight: 800 },
  body: { size: '1rem', line: '1.5', weight: 600 },
  caption: { size: '0.75rem', line: '1.4', weight: 700 },
  over: { size: '0.6875rem', line: '1.4', weight: 800 }, // uppercase overline
} as const;

export const motion = {
  duration: {
    press: 120, // ms — button press feedback
    fast: 180, // ms — chip, toggle
    base: 220, // ms — dropdown, card
    slow: 320, // ms — screen entrances
  },
  // Springs for entrance/overlay work
  spring: {
    press: { stiffness: 800, damping: 30 }, // snappy press
    enter: { stiffness: 260, damping: 20 }, // cards/toasts
    pop: { stiffness: 420, damping: 22 }, // badges / XP
  },
  // Easings
  easeOut: 'cubic-bezier(0.23, 1, 0.32, 1)',
  easeInOut: 'cubic-bezier(0.77, 0, 0.175, 1)',
  // Reduced motion is already covered globally by globals.css
} as const;

export type SpeekoColors = typeof colors;
