/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./index.html",
  ],
  darkMode: false,
  theme: {
    extend: {
      colors: {
        primary: '#6366f1', // Indigo
        secondary: '#8b5cf6', // Purple
        success: '#10b981', // Green
        warning: '#f59e0b', // Amber
        neutral: '#6b7280', // Cool Gray
        background: '#f8fafc', // Slate-50
        canvas: '#0f172a', // Slate-900
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      fontSize: {
        header: ['18px', { lineHeight: '1.2', letterSpacing: '-0.025em', fontWeight: '700' }],
        label: ['14px', { fontWeight: '500' }],
        body: ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['12px', { opacity: '0.7', fontWeight: '400' }],
      },
    },
  },
  plugins: [],
};