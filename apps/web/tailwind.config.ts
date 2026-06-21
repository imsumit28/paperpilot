import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Pilot Blue — structural primary, matched to the Paper Pilot logo
        // (navy → bright blue). Nav, links, primary actions, focus.
        brand: {
          DEFAULT: '#2456E0',
          50: '#EFF4FF',
          100: '#DCE7FE',
          200: '#BFD2FE',
          300: '#93B2FD',
          400: '#5E8AF9',
          500: '#3A6BF0',
          600: '#2456E0',
          700: '#1D44B5',
          800: '#1B388F',
          900: '#172B66',
        },
        // Aurora — warm "AI energy" accent, used sparingly for Create/Generate/Toolkit
        accent: {
          DEFAULT: '#F0653E',
          50: '#FFF3EE',
          100: '#FFE2D6',
          200: '#FFC2AC',
          300: '#FF9D7E',
          400: '#F87B53',
          500: '#F0653E',
          600: '#D84E29',
          700: '#B23C1F',
          800: '#8A2F19',
          900: '#5E2011',
        },
        ink: {
          DEFAULT: '#15161B',
          muted: '#5B6072',
          subtle: '#9499AB',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          alt: '#F7F7FB',
          page: '#F4F4F7',
        },
        border: {
          DEFAULT: '#E6E7EE',
          strong: '#D2D4DF',
        },
        // Assignment status — processing ties to brand so "AI working" reads on-brand
        status: {
          pending: '#D97706',
          'pending-bg': '#FEF3C7',
          processing: '#2456E0',
          'processing-bg': '#DCE7FE',
          ready: '#059669',
          'ready-bg': '#D1FAE5',
          failed: '#E11D48',
          'failed-bg': '#FFE4E6',
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
        // Layered elevation: border separates, shadow lifts
        card: '0 1px 2px rgba(20,22,30,0.04), 0 1px 1px rgba(20,22,30,0.03)',
        raised: '0 12px 32px rgba(20,22,30,0.12)',
        float: '0 12px 32px rgba(20,22,30,0.10), 0 24px 40px rgba(20,22,30,0.10)',
        sidebar: '0 4px 24px rgba(20,22,30,0.06)',
        'brand-glow': '0 0 0 4px rgba(36,86,224,0.12)',
      },
      borderRadius: {
        lg: '0.75rem', // 12px — controls
        xl: '1rem', // 16px
        '2xl': '1.25rem', // 20px — cards
        '3xl': '1.75rem', // 28px — shell panels
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
