/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      // ─────────────────────────────────────────────────────────────────────
      // GEEPAY MARKETPLACE BRAND COLOURS
      // Platform palette. CTAs default to flat; selected brand actions opt in via CSS.
      // gp-* is the canonical namespace; cobalt / sky / navy aliases stay for
      // existing class names.
      // ─────────────────────────────────────────────────────────────────────
      colors: {
        gp: {
          cobalt: {
            50: '#ECECF8',
            100: '#D1D2EF',
            200: '#A4A5DF',
            300: '#7679CF',
            DEFAULT: '#257DC1',
            400: '#257DC1',
            500: '#1C639A',
            600: '#26296D',
            700: '#1D1F58',
            800: '#141644',
            900: '#0C0D30',
            950: '#06071C',
          },
          sky: {
            50: '#E6F7FD',
            100: '#C2EAFB',
            200: '#85D5F7',
            300: '#47C0F3',
            DEFAULT: '#30C5F4',
            400: '#30C5F4',
            500: '#009DD4',
            600: '#0089B8',
            700: '#00749A',
            800: '#005F7D',
            900: '#004A61',
            950: '#003347',
          },
          navy: {
            50: '#EAECF4',
            100: '#C8CCE5',
            200: '#9499CB',
            300: '#6068B0',
            400: '#3D4596',
            500: '#252C7C',
            600: '#1C2266',
            700: '#131850',
            800: '#0C1040',
            DEFAULT: '#10182B',
            950: '#0C1220',
          },
          slate: {
            50: '#F7F8FA',
            100: '#EEF0F5',
            200: '#DDE0EB',
            300: '#C4C9D9',
            400: '#9AA0B8',
            500: '#70788F',
            600: '#555D78',
            700: '#3D4560',
            800: '#272F4A',
            900: '#141A34',
          },
        },

        // Flat aliases (existing JSX keeps working)
        cobalt: {
          DEFAULT: '#257DC1',
          dark: '#1C639A',
          50: '#ECECF8',
          100: '#D1D2EF',
          200: '#A4A5DF',
          300: '#7679CF',
          400: '#257DC1',
          500: '#1C639A',
          600: '#26296D',
          700: '#1D1F58',
          800: '#141644',
          900: '#0C0D30',
          950: '#06071C',
        },
        sky: {
          DEFAULT: '#30C5F4',
          dark: '#257DC1',
          50: '#E6F7FD',
          100: '#C2EAFB',
          200: '#85D5F7',
          300: '#47C0F3',
          400: '#30C5F4',
          500: '#009DD4',
          600: '#0089B8',
          700: '#00749A',
          800: '#005F7D',
          900: '#004A61',
          950: '#003347',
        },
        navy: {
          DEFAULT: '#10182B',
          dark: '#0C1220',
        },

        // shadcn/ui tokens
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: '#10182B',
          foreground: '#ffffff',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
        },

        // Semantic status
        success: {
          DEFAULT: 'var(--success)',
          light: 'var(--success-light)',
          fg: 'var(--success-fg)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          light: 'var(--warning-light)',
          fg: 'var(--warning-fg)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          light: 'var(--danger-light)',
          fg: 'var(--danger-fg)',
        },
        info: {
          DEFAULT: 'var(--info)',
          light: 'var(--info-light)',
          fg: 'var(--info-fg)',
        },

        // Legacy aliases → brand system
        cream: {
          DEFAULT: 'hsl(var(--background))',
          dark: 'hsl(var(--border))',
        },
        sage: {
          DEFAULT: 'hsl(var(--muted))',
          light: 'var(--info-light)',
        },
        forest: {
          DEFAULT: 'hsl(var(--primary))',
          dark: '#1C639A',
          muted: 'hsl(var(--muted-foreground))',
        },
        charcoal: 'hsl(var(--foreground))',
      },

      // ─────────────────────────────────────────────────────────────────────
      // TYPOGRAPHY
      // Inter           — body, UI labels, tables, form inputs
      // DM Sans         — headings, display, KPI stats, modal titles
      // JetBrains Mono  — order IDs, timestamps, amounts, hashes
      // font-serif      — alias of display (legacy storefront headings)
      // ─────────────────────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
        serif: ['DM Sans', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        'display-2xl': ['4.5rem', { lineHeight: '5.5rem', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-xl': ['3.75rem', { lineHeight: '4.5rem', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-lg': ['3rem', { lineHeight: '3.625rem', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-md': ['2.25rem', { lineHeight: '2.75rem', letterSpacing: '-0.02em', fontWeight: '600' }],
        'display-sm': ['1.875rem', { lineHeight: '2.375rem', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-xs': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.01em', fontWeight: '600' }],
        'text-xl': ['1.25rem', { lineHeight: '1.875rem', fontWeight: '400' }],
        'text-lg': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '400' }],
        'text-md': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
        'text-sm': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],
        'text-xs': ['0.75rem', { lineHeight: '1.125rem', fontWeight: '400' }],
      },

      spacing: {
        '4.5': '1.125rem',
        13: '3.25rem',
        15: '3.75rem',
        18: '4.5rem',
        22: '5.5rem',
        72: '18rem',
      },

      borderRadius: {
        none: '0px',
        xxs: '2px',
        xs: '4px',
        sm: 'calc(var(--radius) - 4px)',
        md: 'calc(var(--radius) - 2px)',
        lg: 'var(--radius)',
        xl: '12px',
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
        full: '9999px',
      },

      boxShadow: {
        xs: '0 1px 2px rgba(8, 12, 48, 0.05)',
        sm: '0 1px 3px rgba(8, 12, 48, 0.08), 0 1px 2px rgba(8, 12, 48, 0.05)',
        md: '0 4px 8px -2px rgba(8, 12, 48, 0.10), 0 2px 4px -2px rgba(8, 12, 48, 0.06)',
        lg: '0 12px 16px -4px rgba(8, 12, 48, 0.09), 0 4px 6px -2px rgba(8, 12, 48, 0.04)',
        xl: '0 20px 24px -4px rgba(8, 12, 48, 0.09), 0 8px 8px -4px rgba(8, 12, 48, 0.04)',
        '2xl': '0 24px 48px -12px rgba(8, 12, 48, 0.18)',
        'focus-cobalt': '0 0 0 3px rgba(37, 125, 193, 0.22)',
        'focus-sky': '0 0 0 3px rgba(48, 197, 244, 0.22)',
        'focus-error': '0 0 0 3px rgba(239, 68, 68, 0.22)',
        'glow-cobalt': '0 4px 24px rgba(37, 125, 193, 0.28)',
        'glow-sky': '0 4px 24px rgba(48, 197, 244, 0.24)',
        'btn-flat': '0 1px 2px rgba(37, 125, 193, 0.12), 0 2px 8px rgba(37, 125, 193, 0.10)',
        'dark-sm': '0 1px 3px rgba(0, 0, 0, 0.35)',
        'dark-md': '0 4px 12px rgba(0, 0, 0, 0.40)',
        'dark-lg': '0 12px 28px rgba(0, 0, 0, 0.50)',
      },

      backgroundImage: {
        // Kept for charts / branded surfaces — never for primary buttons
        'brand-gradient': 'linear-gradient(135deg, #257DC1 0%, #2b6fc2 50%, #30C5F4 100%)',
      },

      keyframes: {
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        skeleton: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(48, 197, 244, 0.4)' },
          '70%': { boxShadow: '0 0 0 8px rgba(48, 197, 244, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(48, 197, 244, 0)' },
        },
        'shimmer-gradient': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },

      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'fade-in-up': 'fade-in-up 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in-down': 'fade-in-down 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-left': 'slide-in-left 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slide-in-right 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scale-in 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        skeleton: 'skeleton 1.8s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite',
        'shimmer-gradient': 'shimmer-gradient 3s ease-in-out infinite',
      },

      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
