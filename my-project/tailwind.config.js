/** @type {import('tailwindcss').Config} */
// import type { Config } from 'tailwindcss'
import scrollbarHide from 'tailwind-scrollbar-hide'
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'Arial', 'sans-serif'],
      },
      colors: {
        primary: '#2874F0',
        accent: '#FF9F00',
        surface: '#FFFFFF',
        muted: '#F1F3F6',
        text: '#1F2937'
      },
      backgroundColor: {
        primary: '#2874F0',
        accent: '#FF9F00'
      }
    },
  },
  plugins: [scrollbarHide],
}