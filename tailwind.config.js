/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', '"Playfair Display"', 'serif'],
        body: ['Inter', 'sans-serif'],
        playfair: ['"Playfair Display"', 'serif'],
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          primary: 'var(--brand-primary)',
          'primary-hover': 'var(--brand-primary-hover)',
          secondary: 'var(--brand-secondary)',
          surface: 'var(--brand-surface)',
          text: 'var(--brand-text)',
        },
        surface: {
          DEFAULT: 'var(--ds-surface)',
          muted: 'var(--ds-surface-muted)',
          elevated: 'var(--ds-surface-elevated)',
        },
        content: {
          DEFAULT: 'var(--ds-content)',
          muted: 'var(--ds-content-muted)',
        },
        accent: {
          DEFAULT: 'var(--ds-accent)',
          soft: 'var(--ds-accent-soft)',
        },
      },
    },
  },
  plugins: [],
};
