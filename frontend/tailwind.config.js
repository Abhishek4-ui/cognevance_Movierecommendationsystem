/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070a13',
          900: '#0b0f19',
          850: '#0f172a',
          800: '#111827',
          700: '#1e293b',
          600: '#334155'
        },
        electric: {
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7'
        },
        accent: {
          purple: '#8b5cf6',
          indigo: '#6366f1',
          rose: '#f43f5e'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif']
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.25) 0%, rgba(14, 165, 233, 0.1) 40%, transparent 70%)'
      }
    },
  },
  plugins: [],
}
