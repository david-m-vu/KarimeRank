/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {},
  },
  plugins: [],
  options: {
    safelist: ['dark']
  },
  darkMode: ['selector'],
}