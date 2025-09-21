/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'Roboto Condensed', 'system-ui', 'sans-serif'],
        'condensed': ['Roboto Condensed', 'Inter', 'system-ui', 'sans-serif'],
        'display': ['Inter', 'Roboto Condensed', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
        'extrabold': '800',
        'black': '900',
      },
      letterSpacing: {
        'tight': '-0.025em',
        'tighter': '-0.05em',
        'wide': '0.025em',
        'wider': '0.05em',
      }
    },
  },
  plugins: [],
}

