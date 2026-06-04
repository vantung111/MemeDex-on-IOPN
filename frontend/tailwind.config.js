/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a14',
        surface: '#2d1b4e',
        'surface-light': '#3d2b5e',
        border: '#000000',
        primary: '#8b5cf6',
        accent: '#06d6a0',
        warning: '#fbbf24',
        danger: '#ef4444',

        // Meme palette
        'pepe-green': '#4ade80',
        'doge-gold': '#fbbf24',
        'chad-orange': '#ff6b35',
        'wojak-pink': '#ff006e',
        'moon-purple': '#8338ec',
        'laser-cyan': '#00f5ff',
        'rocket-red': '#ff1744',
        'diamond-blue': '#00b4d8',
        'skibidi-yellow': '#ffe66d',
        'rizz-pink': '#ff5e8a',
        'gyatt-purple': '#c77dff',
        'based-yellow': '#ffd60a',
        'cope-blue': '#48cae4',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        meme: ['Bangers', 'cursive'],
        marker: ['Permanent Marker', 'cursive'],
        bungee: ['Bungee', 'cursive'],
        pixel: ['Press Start 2P', 'cursive'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'wiggle': 'wiggle 0.5s ease-in-out infinite',
        'wiggle-slow': 'wiggle-slow 2s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'spin-slow': 'spin-slow 8s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'rainbow': 'rainbow 3s ease infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'bounce-in': 'bounce-in 0.5s ease-out',
        'rocket': 'rocket 1.5s ease-in-out infinite',
        'moon-bob': 'moon-bob 4s ease-in-out infinite',
        'tilt': 'tilt 5s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(139, 92, 246, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.8), 0 0 30px rgba(139, 92, 246, 0.4)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        'wiggle-slow': {
          '0%, 100%': { transform: 'rotate(-1deg)' },
          '50%': { transform: 'rotate(1deg)' },
        },
        shake: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translate(-2px, 0)' },
          '20%, 40%, 60%, 80%': { transform: 'translate(2px, 0)' },
        },
        'spin-slow': {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(360deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 107, 53, 0.5), 0 0 40px rgba(255, 0, 110, 0.3)', transform: 'scale(1)' },
          '50%': { boxShadow: '0 0 30px rgba(255, 107, 53, 0.8), 0 0 60px rgba(255, 0, 110, 0.5)', transform: 'scale(1.05)' },
        },
        rainbow: {
          '0%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
          '100%': { 'background-position': '0% 50%' },
        },
        'slide-up': {
          'from': { transform: 'translateY(50px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        rocket: {
          '0%, 100%': { transform: 'translateY(0) rotate(-45deg)' },
          '50%': { transform: 'translateY(-20px) rotate(-45deg)' },
        },
        'moon-bob': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-30px) rotate(15deg)' },
        },
        tilt: {
          '0%, 50%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(2deg)' },
          '75%': { transform: 'rotate(-2deg)' },
        },
      },
    },
  },
  plugins: [],
};
