/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        lime: {
          300: '#d4f542',
          400: '#c8ee2c',
          500: '#b8e619',
        },
        purple: {
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
        },
        surface: {
          dark: '#0d0d0d',
          card: '#ffffff',
          muted: '#f5f5f5',
        },
        text: {
          primary: '#0d0d0d',
          secondary: '#6b7280',
          inverse: '#ffffff',
        },
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 2px 16px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.12)',
        glow: '0 0 20px rgba(184, 230, 25, 0.3)',
      },
    },
  },
  plugins: [],
};
