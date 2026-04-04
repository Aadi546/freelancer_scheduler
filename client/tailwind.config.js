export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#0d0e11',
          900: '#13151a',
          800: '#1a1d24',
          700: '#21252e',
          600: '#2a2e38',
        },
        accent: {
          500: '#6c8fff',
          600: '#5a7be0',
        }
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
