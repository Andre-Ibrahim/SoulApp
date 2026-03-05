/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#101112',
        cream: '#f6f2e9',
        sun: '#f5b640',
        teal: '#0f7a7a',
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
