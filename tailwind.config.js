// tailwind.config.js
import forms from '@tailwindcss/forms'; 

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',  // Lightest Steel Blue
          100: '#e0f0fe',
          200: '#bae0fd',
          300: '#90cafc',
          400: '#60b2f7',
          500: '#4682B4',  // Steel Blue
          600: '#3b74a9',  // Slightly darker Steel Blue
          700: '#2d5d8b',
          800: '#264e73',
          900: '#193545',
          950: '#0f2231',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
      },
    },
  },
  plugins: [
    // For ESM projects, we use the forms plugin this way:
    // If you haven't installed @tailwindcss/forms, run:
    // npm install @tailwindcss/forms
  ],
};

export default config;