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
          100: '#ffe5e8',
          300: '#e27a86',
          500: '#b7293e',
          700: '#8c1d2c',
          900: '#5b101b'
        },
        cielo: {
          100: '#e4f6fb',
          500: '#219ec3',
          700: '#0e7490'
        },
        tinta: '#25272b'
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
