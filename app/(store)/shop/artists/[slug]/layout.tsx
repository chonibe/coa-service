import { landingFontVariables } from '../../home-v2/landing-fonts'

/** Injects Playfair Display, DM Mono, Bebas Neue (see `landing-fonts.ts` — artist-profile.html stack). */
export default function ArtistSlugLayout({ children }: { children: React.ReactNode }) {
  return <div className={landingFontVariables}>{children}</div>
}
