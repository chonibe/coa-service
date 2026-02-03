/**
 * Impact Theme Design Tokens
 * 
 * Extracted from Shopify Impact theme (v6.11.2) settings_data.json
 * These tokens ensure pixel-perfect visual fidelity when migrating
 * the storefront to Next.js.
 * 
 * @see https://themes.shopify.com/themes/impact
 */

// =============================================================================
// COLOR TOKENS
// =============================================================================

export const colors = {
  // Brand Colors
  background: '#ffffff',
  text: '#1a1a1a',
  
  // Header & Footer
  headerBackground: '#390000',
  headerText: '#ffba94',
  footerBackground: '#390000',
  footerText: '#ffba94',
  
  // Button Colors
  primaryButton: '#2c4bce',
  primaryButtonText: '#ffffff',
  secondaryButton: '#f0c417',
  secondaryButtonText: '#1a1a1a',
  
  // Status Colors
  success: '#00a341',
  warning: '#ffb74a',
  error: '#f83a3a',
  
  // Product Colors
  onSaleAccent: '#f83a3a',
  soldOutBadge: '#000000',
  primaryBadge: '#803cee',
  productCardBackground: 'transparent',
  productCardText: '#1a1a1a',
  
  // Checkout
  checkoutAccent: '#f0c417',
  checkoutButton: '#1a1a1a',
  
  // Dialog
  dialogBackground: '#ffffff',
} as const

// RGB versions for opacity support
export const colorsRGB = {
  background: '255 255 255',
  text: '26 26 26',
  headerBackground: '57 0 0',
  headerText: '255 186 148',
  footerBackground: '57 0 0',
  footerText: '255 186 148',
  primaryButton: '44 75 206',
  primaryButtonText: '255 255 255',
  secondaryButton: '240 196 23',
  secondaryButtonText: '26 26 26',
  success: '0 163 65',
  warning: '255 183 74',
  error: '248 58 58',
  onSaleAccent: '248 58 58',
  soldOutBadge: '0 0 0',
  primaryBadge: '128 60 238',
} as const

// =============================================================================
// TYPOGRAPHY TOKENS
// =============================================================================

export const typography = {
  // Font Families
  headingFont: 'Fraunces',
  headingFontFallback: 'serif',
  textFont: 'Barlow',
  textFontFallback: 'system-ui, sans-serif',
  
  // Font Settings
  headingFontSize: 'large', // Options: small, medium, large
  headingTextTransform: 'normal',
  headingLetterSpacing: -0.02, // -2 / 100 = -0.02em
  textFontSizeDesktop: 16,
  textFontSizeMobile: 14,
  
  // Font Weights (from Google Fonts config)
  headingWeight: 400,
  textWeight: 400,
} as const

// Font size scale for 'large' heading size setting
export const fontSizes = {
  // Mobile sizes
  mobile: {
    h0: '3rem',      // 48px
    h1: '2.5rem',    // 40px
    h2: '2rem',      // 32px
    h3: '1.5rem',    // 24px
    h4: '1.375rem',  // 22px
    h5: '1.125rem',  // 18px
    h6: '1rem',      // 16px
    xs: '0.6875rem', // 11px (14 - 3)
    sm: '0.75rem',   // 12px (14 - 2)
    base: '0.875rem',// 14px
    lg: '1.125rem',  // 18px (14 + 4)
  },
  // Tablet/Desktop sizes (700px+)
  tablet: {
    h0: '4rem',      // 64px
    h1: '3rem',      // 48px
    h2: '2.5rem',    // 40px
    h3: '2rem',      // 32px
    h4: '1.625rem',  // 26px
    h5: '1.25rem',   // 20px
    h6: '1.125rem',  // 18px
    xs: '0.75rem',   // 12px (16 - 4)
    sm: '0.875rem',  // 14px (16 - 2)
    base: '1rem',    // 16px
    lg: '1.25rem',   // 20px (16 + 4)
  },
  // Large desktop sizes (1400px+)
  desktop: {
    h0: '5rem',      // 80px
    h1: '3.75rem',   // 60px
    h2: '3rem',      // 48px
    h3: '2.25rem',   // 36px
    h4: '2rem',      // 32px
    h5: '1.5rem',    // 24px
    h6: '1.25rem',   // 20px
  },
} as const

// =============================================================================
// LAYOUT TOKENS
// =============================================================================

export const layout = {
  // Container
  pageWidth: 1600,
  pageWidthNarrow: 1350, // pageWidth - 250
  containerGutterMobile: 20,  // --spacing-5 = 1.25rem = 20px
  containerGutterTablet: 32,  // 2rem = 32px
  containerGutterDesktop: 48, // --spacing-12 = 3rem = 48px
  
  // Section Spacing (for 'medium' setting)
  sectionVerticalSpacing: 'medium',
  sectionBoxedHorizontalSpacing: 'medium',
} as const

// Section outer spacing by breakpoint (for 'medium' setting)
export const sectionSpacing = {
  // Outer vertical spacing (py)
  outerMobile: '3rem',      // 48px - --spacing-12
  outerTablet: '4rem',      // 64px - --spacing-16
  outerDesktop: '4.5rem',   // 72px - --spacing-18
  outerLarge: '5rem',       // 80px - --spacing-20
  outerXLarge: '6rem',      // 96px - --spacing-24
  
  // Inner max spacing (gap between elements)
  innerMobile: '2rem',      // 32px - --spacing-8
  innerTablet: '3rem',      // 48px - --spacing-12
  innerDesktop: '4rem',     // 64px - --spacing-16
  innerLarge: '4.5rem',     // 72px - --spacing-18
  
  // Stack spacing (between stacked sections)
  stackMobile: '2rem',      // 32px
  stackTablet: '3rem',      // 48px
} as const

