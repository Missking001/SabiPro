import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: { base: '#1A6B3C', hover: '#218C4A', tint: '#EAF5EE', deep: '#0F4D2E' },
        secondary: { base: '#D4801A', hover: '#EF9F27', tint: '#FAEEDA', deep: '#633806' },
        tertiary: { base: '#185FA5', hover: '#378ADD', tint: '#E6F1FB', deep: '#0C447C' },
        neutral: { 900: '#1A1A1A', 700: '#444441', 500: '#888780', 0: '#FFFFFF' },
        surface: { bg: '#F7F6F2', border: '#ECEAE3', input: '#D3D1C7', disabled: '#B4B2A9' },
        error: { bg: '#FCEBEB', border: '#F7C1C1', base: '#E24B4A', text: '#A32D2D', deep: '#791F1F' },
        success: { bg: '#EAF5EE', border: '#9FE1CB', base: '#1D9E75', text: '#0F6E56', deep: '#085041' },
        warning: { bg: '#FAEEDA', border: '#FAC775', base: '#EF9F27', text: '#BA7517', deep: '#633806' },
        info: { bg: '#E6F1FB', border: '#B5D4F4', base: '#378ADD', text: '#185FA5', deep: '#0C447C' },
      },
      borderWidth: {
        DEFAULT: '0.5px',
      },
      borderRadius: { component: '8px', card: '12px', pill: '9999px' },
      fontSize: {
        display: ['32px', { lineHeight: '1.2', fontWeight: '500' }],
        heading: ['24px', { lineHeight: '1.3', fontWeight: '500' }],
        subhead: ['18px', { lineHeight: '1.4', fontWeight: '500' }],
        body: ['16px', { lineHeight: '1.7', fontWeight: '400' }],
        small: ['14px', { lineHeight: '1.6', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '1.5', fontWeight: '400' }],
        overline: ['11px', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.08em' }],
      },
      keyframes: {
        wave: {
          '0%': { transform: 'rotate(0deg)' },
          '10%': { transform: 'rotate(14deg)' },
          '20%': { transform: 'rotate(-8deg)' },
          '30%': { transform: 'rotate(14deg)' },
          '40%': { transform: 'rotate(-4deg)' },
          '50%': { transform: 'rotate(10deg)' },
          '60%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
      },
      animation: {
        wave: 'wave 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
