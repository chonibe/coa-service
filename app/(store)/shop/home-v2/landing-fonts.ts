import { Bebas_Neue, DM_Mono, Inter, Playfair_Display } from 'next/font/google'

/** Base UI — matches Google Fonts link: Inter 300/400/500 */
export const landingSans = Inter({
  subsets: ['latin'],
  variable: '--font-landing-sans',
  display: 'swap',
  weight: ['300', '400', '500'],
})

/** Headlines & editorial — Playfair + italics (matches `ital,wght@0,400;0,500;1,400;1,500`) */
export const landingSerif = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-landing-serif',
  display: 'swap',
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

/** Apply on the landing root wrapper (with `styles.page`) so CSS can use `var(--font-landing-*)`. */
export const landingFontVariables = [
  landingSans.variable,
  landingSerif.variable,
  landingDisplay.variable,
  landingMono.variable,
].join(' ')
