/**
 * Proxies CDN image URLs through our API so the browser never hits third-party
 * origins directly (avoids third-party cookies, CORS, and SSL issues).
 * Use for any image/poster URL from the store or Shopify CDN when rendering in the app.
 */

const PROXY_ORIGINS = [
  'https://thestreetcollector.com',
  'https://cdn.shopify.com',
  'https://shopify.com',
]

export function getProxiedImageUrl(url: string | undefined | null): string {
  if (typeof url !== 'string' || !url.trim()) return ''
  const shouldProxy = PROXY_ORIGINS.some((origin) => url.startsWith(origin + '/'))
  if (!shouldProxy) return url
  return `/api/proxy-image?url=${encodeURIComponent(url)}`
}
