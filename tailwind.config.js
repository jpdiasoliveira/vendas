/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        playfair: ['"Playfair Display"', 'serif'],
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        // Agora as cores são dinâmicas!
        brand: {
          primary: 'var(--brand-primary)',
          secondary: 'var(--brand-secondary)',
          surface: 'var(--brand-surface)',
          text: 'var(--brand-text)',
        },
      },
    },
  },
  plugins: [],
};