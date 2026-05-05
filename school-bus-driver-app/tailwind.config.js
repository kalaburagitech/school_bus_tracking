/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2563EB',
          secondary: '#7C3AED',
          success: '#16A34A',
          danger: '#DC2626',
        },
      },
    },
  },
  plugins: [],
};
