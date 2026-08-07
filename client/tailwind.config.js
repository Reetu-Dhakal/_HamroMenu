/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f7f5f3',
          100: '#ebe7e2',
          200: '#d8d0c8',
          300: '#bfb2a6',
          400: '#a08d7d',
          500: '#8c7663',
          600: '#7b6253',
          700: '#665045',
          800: '#55433b',
          900: '#342a25',
          950: '#1c1815',
        },
        cream: '#FAF6F0',
        surface: '#FFFDF9',
        clay: {
          50: '#fdf3ee',
          100: '#fbe3d7',
          200: '#f6c4ad',
          300: '#f09e79',
          400: '#e97645',
          500: '#e05520',
          600: '#d24317',
          700: '#b03a16',
          800: '#8c2f17',
          900: '#712a16',
        },
        gold: {
          400: '#e6b15c',
          500: '#d99e3d',
          600: '#b97f28',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 8px -2px rgba(28, 24, 21, 0.08), 0 12px 32px -12px rgba(28, 24, 21, 0.16)',
        lift: '0 8px 30px -8px rgba(28, 24, 21, 0.22)',
        glow: '0 0 0 1px rgba(224, 85, 32, 0.18), 0 8px 24px -6px rgba(224, 85, 32, 0.35)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        pop: {
          '0%': { transform: 'scale(0.92)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease both',
        'slide-up': 'slide-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
        pop: 'pop 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
};