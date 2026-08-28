/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        maine: {
          black: '#0a0a0a',
          gold: '#c9a84c',
          cream: '#f5f0e8',
          dark: '#1a1a1a',
          gray: '#2a2a2a',
        }
      },
      fontFamily: {
        display: ['Georgia', 'serif'],
        body: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
