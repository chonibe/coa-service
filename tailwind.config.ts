import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1600px", // Impact theme page width
      },
    },
    // Impact theme breakpoints
    screens: {
      'sm': '700px',   // Impact theme tablet
      'md': '1000px',  // Impact theme medium desktop
      'lg': '1150px',  // Impact theme large desktop
      'xl': '1400px',  // Impact theme extra large
      '2xl': '1600px', // Impact theme max width
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-barlow)", "system-ui", "sans-serif"],
        serif: ["var(--font-fraunces)", "serif"],
        heading: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-barlow)", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Impact Theme Colors
        'impact': {
          'bg': '#ffffff',
          'text': '#1a1a1a',
          'header-bg': '#390000',
          'header-text': '#ffba94',
          'footer-bg': '#390000',
          'footer-text': '#ffba94',
          'primary': '#2c4bce',
          'primary-text': '#ffffff',
          'secondary': '#f0c417',
          'secondary-text': '#1a1a1a',
          'success': '#00a341',
          'warning': '#ffb74a',
          'error': '#f83a3a',
          'on-sale': '#f83a3a',
          'sold-out': '#000000',
          'badge': '#803cee',
          'checkout-accent': '#f0c417',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Impact theme border radius
        'impact-button': '60px',
        'impact-input': '8px',
        'impact-block': '24px',
        'impact-block-sm': '12px',
        'impact-block-xs': '6px',
      },
      // Impact theme font sizes (for 'large' heading setting)
      fontSize: {
        // Mobile sizes
        'impact-h0': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'impact-h1': ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'impact-h2': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'impact-h3': ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'impact-h4': ['1.375rem', { lineHeight: '1.3', letterSpacing: '-0.02em' }],
        'impact-h5': ['1.125rem', { lineHeight: '1.4', letterSpacing: '-0.02em' }],
        'impact-h6': ['1rem', { lineHeight: '1.5', letterSpacing: '-0.02em' }],
        // Desktop overrides (apply with responsive prefix)
        'impact-h0-lg': ['5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'impact-h1-lg': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'impact-h2-lg': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'impact-h3-lg': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'impact-h4-lg': ['2rem', { lineHeight: '1.3', letterSpacing: '-0.02em' }],
        'impact-h5-lg': ['1.5rem', { lineHeight: '1.4', letterSpacing: '-0.02em' }],
        'impact-h6-lg': ['1.25rem', { lineHeight: '1.5', letterSpacing: '-0.02em' }],
      },
      // Impact theme shadows
      boxShadow: {
        'impact-block': '0 18px 30px rgba(26, 26, 26, 0.1)',
        'impact-sm': '0 2px 8px rgba(26, 26, 26, 0.1)',
        'impact-md': '0 5px 15px rgba(26, 26, 26, 0.1)',
        'impact-lg': '0 5px 30px rgba(26, 26, 26, 0.1)',
      },
      // Impact theme max widths
      maxWidth: {
        'impact': '1600px',
        'impact-narrow': '1350px',
      },
      // Impact theme spacing (section spacing for 'medium' setting)
      spacing: {
        'impact-section': '3rem',      // Mobile
        'impact-section-md': '4rem',   // Tablet
        'impact-section-lg': '4.5rem', // Desktop
        'impact-section-xl': '6rem',   // Large desktop
        'impact-gutter': '1.25rem',    // Mobile gutter (20px)
        'impact-gutter-md': '2rem',    // Tablet gutter (32px)
        'impact-gutter-lg': '3rem',    // Desktop gutter (48px)
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      perspective: {
        '1000': '1000px',
      },
      // Mobile-first touch target sizes
      height: {
        '12': '3rem',    // 48px - minimum touch target
        '14': '3.5rem',  // 56px - comfortable mobile button
      },
      minHeight: {
        '44': '2.75rem', // 44px - iOS minimum
        '48': '3rem',    // 48px - Android minimum
      },
      // Safe area utilities
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // Scrollbar hide utility
    function({ addUtilities }: any) {
      addUtilities({
        '.scrollbar-hide': {
          /* IE and Edge */
          '-ms-overflow-style': 'none',
          /* Firefox */
          'scrollbar-width': 'none',
          /* Safari and Chrome */
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        },
        '.touch-pan-x': {
          'touch-action': 'pan-x'
        },
        '.touch-pan-y': {
          'touch-action': 'pan-y'
        }
      })
    }
  ],
}

export default config
