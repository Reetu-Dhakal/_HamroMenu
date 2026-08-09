/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FBF7F1',
          100: '#F6EEE3',
          200: '#EEDFCC',
        },
        paper: '#FFFDF9',
        ink: {
          DEFAULT: '#221A14',
          soft: '#5E5146',
          faint: '#8C7B6E',
        },
        clay: {
          50: '#FDF3EC',
          100: '#FAE3D3',
          200: '#F3C5A4',
          300: '#EA9E6D',
          400: '#E2743C',
          500: '#D95F1E',
          600: '#C24A0E',
          700: '#A03A08',
          800: '#7F2F09',
          900: '#5E240A',
        },
        saffron: {
          DEFAULT: '#E8A33D',
          light: '#F6C87A',
          deep: '#C97F17',
        },
        leaf: {
          DEFAULT: '#2E8B57',
          light: '#4CAF7D',
          dark: '#1F6B41',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        xl2: '1.25rem',
        xl3: '1.75rem',
      },
      boxShadow: {
        card: '0 2px 8px rgba(62, 38, 18, 0.06), 0 12px 32px -8px rgba(62, 38, 18, 0.12)',
        cardHover: '0 4px 14px rgba(62, 38, 18, 0.08), 0 20px 48px -12px rgba(62, 38, 18, 0.18)',
        float: '0 8px 24px -4px rgba(194, 74, 14, 0.35)',
        sheet: '0 -8px 40px rgba(34, 26, 20, 0.18)',
        glow: '0 0 0 3px rgba(217, 95, 30, 0.18)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
        'pop-in': 'pop-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        float: 'float 5s ease-in-out infinite',
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};