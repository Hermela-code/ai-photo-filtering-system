/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          500: '#ef8354', // The signature orange/coral from your UI screens
          600: '#df7345',
        }
      }
    },
  },
  plugins: [],
}