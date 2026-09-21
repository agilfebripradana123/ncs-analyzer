/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2563EB', dark: '#1D4ED8' },
        sidebar: '#17243A',
        'sidebar-active': '#2563EB',
        background: '#EEF2FA',
        surface: { DEFAULT: '#FFFFFF', secondary: '#F5F7FB' },
        border: '#E2E8F0',
        text: { primary: '#172033', secondary: '#64748B' },
        success: '#16A34A',
        warning: '#F59E0B',
        'high-risk': '#F97316',
        critical: '#DC2626',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
