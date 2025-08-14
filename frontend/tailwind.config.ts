import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand colors
        brand: {
          50: 'hsl(var(--brand-50))',
          100: 'hsl(var(--brand-100))',
          200: 'hsl(var(--brand-200))',
          300: 'hsl(var(--brand-300))',
          400: 'hsl(var(--brand-400))',
          500: 'hsl(var(--brand-500))',
          600: 'hsl(var(--brand-600))',
          700: 'hsl(var(--brand-700))',
          800: 'hsl(var(--brand-800))',
          900: 'hsl(var(--brand-900))',
          950: 'hsl(var(--brand-950))',
        },
        // Neutral colors
        neutral: {
          50: 'hsl(var(--neutral-50))',
          100: 'hsl(var(--neutral-100))',
          200: 'hsl(var(--neutral-200))',
          300: 'hsl(var(--neutral-300))',
          400: 'hsl(var(--neutral-400))',
          500: 'hsl(var(--neutral-500))',
          600: 'hsl(var(--neutral-600))',
          700: 'hsl(var(--neutral-700))',
          800: 'hsl(var(--neutral-800))',
          900: 'hsl(var(--neutral-900))',
          950: 'hsl(var(--neutral-950))',
        },
        // Semantic colors
        success: {
          50: 'hsl(var(--success-50))',
          100: 'hsl(var(--success-100))',
          200: 'hsl(var(--success-200))',
          300: 'hsl(var(--success-300))',
          400: 'hsl(var(--success-400))',
          500: 'hsl(var(--success-500))',
          600: 'hsl(var(--success-600))',
          700: 'hsl(var(--success-700))',
          800: 'hsl(var(--success-800))',
          900: 'hsl(var(--success-900))',
        },
        warn: {
          50: 'hsl(var(--warn-50))',
          100: 'hsl(var(--warn-100))',
          200: 'hsl(var(--warn-200))',
          300: 'hsl(var(--warn-300))',
          400: 'hsl(var(--warn-400))',
          500: 'hsl(var(--warn-500))',
          600: 'hsl(var(--warn-600))',
          700: 'hsl(var(--warn-700))',
          800: 'hsl(var(--warn-800))',
          900: 'hsl(var(--warn-900))',
        },
        error: {
          50: 'hsl(var(--error-50))',
          100: 'hsl(var(--error-100))',
          200: 'hsl(var(--error-200))',
          300: 'hsl(var(--error-300))',
          400: 'hsl(var(--error-400))',
          500: 'hsl(var(--error-500))',
          600: 'hsl(var(--error-600))',
          700: 'hsl(var(--error-700))',
          800: 'hsl(var(--error-800))',
          900: 'hsl(var(--error-900))',
        },
        // Background and foreground
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        // Card colors
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Popover colors
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        // Primary colors
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // Secondary colors
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        // Muted colors
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        // Accent colors
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        // Destructive colors
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        // Border and input colors
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      fontSize: {
        // Display sizes
        'display-1': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-2': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-3': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        // Heading sizes
        'h1': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'h2': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        'h3': ['1.5rem', { lineHeight: '1.4', letterSpacing: '0em' }],
        'h4': ['1.25rem', { lineHeight: '1.4', letterSpacing: '0em' }],
        'h5': ['1.125rem', { lineHeight: '1.4', letterSpacing: '0em' }],
        'h6': ['1rem', { lineHeight: '1.4', letterSpacing: '0em' }],
        // Body sizes
        'body-lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '0em' }],
        'body': ['1rem', { lineHeight: '1.6', letterSpacing: '0em' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0em' }],
        // Small sizes
        'small': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0em' }],
        'xs': ['0.625rem', { lineHeight: '1.3', letterSpacing: '0em' }],
      },
      spacing: {
        // Custom spacing scale
        '18': '4.5rem',    // 72px
        '88': '22rem',     // 352px
        '128': '32rem',    // 512px
        '144': '36rem',    // 576px
      },
      borderRadius: {
        'xs': '0.125rem',  // 2px
        'sm': '0.25rem',   // 4px
        'md': '0.375rem',  // 6px
        'lg': '0.5rem',    // 8px
        'xl': '0.75rem',   // 12px
        '2xl': '1rem',     // 16px
        '3xl': '1.5rem',   // 24px
        'full': '9999px',
      },
      boxShadow: {
        // Custom shadows
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'sm': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        // Colored shadows
        'brand': '0 4px 14px 0 rgb(var(--brand-500) / 0.25)',
        'success': '0 4px 14px 0 rgb(var(--success-500) / 0.25)',
        'warn': '0 4px 14px 0 rgb(var(--warn-500) / 0.25)',
        'error': '0 4px 14px 0 rgb(var(--error-500) / 0.25)',
        // Inner shadows
        'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
      },
      animation: {
        // Custom animations
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'fade-out': 'fadeOut 0.2s ease-in-out',
        'slide-in': 'slideIn 0.2s ease-out',
        'slide-out': 'slideOut 0.2s ease-in',
        'scale-in': 'scaleIn 0.2s ease-out',
        'scale-out': 'scaleOut 0.2s ease-in',
        'bounce-in': 'bounceIn 0.6s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        // Custom keyframes
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideOut: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-10px)', opacity: '0' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      transitionTimingFunction: {
        // Custom easing functions
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'sharp': 'cubic-bezier(0.4, 0, 0.6, 1)',
      },
      zIndex: {
        // Custom z-index scale
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
        'toast': '1080',
      },
    },
  },
  plugins: [],
}

export default config
