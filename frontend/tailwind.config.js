/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bb-black': 'var(--bg-black)',
        'bb-dark': 'var(--bg-card)',
        'bb-card': 'var(--bg-card)',
        'bb-bg': 'var(--bg-black)',
        'bb-gray': 'var(--bg-gray)',
        'bb-border': 'var(--border-color)',
        'bb-orange': '#ff9900',
        'bb-text': 'var(--text-primary)',
        'bb-text-light': 'var(--text-secondary)',
        'bb-muted': 'var(--text-muted)',
        'bb-green': 'var(--color-green)',
        'bb-red': 'var(--color-red)',
        'bb-blue': 'var(--color-blue)',
      },
      fontFamily: {
        mono: ['Consolas', 'Monaco', 'Courier New', 'monospace'],
        sans: ['Roboto', 'Segoe UI', 'Arial', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}