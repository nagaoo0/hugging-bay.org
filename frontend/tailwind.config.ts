import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        hb: {
          bg:           '#07070c',
          surface:      '#0e0e18',
          surface2:     '#14141e',
          surface3:     '#1c1c2a',
          border:       '#1e1e2e',
          border2:      '#2e2e46',
          text:         '#f0f0f8',
          muted:        '#6c6c8e',
          purple:       '#8b5cf6',
          'purple-light': '#a78bfa',
          green:        '#10d9a0',
          blue:         '#4d9de8',
          amber:        '#f0a030',
          red:          '#f04848',
        },
      },
      fontFamily: {
        mono: ['Cascadia Code', 'Fira Code', 'JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
