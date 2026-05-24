import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // GE Vernova official brand color: Evergreen
        gev: {
          50:  '#e6f4f4',
          100: '#cce9e9',
          200: '#99d3d3',
          300: '#66bcbd',
          400: '#33a6a7',
          500: '#005E60',  // Evergreen — couleur officielle GE Vernova
          600: '#004d4f',
          700: '#003d3f',
          800: '#002c2d',
          900: '#001c1d',
          950: '#000e0e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
