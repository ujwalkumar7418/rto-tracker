/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Syne"', 'sans-serif'],
      },
      colors: {
        surface: {
          0: '#080c14',
          1: '#0d1220',
          2: '#121929',
          3: '#1a2438',
          4: '#1f2d45',
        },
        accent: {
          blue:   '#3b82f6',
          green:  '#22c55e',
          amber:  '#f59e0b',
          red:    '#ef4444',
          purple: '#a855f7',
          teal:   '#14b8a6',
        },
        status: {
          office:  '#3b82f6',
          wfh:     '#22c55e',
          pto:     '#a855f7',
          sick:    '#ef4444',
          holiday: '#f59e0b',
          none:    '#1a2438',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-ring': 'pulseRing 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.92)' }, to: { opacity: '1', transform: 'scale(1)' } },
        pulseRing: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        'glow-blue':   '0 0 20px rgba(59,130,246,0.35)',
        'glow-green':  '0 0 20px rgba(34,197,94,0.35)',
        'glow-amber':  '0 0 20px rgba(245,158,11,0.35)',
        'glow-red':    '0 0 20px rgba(239,68,68,0.35)',
        'inner-lg':    'inset 0 2px 8px rgba(0,0,0,0.4)',
      }
    },
  },
  plugins: [],
}
