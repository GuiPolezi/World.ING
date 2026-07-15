/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F8F8',
        surface: '#FFFFFF',
        ink: '#17181A',
        muted: '#6B7076',
        line: '#E6E8E8',
        accent: {
          DEFAULT: '#3B3BE8',
          soft: '#EDEDFD',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
