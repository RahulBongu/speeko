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
          600: '#269020',
          700: '#1f741d',
          800: '#1b5c1c',
          900: '#174c1a',
        },
        gold: {
          100: '#fff9e0',
          200: '#ffe9a8',
          700: '#a06b00',
        },
        ice: {
          100: '#e8f4ff',
          200: '#d9edff',
          300: '#9ccdf4',
          400: '#8fc8f2',
          600: '#3b82b8',
          700: '#2f74a8',
        },
        fox: {
          100: '#fff1e8',
          200: '#ffd9c2',
          300: '#ffc59b',
          400: '#ffa567',
          500: '#ff8a3d',
          600: '#ef6a1c',
          700: '#c84e12',
        },
        cream: {
          50: '#fffaf2',
          100: '#fff4e4',
          200: '#f9e7d1',
          300: '#f0d7ba',
        },
        bark: {
          300: '#b49a86',
          400: '#8f735f',
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
      },
    },
  },
  plugins: [],
};

export default config;
