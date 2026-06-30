/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2B5BA8', hover: '#244d91', light: '#EEF3FB' },
        success: '#16A34A',
        warning: '#D97706',
        danger:  '#DC2626',
        surface: { DEFAULT: '#F0F2F5', card: '#FFFFFF' }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.10)'
      }
    }
  },
  plugins: []
};
