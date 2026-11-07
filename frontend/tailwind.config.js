/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0B0F19',
          900: '#0E1424',
          800: '#11182D', // Official Deep Navy
          700: '#1A243F',
          600: '#253356',
        },
        gold: {
          300: '#EBD9A8',
          400: '#E2CA8C',
          500: '#D6B66C', // Official Champagne Gold
          600: '#C29F50',
          700: '#9C7A30',
        },
        ivory: {
          50: '#FDFBF7',
          100: '#F7F5EF', // Official Warm Ivory
          200: '#EBE7DC',
          300: '#DFD8C7',
        },
        emerald: {
          400: '#34B785',
          500: '#26966B', // Official Emerald
          600: '#1E7A56',
          700: '#175E43',
        },
        amber: {
          400: '#F0BA57',
          500: '#E5A83B', // Official Amber
          600: '#C98B25',
        },
        crimson: {
          400: '#E57373',
          500: '#D95C5C', // Official Soft Red
          600: '#B84343',
        },
        lavender: {
          400: '#A48FF0',
          500: '#8B70E8', // Official Lavender
          600: '#7154D4',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'gold-glow': '0 0 25px -5px rgba(214, 182, 108, 0.3)',
        'emerald-glow': '0 0 25px -5px rgba(38, 150, 107, 0.3)',
        'crimson-glow': '0 0 25px -5px rgba(217, 92, 92, 0.3)',
      }
    },
  },
  plugins: [],
}

