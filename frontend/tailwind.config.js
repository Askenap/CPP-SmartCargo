/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        'primary-dark': '#1d4ed8',
        success: '#16a34a',
        warning: '#d97706',
        draft: '#6366f1',
      },
      maxWidth: {
        mobile: '420px',
      },
    },
  },
  plugins: [],
}
