/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/app/components/**/*.{js,jsx,ts,tsx}",
    "./src/app/admin/**/*.{js,jsx,ts,tsx}",
    "./src/app/dashboard/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      // Lisibilité : petits corps de texte remontés d'un cran sur tout le site
      fontSize: {
        xs: ['0.8125rem', { lineHeight: '1.125rem' }],  // 13px (au lieu de 12)
        sm: ['0.9375rem', { lineHeight: '1.375rem' }],  // 15px (au lieu de 14)
        'ui-xs': ['12px', { lineHeight: '16px' }],
        'ui-sm': ['14px', { lineHeight: '20px' }],
        'ui-base': ['15px', { lineHeight: '22px' }],
        'display-md': ['22px', { lineHeight: '24px' }],
      },
      colors: {
        // Constantes de marque (hex pour garder les modificateurs d'opacité : bg-nuit/85)
        ardoise: {
          950: '#12171C',
          900: '#1C2329',
          700: '#3A4651',
          500: '#5C6873',
          400: '#808B95',
          100: '#E3E7EA',
          50: '#F4F6F7',
        },
        securite: '#EF5B0C',
        'orange-vif': '#FF7426',
        nuit: { DEFAULT: '#0B0F13', 2: '#12181E', 3: '#1A2128' },
        craie: { DEFAULT: '#ECEFF1', 2: '#A7B0B8', 3: '#76818B' },
        beton: { DEFAULT: '#E6E9EB', 2: '#F2F4F5' },
        // Rôles de la sidebar : variables CSS qui basculent avec [data-theme="dark"]
        sb: {
          bg: 'var(--sb-bg)',
          border: 'var(--sb-border)',
          text: 'var(--sb-text)',
          muted: 'var(--sb-muted)',
          faint: 'var(--sb-faint)',
          hover: 'var(--sb-hover)',
          active: 'var(--sb-active)',
          accent: 'var(--sb-accent)',
          'on-accent': 'var(--sb-on-accent)',
          avatar: 'var(--sb-avatar)',
          danger: 'var(--sb-danger)',
          'danger-bg': 'var(--sb-danger-bg)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        ui: ['var(--font-ui)'],
        data: ['var(--font-data)'],
      },
      spacing: {
        'sb-item': 'var(--sb-item-h)',
        sb: 'var(--sb-width)',
      },
      borderRadius: {
        sb: 'var(--radius-sm)',
      },
    },
  },
  plugins: [],
};
