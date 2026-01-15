/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        background: 'hsl(40, 20%, 98%)',
        foreground: 'hsl(24, 10%, 10%)',
        card: 'hsl(0, 0%, 100%)',
        'card-foreground': 'hsl(24, 10%, 10%)',
        primary: 'hsl(180, 26%, 25%)',
        'primary-foreground': 'hsl(0, 0%, 98%)',
        secondary: 'hsl(40, 15%, 90%)',
        'secondary-foreground': 'hsl(180, 26%, 25%)',
        destructive: 'hsl(0, 70%, 60%)',
        'destructive-foreground': 'hsl(0, 0%, 98%)',
        muted: 'hsl(40, 10%, 96%)',
        'muted-foreground': 'hsl(24, 5%, 45%)',
        accent: 'hsl(40, 20%, 96%)',
        'accent-foreground': 'hsl(24, 10%, 10%)',
        border: 'hsl(40, 10%, 90%)',
        input: 'hsl(40, 10%, 90%)',
        ring: 'hsl(180, 26%, 25%)',
      },
      borderRadius: {
        lg: '0.5rem',
        md: 'calc(0.5rem - 2px)',
        sm: 'calc(0.5rem - 4px)',
      },
      fontFamily: {
        heading: ['DM Sans', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}