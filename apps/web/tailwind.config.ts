import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#E8520A',
          50: '#FFF2EA',
          100: '#FFE0CC',
          200: '#FFC199',
          300: '#FFA266',
          400: '#FF8333',
          500: '#E8520A',
          600: '#C04408',
          700: '#993606',
          800: '#722904',
          900: '#4B1B03',
        },
        ink: {
          DEFAULT: '#111111',
          muted: '#6B7280',
          subtle: '#9CA3AF',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          alt: '#F5F5F5',
          page: '#EDEDED',
        },
        border: {
          DEFAULT: '#E5E7EB',
          strong: '#D1D5DB',
        },
        difficulty: {
          easy: '#15803D',
          'easy-bg': '#DCFCE7',
          moderate: '#B45309',
          'moderate-bg': '#FEF3C7',
          hard: '#B91C1C',
          'hard-bg': '#FEE2E2',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui'],
        inter: ['var(--font-inter)', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 1px 1px rgba(0,0,0,0.03)',
        sidebar: '0 4px 24px rgba(0,0,0,0.04)',
        'brand-glow': '0 0 0 4px rgba(232,82,10,0.10)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.25s ease-out',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
