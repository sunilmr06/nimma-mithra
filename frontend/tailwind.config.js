/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0B1020',
        sidebar: '#111827',
        card: '#151E30',
        elevated: '#1C2940',
        border: '#273449',
        primary: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
          light: '#818CF8',
          dark: '#3730A3'
        },
        cyan: {
          DEFAULT: '#06B6D4',
          hover: '#0891B2',
          light: '#22D3EE'
        },
        success: {
          DEFAULT: '#22C55E',
          bg: '#14532D',
          border: '#166534'
        },
        warning: {
          DEFAULT: '#F59E0B',
          bg: '#78350F',
          border: '#92400E'
        },
        critical: {
          DEFAULT: '#EF4444',
          bg: '#7F1D1D',
          border: '#991B1B'
        },
        main: '#F8FAFC',
        muted: '#94A3B8',
        subtle: '#64748B'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
