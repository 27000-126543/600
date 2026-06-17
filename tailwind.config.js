/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: '#E8EDF5',
          100: '#C6D1E5',
          200: '#94A5CC',
          300: '#6279B3',
          400: '#3D5999',
          500: '#1A3D80',
          600: '#0B2A5A',
          700: '#081F45',
          800: '#051430',
          900: '#030A1B',
        },
        gold: {
          50: '#FBF7EE',
          100: '#F5EBDA',
          200: '#EBD7B4',
          300: '#E1C38E',
          400: '#D5AF69',
          500: '#C9A962',
          600: '#A0874E',
          700: '#78653A',
          800: '#504427',
          900: '#282213',
        },
        warning: {
          high: '#E53935',
          medium: '#FB8C00',
          low: '#FDD835',
        },
        success: {
          500: '#43A047',
        }
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
