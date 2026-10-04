/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#fdf8f0',
          100: '#f9edda',
          200: '#f2d9b0',
          300: '#e8be7d',
          400: '#db9d47',
          500: '#cc8226',
          600: '#b5671c',
          700: '#964f19',
          800: '#7a401b',
          900: '#643519',
        },
        farm: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
        }
      }
    },
  },
  plugins: [],
}