// =============================================================================
// BORDER RADIUS TOKENS
// =============================================================================

export const borderRadius = {
  // From theme settings
  button: 60,      // button_border_radius: 60 -> completely rounded
  input: 8,        // input_border_radius: 8
  block: 24,       // block_border_radius: 24
  
  // Derived values
  blockSm: 12,     // block / 2
  blockXs: 6,      // block / 4
  full: 9999,
} as const

// =============================================================================
// SHADOW TOKENS
// =============================================================================

export const shadows = {
  // From theme settings
  opacity: 10, // 10% = 0.1
  verticalOffset: 18,
  horizontalOffset: 0,
  blur: 30, // block_shadow_blur default
  
  // Computed shadow values
  block: `0 18px 30px rgba(26, 26, 26, 0.1)`,
  sm: `0 2px 8px rgba(26, 26, 26, 0.1)`,
  md: `0 5px 15px rgba(26, 26, 26, 0.1)`,
  lg: `0 5px 30px rgba(26, 26, 26, 0.1)`,
} as const

// =============================================================================
// SPACING SCALE (Tailwind-inspired from Impact theme)
// =============================================================================

export const spacing = {
  '0-5': '0.125rem',  // 2px
  '1': '0.25rem',     // 4px
  '1-5': '0.375rem',  // 6px
  '2': '0.5rem',      // 8px
  '2-5': '0.625rem',  // 10px
  '3': '0.75rem',     // 12px
  '3-5': '0.875rem',  // 14px
  '4': '1rem',        // 16px
  '4-5': '1.125rem',  // 18px
  '5': '1.25rem',     // 20px
  '5-5': '1.375rem',  // 22px
  '6': '1.5rem',      // 24px
  '6-5': '1.625rem',  // 26px
  '7': '1.75rem',     // 28px
  '7-5': '1.875rem',  // 30px
  '8': '2rem',        // 32px
  '8-5': '2.125rem',  // 34px
  '9': '2.25rem',     // 36px
  '9-5': '2.375rem',  // 38px
  '10': '2.5rem',     // 40px
  '11': '2.75rem',    // 44px
  '12': '3rem',       // 48px
  '14': '3.5rem',     // 56px
  '16': '4rem',       // 64px
  '18': '4.5rem',     // 72px
  '20': '5rem',       // 80px
  '24': '6rem',       // 96px
  '28': '7rem',       // 112px
  '32': '8rem',       // 128px
  '36': '9rem',       // 144px
  '40': '10rem',      // 160px
  '44': '11rem',      // 176px
  '48': '12rem',      // 192px
  '52': '13rem',      // 208px
  '56': '14rem',      // 224px
  '60': '15rem',      // 240px
  '64': '16rem',      // 256px
  '72': '18rem',      // 288px
  '80': '20rem',      // 320px
  '96': '24rem',      // 384px
} as const

// =============================================================================
// BREAKPOINTS (Impact theme specific)
// =============================================================================

export const breakpoints = {
  sm: '700px',   // Impact theme tablet breakpoint
  md: '1000px',  // Impact theme medium desktop
  lg: '1150px',  // Impact theme large desktop
  xl: '1400px',  // Impact theme extra large
  '2xl': '1600px', // Impact theme max width
} as const

// =============================================================================
// ANIMATION TOKENS
// =============================================================================

export const animation = {
  // Button hover effect
  buttonHoverEffect: 'fade', // Options: fade, reverse
  buttonHoverOpacity: 0.85,
  
  // Heading apparition
  headingApparition: 'split_fade', // Options: none, fade, split_fade, split_rotation
  
  // Product stagger
  staggerProductsApparition: true,
  
  // Transitions
  transitionFast: '150ms ease-in-out',
  transitionNormal: '200ms ease-in-out',
  transitionSlow: '300ms ease-in-out',
} as const

// =============================================================================
// PRODUCT DISPLAY TOKENS
// =============================================================================

export const productDisplay = {
  colorDisplayStyle: 'swatch', // Options: color, variant, swatch
  colorSwatchStyle: 'round',   // Options: round, rectangle
  productInfoAlignment: 'center', // Options: start, center
  showVendor: true,
} as const

// =============================================================================
// CART TOKENS
// =============================================================================

export const cart = {
  cartType: 'popover', // Options: drawer, popover, page
  cartIcon: 'shopping_basket', // Options: bag, cart, shopping_basket, tote_bag
  showFreeShippingThreshold: false,
} as const

// =============================================================================
// SOCIAL LINKS
// =============================================================================

export const socialLinks = {
  facebook: 'https://www.facebook.com/st.lamps',
  instagram: 'https://www.instagram.com/streetcollector_/',
} as const

// =============================================================================
// COMBINED THEME EXPORT
// =============================================================================

export const impactTheme = {
  colors,
  colorsRGB,
  typography,
  fontSizes,
  layout,
  sectionSpacing,
  borderRadius,
  shadows,
  spacing,
  breakpoints,
  animation,
  productDisplay,
  cart,
  socialLinks,
} as const

export type ImpactTheme = typeof impactTheme

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get CSS custom property string for a color
 */
export function getColorVar(colorKey: keyof typeof colors): string {
  return `var(--impact-${colorKey})`
}

/**
 * Get spacing value
 */
export function getSpacing(size: keyof typeof spacing): string {
  return spacing[size]
}

/**
 * Get border radius in pixels
 */
export function getBorderRadius(type: keyof typeof borderRadius): number {
  return borderRadius[type]
}

/**
 * Get shadow CSS value
 */
export function getShadow(type: keyof typeof shadows): string {
  const value = shadows[type]
  return typeof value === 'string' ? value : ''
}

export default impactTheme
