import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        rioja: {
          50: '#fff5f6',
          100: 'var(--red-pale)',
          300: '#e27a86',
          500: 'var(--red-mid)',
          700: 'var(--red)',
          900: 'var(--red-deep)'
        },
        cielo: {
          100: 'var(--blue-pale)',
          500: 'var(--blue)',
          700: 'var(--blue-dark)'
        },
        tinta: 'var(--ink)'
      },
      boxShadow: {
        soft: '0 12px 35px rgba(16, 24, 40, 0.08)'
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Arial', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif']
      }
    }
  },
  plugins: []
};

export default config;
