/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1E40AF', hover: '#1D3FA0' },
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        surface: { DEFAULT: '#F9FAFB', card: '#FFFFFF' }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
