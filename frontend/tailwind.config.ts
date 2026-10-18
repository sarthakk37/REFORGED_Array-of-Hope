import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        forge: {
          bg: '#0b0f17',
          surface: '#111827',
          'surface-elevated': '#162234',
          'surface-hover': '#1a293f',
          border: '#1f2a3e',
          'border-subtle': '#162032',
          amber: {
            DEFAULT: '#f59e0b',
            hover: '#d97706',
            light: '#fbbf24',
            dark: '#b45309',
            glow: 'rgba(245, 158, 11, 0.25)',
          },
          cyan: {
            DEFAULT: '#06b6d4',
            hover: '#0891b2',
            light: '#22d3ee',
            glow: 'rgba(6, 182, 212, 0.25)',
          },
          green: {
            DEFAULT: '#10b981',
            hover: '#059669',
            light: '#34d399',
            glow: 'rgba(16, 185, 129, 0.25)',
          },
          red: {
            DEFAULT: '#ef4444',
            hover: '#dc2626',
            light: '#f87171',
            glow: 'rgba(239, 68, 68, 0.25)',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'amber-glow': '0 0 16px -2px rgba(245, 158, 11, 0.35)',
        'cyan-glow': '0 0 16px -2px rgba(6, 182, 212, 0.35)',
        'green-glow': '0 0 16px -2px rgba(16, 185, 129, 0.35)',
        'red-glow': '0 0 16px -2px rgba(239, 68, 68, 0.35)',
      },
      animation: {
        shimmer: 'shimmer 2s infinite linear',
        pulseSlow: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
