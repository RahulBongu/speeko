import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        speeko: {
          50: '#f1fbef',
          100: '#def7da',
          200: '#bcedb4',
          300: '#8add7f',
          400: '#58c94d',
          500: '#37b02c',
          600: '#217a1b',
          700: '#1f741d',
          800: '#1b5c1c',
          900: '#174c1a',
        },
        gold: {
          100: '#fff9e0',
          200: '#ffe9a8',
          700: '#8a5d00',
        },
        ice: {
          100: '#e8f4ff',
          200: '#d9edff',
          300: '#9ccdf4',
          400: '#8fc8f2',
          600: '#3b82b8',
          700: '#2a6b99',
        },
        fox: {
          100: '#fff1e8',
          200: '#ffd9c2',
          300: '#ffc59b',
          400: '#ffa567',
          500: '#ff8a3d',
          600: '#ef6a1c',
          700: '#a33d0a',
        },
        cream: {
          50: '#fffaf2',
          100: '#fff4e4',
          200: '#f9e7d1',
          300: '#f0d7ba',
        },
        bark: {
          // Darkened to meet WCAG AA on cream/white surfaces (axe audit).
          300: '#806b5a',
          400: '#7a5f4c',
          500: '#715845',
          600: '#5a4535',
          700: '#453328',
          800: '#33251d',
          900: '#241a14',
        },
      },
      fontFamily: {
        display: ['Baloo 2', 'Segoe UI', 'system-ui', 'sans-serif'],
        sans: ['Nunito', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 0 0 #f0d7ba',
        'card-sm': '0 2px 0 0 #f0d7ba',
        green: '0 4px 0 0 #1f741d',
        'green-sm': '0 2px 0 0 #1f741d',
        fox: '0 4px 0 0 #c84e12',
        'speeko-200': '0 3px 0 0 #bcedb4',
      },
      keyframes: {
        bob: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-7px)' },
        },
        wag: {
          '0%, 100%': { transform: 'rotate(-5deg)' },
          '50%': { transform: 'rotate(7deg)' },
        },
        pop: {
          '0%': { transform: 'scale(.92)', opacity: '0' },
          '60%': { transform: 'scale(1.03)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-7px)' },
          '40%': { transform: 'translateX(7px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
        rise: {
          '0%': { transform: 'translateY(14px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '.55' },
          '100%': { transform: 'scale(1.75)', opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-12px) rotate(3deg)' },
        },
        'confetti-fall': {
          '0%': { transform: 'translate3d(0, -12vh, 0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translate3d(var(--drift, 0px), 108vh, 0) rotate(720deg)', opacity: '.85' },
        },
        'fox-breathe': {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-2.5px) scale(1.008)' },
        },
        'fox-hop': {
          '0%, 100%': { transform: 'translateY(0) scale(1, 1)' },
          '28%': { transform: 'translateY(-14px) scale(0.985, 1.02)' },
          '55%': { transform: 'translateY(0) scale(1.02, 0.975)' },
          '72%': { transform: 'translateY(-4px) scale(1, 1)' },
        },
        'fox-dance': {
          '0%, 100%': { transform: 'translateY(0) rotate(-3deg)' },
          '25%': { transform: 'translateY(-8px) rotate(3deg)' },
          '50%': { transform: 'translateY(0) rotate(-2deg)' },
          '75%': { transform: 'translateY(-11px) rotate(4deg)' },
        },
        'fox-head-bob': {
          '0%, 100%': { transform: 'rotate(-2.5deg) translateY(0)' },
          '50%': { transform: 'rotate(2.5deg) translateY(-2px)' },
        },
        'fox-head-dance': {
          '0%, 100%': { transform: 'rotate(-5deg)' },
          '50%': { transform: 'rotate(5deg)' },
        },
        'arm-sway': {
          '0%, 100%': { transform: 'rotate(-4deg)' },
          '50%': { transform: 'rotate(4deg)' },
        },
        'arm-sway-right': {
          '0%, 100%': { transform: 'rotate(4deg)' },
          '50%': { transform: 'rotate(-4deg)' },
        },
        'arm-wave': {
          '0%, 100%': { transform: 'rotate(96deg)' },
          '50%': { transform: 'rotate(128deg)' },
        },
        'arm-wave-right': {
          '0%, 100%': { transform: 'rotate(-96deg)' },
          '50%': { transform: 'rotate(-128deg)' },
        },
        blink: {
          '0%, 91%, 100%': { transform: 'scaleY(0)' },
          '93.5%': { transform: 'scaleY(1)' },
          '96%': { transform: 'scaleY(0)' },
        },
        talk: {
          '0%, 100%': { transform: 'scaleY(1)' },
          '35%': { transform: 'scaleY(0.45)' },
          '70%': { transform: 'scaleY(1.18)' },
        },
        'toe-tap': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'toe-tap-right': {
          '0%, 60%, 100%': { transform: 'translateY(0)' },
          '80%': { transform: 'translateY(-5px)' },
        },
        sparkle: {
          '0%, 100%': { transform: 'scale(0.85)', opacity: '.55' },
          '50%': { transform: 'scale(1.08)', opacity: '1' },
        },
        'ear-flick': {
          '0%, 68%, 100%': { transform: 'rotate(0deg)' },
          '76%': { transform: 'rotate(-4deg)' },
          '84%': { transform: 'rotate(2deg)' },
        },
        'ear-flick-right': {
          '0%, 68%, 100%': { transform: 'rotate(0deg)' },
          '76%': { transform: 'rotate(4deg)' },
          '84%': { transform: 'rotate(-2deg)' },
        },
        'pupil-look': {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(1.5px)' },
        },
        'pupil-look-right': {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(-1.5px)' },
        },
        'fox-confused': {
          '0%, 100%': { transform: 'rotate(0deg) translateY(0)' },
          '30%': { transform: 'rotate(-3deg) translateY(0)' },
          '65%': { transform: 'rotate(2deg) translateY(-1px)' },
        },
        'fox-nod': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '50%': { transform: 'rotate(2deg) translateY(1px)' },
        },
        'fox-wave': {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
        'fox-cheer': {
          '0%, 100%': { transform: 'rotate(0deg) translateY(0)' },
          '40%': { transform: 'rotate(5deg) translateY(-2px)' },
          '70%': { transform: 'rotate(-3deg) translateY(0)' },
        },
        'arm-cheer': {
          '0%, 100%': { transform: 'rotate(-8deg)' },
          '40%': { transform: 'rotate(-100deg)' },
          '70%': { transform: 'rotate(-72deg)' },
        },
        'arm-cheer-right': {
          '0%, 100%': { transform: 'rotate(8deg)' },
          '40%': { transform: 'rotate(100deg)' },
          '70%': { transform: 'rotate(72deg)' },
        },
        'logo-sway': {
          '0%, 100%': { transform: 'rotate(-1.4deg) translateY(0)' },
          '50%': { transform: 'rotate(1.4deg) translateY(-0.8px)' },
        },
        'logo-note-a': {
          '0%': { transform: 'translate(0, 10px) scale(.55) rotate(-10deg)', opacity: '0' },
          '16%': { opacity: '1' },
          '68%': { opacity: '1' },
          '100%': {
            transform: 'translate(5px, -17px) scale(1) rotate(6deg)',
            opacity: '0',
          },
        },
        'logo-note-b': {
          '0%': { transform: 'translate(0, 8px) scale(.45) rotate(8deg)', opacity: '0' },
          '18%': { opacity: '1' },
          '70%': { opacity: '1' },
          '100%': {
            transform: 'translate(3px, -13px) scale(.9) rotate(-5deg)',
            opacity: '0',
          },
        },
      },
      animation: {
        bob: 'bob 3.2s ease-in-out infinite',
        wag: 'wag 1.1s ease-in-out infinite',
        pop: 'pop .38s cubic-bezier(.34,1.56,.64,1) both',
        shake: 'shake .42s ease-in-out',
        rise: 'rise .45s cubic-bezier(.22,1,.36,1) both',
        'pulse-ring': 'pulse-ring 1.5s ease-out infinite',
        float: 'float 6s ease-in-out infinite',
        'confetti-fall': 'confetti-fall 2.6s linear forwards',
        'fox-breathe': 'fox-breathe 4.2s ease-in-out infinite',
        'fox-hop': 'fox-hop .75s cubic-bezier(.34,1.56,.64,1)',
        'fox-dance': 'fox-dance 1.6s ease-in-out infinite',
        'fox-head-bob': 'fox-head-bob 2.4s ease-in-out infinite',
        'fox-head-dance': 'fox-head-dance 0.8s ease-in-out infinite',
        'arm-sway': 'arm-sway 3.6s ease-in-out infinite',
        'arm-sway-right': 'arm-sway-right 3.6s ease-in-out infinite',
        'arm-wave': 'arm-wave 0.62s ease-in-out infinite',
        'arm-wave-right': 'arm-wave-right 0.62s ease-in-out infinite',
        blink: 'blink 5.6s ease-in-out infinite',
        talk: 'talk .3s ease-in-out infinite',
        'toe-tap': 'toe-tap .8s ease-in-out infinite',
        'toe-tap-right': 'toe-tap-right .8s ease-in-out infinite',
        sparkle: 'sparkle 1.1s ease-in-out infinite',
        'ear-flick': 'ear-flick 4.2s ease-in-out infinite',
        'ear-flick-right': 'ear-flick-right 4.2s ease-in-out infinite',
        'pupil-look': 'pupil-look 2.4s ease-in-out infinite',
        'pupil-look-right': 'pupil-look-right 2.4s ease-in-out infinite',
        'fox-confused': 'fox-confused 1.1s ease-in-out',
        'fox-nod': 'fox-nod 1.4s ease-in-out',
        'fox-wave': 'fox-wave .7s ease-in-out',
        'fox-cheer': 'fox-cheer .9s ease-in-out',
        'arm-cheer': 'arm-cheer .9s ease-in-out',
        'arm-cheer-right': 'arm-cheer .9s ease-in-out',
        'logo-sway': 'logo-sway 5.6s ease-in-out infinite',
        'logo-note-a': 'logo-note-a 3.9s cubic-bezier(.22,1,.36,1) infinite',
        'logo-note-b': 'logo-note-b 4.7s cubic-bezier(.22,1,.36,1) 1.3s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
