/**
 * Affiliate / artist tracking for the experience vendor filter.
 * Persists artist from URL params (artist, utm_campaign) so we can pre-select
 * the vendor filter when the user opens the experience.
 * Also persists the full affiliate URL / UTM params in session for tracking.
 */

export const AFFILIATE_ARTIST_STORAGE_KEY = 'sc_affiliate_artist'
/** Cookie name for affiliate artist (same value as sessionStorage key); 7-day expiry when set in middleware */
export const AFFILIATE_ARTIST_COOKIE_NAME = 'sc_affiliate_artist'

/** Session storage key for full affiliate URL / params (for tracking) */
export const AFFILIATE_SESSION_URL_KEY = 'sc_affiliate_session_url'
/** Cookie name for affiliate query string so server can attribute sessions (7-day when set in middleware) */
export const AFFILIATE_SESSION_COOKIE_NAME = 'sc_affiliate_session'
const AFFILIATE_SESSION_COOKIE_MAX_LENGTH = 600

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

/** Affiliate session data saved for tracking (URL + UTM params) */
export type AffiliateSessionData = {
  /** Full landing URL including query (affiliate link the user came from) */
  landingUrl: string
  artist?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
}

/**
 * Persist full affiliate URL and params to sessionStorage so it can be used for tracking.
 * Call when the user lands with artist/UTM params.
 */
export function setStoredAffiliateSession(data: AffiliateSessionData): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(AFFILIATE_SESSION_URL_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

/**
 * Read stored affiliate session (landing URL + params) from sessionStorage (client-only).
 */
export function getStoredAffiliateSession(): AffiliateSessionData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(AFFILIATE_SESSION_URL_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as AffiliateSessionData
    return data?.landingUrl ? data : null
  } catch {
    return null
  }
}

/**
 * Clear affiliate tracking from session and cookies so the next load/refresh
 * does not re-apply the affiliate filter or spotlight. Call when the user
 * removes the affiliate artist from the filter.
 */
export function clearAffiliateTracking(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(AFFILIATE_ARTIST_STORAGE_KEY)
    sessionStorage.removeItem(AFFILIATE_SESSION_URL_KEY)
    document.cookie = `${AFFILIATE_ARTIST_COOKIE_NAME}=; path=/; max-age=0`
    document.cookie = `${AFFILIATE_SESSION_COOKIE_NAME}=; path=/; max-age=0`
  } catch {
    // ignore
  }
}

/**
 * Build affiliate query string for cookie (server-side). Truncated to stay within cookie size.
 */
export function buildAffiliateQueryString(params: {
  artist?: string | null
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  utm_content?: string | null
}): string {
  const search = new URLSearchParams()
  if (params.artist) search.set('artist', params.artist)
  if (params.utm_source) search.set('utm_source', params.utm_source)
  if (params.utm_medium) search.set('utm_medium', params.utm_medium)
  if (params.utm_campaign) search.set('utm_campaign', params.utm_campaign)
  if (params.utm_content) search.set('utm_content', params.utm_content)
  const str = search.toString()
  return str.length > AFFILIATE_SESSION_COOKIE_MAX_LENGTH
    ? str.slice(0, AFFILIATE_SESSION_COOKIE_MAX_LENGTH)
    : str
}
