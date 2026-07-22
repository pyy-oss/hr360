/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0E1A2B',            // fond sombre principal (sidebar)
        'ink-2': '#13233A',        // surface sombre secondaire
        signal: {
          DEFAULT: '#0EA5A5',      // accent teal
          deep: '#0A7C7C',
          soft: '#E3F5F5',
        },
        surface: '#FFFFFF',
        canvas: '#F6F8FA',         // fond de page clair
        line: '#E7ECF1',           // bordures
        muted: '#5B6B7C',
        'muted-2': '#93A1AF',
        gold: '#C9A227',
        high: '#12A150',           // vert (ok / atteint)
        mid: '#D08A00',            // ambre (vigilance)
        low: '#D1495B',            // rouge (risque)
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: { xl: '0.9rem', '2xl': '1.15rem' },
      boxShadow: {
        card: '0 1px 2px rgba(14,26,43,0.04), 0 4px 16px rgba(14,26,43,0.05)',
      },
    },
  },
  plugins: [],
};
