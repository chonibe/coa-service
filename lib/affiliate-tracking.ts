/**
 * Affiliate / artist tracking for the experience vendor filter.
 * Persists artist from URL params (artist, utm_campaign) so we can pre-select
 * the vendor filter when the user opens the experience.
 */

export const AFFILIATE_ARTIST_STORAGE_KEY = 'sc_affiliate_artist'
/** Cookie name for affiliate artist (same value as sessionStorage key); 7-day expiry when set in middleware */
export const AFFILIATE_ARTIST_COOKIE_NAME = 'sc_affiliate_artist'

/**
 * Parse artist slug from utm_campaign (e.g. "artist_kymo" -> "kymo").
 */
export function parseArtistSlugFromUtmCampaign(utmCampaign: string | null | undefined): string | undefined {
  if (!utmCampaign?.trim()) return undefined
  const trimmed = utmCampaign.trim()
  if (trimmed.toLowerCase().startsWith('artist_')) {
    return trimmed.slice(7).trim() || undefined
  }
  return undefined
}

/**
 * Get affiliate artist slug from search params (artist or utm_campaign).
 */
export function getAffiliateArtistSlugFromSearchParams(params: {
  artist?: string | null
  utm_campaign?: string | null
}): string | undefined {
  const artist = params.artist?.trim()
  if (artist) return artist
  return parseArtistSlugFromUtmCampaign(params.utm_campaign ?? undefined)
}

/**
 * Persist affiliate artist slug to sessionStorage (client-only).
 */
export function setStoredAffiliateArtist(slug: string): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(AFFILIATE_ARTIST_STORAGE_KEY, slug)
  } catch {
    // ignore
  }
}

/**
 * Read stored affiliate artist slug from sessionStorage (client-only).
 */
export function getStoredAffiliateArtist(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return sessionStorage.getItem(AFFILIATE_ARTIST_STORAGE_KEY)
  } catch {
    return null
  }
}
