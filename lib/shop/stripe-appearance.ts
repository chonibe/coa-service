function readExperienceVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

/** Card setup / Payment Element — reads live `--experience-*` tokens from globals.css */
export function getStripeCardAppearance(isDark: boolean) {
  return {
    theme: 'stripe',
    variables: {
      borderRadius: '8px',
      colorPrimary: readExperienceVar('--experience-text', isDark ? '#ebe8e8' : '#1c1c1e'),
      colorBackground: readExperienceVar('--experience-bg', isDark ? '#171515' : '#ffffff'),
      colorText: readExperienceVar('--experience-text', isDark ? '#ebe8e8' : '#1c1c1e'),
      colorTextSecondary: readExperienceVar('--experience-text-muted', isDark ? '#a09c9c' : '#71717a'),
      colorDanger: isDark ? '#f87171' : '#dc2626',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      spacingUnit: '4px',
    },
  }
}

/** Checkout session Payment Element — PayPal blue primary, experience surfaces for chrome */
export function getStripeCheckoutAppearance(isDark: boolean) {
  const surface = readExperienceVar('--experience-surface-3', isDark ? '#262222' : '#ffffff')
  const overlay = readExperienceVar('--experience-overlay', isDark ? '#2c2828' : '#f4f4f5')

  return {
    theme: 'stripe',
    variables: {
      borderRadius: '4px',
      colorPrimary: '#0070ba',
      colorBackground: surface,
      colorText: readExperienceVar('--experience-text', isDark ? '#ebe8e8' : '#1c1c1e'),
      colorTextSecondary: readExperienceVar('--experience-text-muted', isDark ? '#a09c9c' : '#71717a'),
      colorDanger: isDark ? '#f87171' : '#dc2626',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      spacingUnit: '4px',
      buttonColorBackground: '#0070ba',
      accessibleColorOnColorPrimary: '#ffffff',
    },
    rules: {
      '.Tab': {
        borderRadius: '4px',
        padding: '14px 16px',
        ...(isDark ? { backgroundColor: overlay } : {}),
      },
      '.Tab--selected': {
        borderColor: '#0070ba',
        boxShadow: '0 0 0 2px #0070ba',
      },
      ...(isDark
        ? {
            '.Block': {
              backgroundColor: surface,
            },
          }
        : {}),
    },
  }
}
