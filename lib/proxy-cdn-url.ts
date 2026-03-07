/**
 * Proxies CDN image URLs through our API so the browser never hits
 * thestreetcollector.com directly (avoids ERR_SSL_PROTOCOL_ERROR / ERR_HTTP2_SERVER_REFUSED_STREAM).
 * Use for any image URL from the store CDN when rendering in the app.
 */

const STORE_CDN_ORIGIN = 'https://thestreetcollector.com'

export function getProxiedImageUrl(url: string | undefined | null): string {
  if (typeof url !== 'string' || !url.trim()) return ''
  if (!url.startsWith(STORE_CDN_ORIGIN + '/')) return url
  return `/api/proxy-image?url=${encodeURIComponent(url)}`
}
