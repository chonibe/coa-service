/**
 * Design Tokens for Vendor Portal
 * 
 * Centralized design system tokens for consistent styling across the application.
 * These tokens extend Tailwind's default theme and provide semantic naming.
 */

export const designTokens = {
  // Spacing Scale (4px base unit)
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
  },

  // Typography Scale
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
      sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
      base: ['1rem', { lineHeight: '1.5rem' }],    // 16px
      lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
      xl: ['1.25rem', { lineHeight: '1.75rem' }],  // 20px
      '2xl': ['1.5rem', { lineHeight: '2rem' }],   // 24px
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  // Shadow Tokens for Elevation
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },

  // Semantic Colors (using CSS variables from globals.css)
  colors: {
    semantic: {
      success: 'hsl(142 76% 36%)',      // green-600
      successLight: 'hsl(142 71% 45%)', // green-500
      warning: 'hsl(38 92% 50%)',       // yellow-500
      error: 'hsl(0 84% 60%)',          // red-500
      info: 'hsl(217 91% 60%)',         // blue-500
    },
    status: {
      active: 'hsl(142 76% 36%)',       // green-600
      pending: 'hsl(38 92% 50%)',       // yellow-500
      completed: 'hsl(142 76% 36%)',    // green-600
      error: 'hsl(0 84% 60%)',          // red-500
      disabled: 'hsl(215 16% 47%)',     // gray-500
    },
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    full: '9999px',
  },

  // Transitions
  transitions: {
    fast: '150ms ease-in-out',
    normal: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },

  // Z-Index Scale
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
} as const

/**
 * Helper function to get spacing value
 */
export function getSpacing(size: keyof typeof designTokens.spacing): string {
  return designTokens.spacing[size]
}

/**
 * Helper function to get shadow value
 */
export function getShadow(size: keyof typeof designTokens.shadows): string {
  return designTokens.shadows[size]
}

/**
 * Helper function to get status color
 */
export function getStatusColor(status: keyof typeof designTokens.colors.status): string {
  return designTokens.colors.status[status]
}

