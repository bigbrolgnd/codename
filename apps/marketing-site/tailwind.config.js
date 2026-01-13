/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pink/Magenta Spectrum
        pink: {
          bright: '#d552b7',    // Lightning strike - brightest pink
          deep: '#9f4389',      // Primary actions - deep pink
          muted: '#6c335e',     // Secondary elements - muted purple
          dark: '#3d2336',      // Background accents - dark plum
        },
        black: '#111111',      // Primary background
      },
      backgroundColor: {
        'glass-light': 'rgba(213, 82, 183, 0.15)',    // High-emphasis cards
        'glass-medium': 'rgba(213, 82, 183, 0.10)',   // Standard cards
        'glass-dark': 'rgba(213, 82, 183, 0.05)',     // Low-emphasis cards
      },
      boxShadow: {
        'glow-soft': '0 0 20px rgba(213, 82, 183, 0.3)',
        'glow-medium': '0 0 40px rgba(213, 82, 183, 0.5)',
        'glow-intense': '0 0 60px rgba(213, 82, 183, 0.7)',
      },
      fontFamily: {
        display: ['Geist Sans', 'Inter', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '4xl': ['3rem', { lineHeight: '1.1' }],      // 48px
        '3xl': ['2.25rem', { lineHeight: '1.2' }],    // 36px
        '2xl': ['1.5rem', { lineHeight: '1.3' }],     // 24px
        'xl': ['1.25rem', { lineHeight: '1.4' }],     // 20px
        'base': ['1rem', { lineHeight: '1.5' }],      // 16px
        'sm': ['0.875rem', { lineHeight: '1.5' }],    // 14px
      },
      spacing: {
        '1': '0.25rem',    // 4px
        '2': '0.5rem',     // 8px
        '3': '0.75rem',    // 12px
        '4': '1rem',       // 16px
        '6': '1.5rem',     // 24px
        '8': '2rem',       // 32px
        '12': '3rem',      // 48px
        '16': '4rem',      // 64px
      },
    },
  },
  plugins: [],
}
