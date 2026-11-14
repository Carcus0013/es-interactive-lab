/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        mask: v('mask'),        // page background (solder mask)
        panel: v('panel'),      // surfaces
        raised: v('raised'),    // raised surfaces / inputs
        line: v('line'),        // borders / traces at rest
        ink: v('ink'),          // primary text (silkscreen)
        dim: v('dim'),          // secondary text
        gold: v('gold'),        // ENIG copper accent (interactive)
        ch1: v('ch1'),          // scope channel 1 (yellow)
        ch2: v('ch2'),          // scope channel 2 (cyan)
        ch3: v('ch3'),          // scope channel 3 (magenta)
        ch4: v('ch4'),          // scope channel 4 (green)
        led: v('led'),          // LED red
        ok: v('ok'),
        warn: v('warn'),
        bad: v('bad'),
      },
      fontFamily: {
        sans: ['"Archivo Variable"', 'Archivo', 'system-ui', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', '"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      fontSize: {
        // modular scale ~1.2 (minor third) anchored at 16px
        xs: ['0.75rem', { lineHeight: '1.1rem' }],
        sm: ['0.875rem', { lineHeight: '1.35rem' }],
        base: ['1rem', { lineHeight: '1.65rem' }],
        lg: ['1.2rem', { lineHeight: '1.8rem' }],
        xl: ['1.44rem', { lineHeight: '1.95rem' }],
        '2xl': ['1.728rem', { lineHeight: '2.2rem' }],
        '3xl': ['2.074rem', { lineHeight: '2.5rem' }],
        '4xl': ['2.488rem', { lineHeight: '2.8rem' }],
      },
      maxWidth: { prose: '72ch' },
      keyframes: {
        flow: { to: { strokeDashoffset: '-24' } },
        blink: { '50%': { opacity: '0.15' } },
      },
      animation: {
        flow: 'flow 0.8s linear infinite',
        blink: 'blink 1s steps(1) infinite',
      },
    },
  },
  plugins: [],
};
