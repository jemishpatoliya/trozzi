/** @type {import('tailwindcss').Config} */
// import type { Config } from 'tailwindcss'
import scrollbarHide from 'tailwind-scrollbar-hide'
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ff5252'
      },
      backgroundColor: {
        primary: '#ff5252'
      }
    },
  },
  plugins: [scrollbarHide],
}