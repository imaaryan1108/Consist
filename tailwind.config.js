/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#C6FF00',
          50: '#f9ffeb',
          100: '#f1ffd1',
          200: '#e1ffab',
          300: '#c6ff00', // Neon Lime
          400: '#b4e600',
          500: '#9bc600',
          600: '#799a00',
          700: '#5b7400',
          800: '#485c00',
          900: '#3c4d05',
        },
        charcoal: {
          DEFAULT: '#0D0D0D',
          950: '#050505',
          900: '#0D0D0D',
          800: '#1A1A1A',
          700: '#262626',
        },
        slate: {
          DEFAULT: '#94A3B8',
          950: '#0F172A',
          400: '#94A3B8',
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'neon': '0 0 15px -3px rgba(198, 255, 0, 0.3), 0 0 6px -2px rgba(198, 255, 0, 0.1)',
        'neon-strong': '0 0 25px -5px rgba(198, 255, 0, 0.4), 0 0 10px -2px rgba(198, 255, 0, 0.2)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
