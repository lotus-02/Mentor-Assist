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
        slate: {
          850: '#151f32',
          900: '#0f172a',
          950: '#080d1a',
        },
        emerald: {
          450: '#10b981',
          500: '#10b981',
          glow: 'rgba(16, 185, 129, 0.25)',
        },
        indigo: {
          glow: 'rgba(99, 102, 241, 0.25)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace']
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: 1, filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.6))' },
          '50%': { opacity: 0.8, filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.3))' },
        }
      }
    },
  },
  plugins: [],
}
