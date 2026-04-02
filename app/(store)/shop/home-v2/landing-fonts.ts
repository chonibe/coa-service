import { Bebas_Neue, DM_Mono, Playfair_Display } from 'next/font/google'

/**
 * Street Collector dark pages — matches
 * `artist-profile.html` / landing-page.html Google Fonts:
 * Playfair Display (400/500/700 + italic), DM Mono (300/400/500), Bebas Neue.
 */
export const landingSerif = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-landing-serif',
  display: 'swap',
  weight: ['400', '500', '700'],
  style: ['normal', 'italic'],
})

/** Stat numbers, big numerals — matches original `--display` */
export const landingDisplay = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-landing-display',
  display: 'swap',
})

/** Eyebrows, labels, CTAs — matches original `--mono` */
export const landingMono = DM_Mono({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  variable: '--font-landing-mono',
  display: 'swap',
})

/** Apply on the page root wrapper so CSS can use `var(--font-landing-*)`. */
export const landingFontVariables = [
  landingSerif.variable,
  landingDisplay.variable,
  landingMono.variable,
].join(' ')
