/**
 * Single canonical origin for metadata, sitemap, and Open Graph URLs.
 * Prefer NEXT_PUBLIC_SITE_URL; fall back to NEXT_PUBLIC_APP_URL; default production www host.
 */
const DEFAULT_CANONICAL = 'https://www.thestreetcollector.com'

export function getCanonicalSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    DEFAULT_CANONICAL
  return raw.replace(/\/$/, '')
}

export function getCanonicalSiteOrigin(): URL {
  try {
    return new URL(getCanonicalSiteUrl())
  } catch {
    return new URL(DEFAULT_CANONICAL)
  }
}

/** Absolute URL for a pathname (leading slash required on path). */
export function absoluteShopUrl(pathname: string): string {
  const base = getCanonicalSiteUrl()
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${base}${path}`
}
