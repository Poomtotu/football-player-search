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
        dark: {
          900: '#070A12',
          800: '#0B0F19',
          700: '#111827',
          600: '#1E293B',
          500: '#334155',
        },
        sports: {
          emerald: '#10B981',
          cyan: '#06B6D4',
          lime: '#84CC16',
          gold: '#F59E0B',
          flame: '#EF4444',
          purple: '#8B5CF6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Thai', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.35)',
        'neon-cyan': '0 0 20px -3px rgba(6, 182, 212, 0.35)',
        'neon-gold': '0 0 20px -3px rgba(245, 158, 11, 0.35)',
        'glow-card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-glow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
