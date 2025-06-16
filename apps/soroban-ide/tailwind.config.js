/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        stellar: {
          blue: '#1B4965',
          cyan: '#62B6CB',
          teal: '#1DD3B0',
          yellow: '#AFFC41',
          orange: '#FFE15D',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
      }
    },
  },
  plugins: [],
}