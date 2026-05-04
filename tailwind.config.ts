import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0f',
        'bg-2': '#11111a',
        'bg-3': '#16171f',
        line: 'rgba(255, 255, 255, 0.06)',
        'line-2': 'rgba(255, 255, 255, 0.1)',
        text: '#e8e8ee',
        'text-dim': '#94959f',
        amber: '#fbbf24',
        emerald: '#34d399',
        rose: '#fb7185',
        violet: '#a78bfa',
        sky: '#38bdf8',
        gold: '#f5c14a',
      },
      fontFamily: {
        serif: ['Instrument Serif', 'serif'],
        sans: ['Geist', 'sans-serif'],
        mono: ['Courier New', 'monospace'],
      },
      screens: {
        xs: '360px',
      },
    },
  },
  plugins: [],
}

export default config
