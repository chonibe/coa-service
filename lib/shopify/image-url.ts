/**
 * Resize Shopify CDN image URLs for faster loading.
 * Shopify CDN supports appending _WIDTHx or _WIDTHxHEIGHT before the file extension.
 * @see https://shopify.dev/docs/api/liquid/filters/image_url
 */
export function getShopifyImageUrl(
  url: string | null | undefined,
  width: number = 500
): string | undefined {
  if (!url || typeof url !== 'string') return undefined
  if (!url.includes('cdn.shopify.com')) return url
  // Skip if URL already has a size suffix (e.g. _400x.jpg)
  if (/\_\d+x\./.test(url)) return url
  try {
    const [base, ...queryParts] = url.split('?')
    const query = queryParts.length ? `?${queryParts.join('?')}` : ''
    const lastDot = base.lastIndexOf('.')
    if (lastDot === -1) return url
    const beforeExt = base.slice(0, lastDot)
    const ext = base.slice(lastDot)
    const resized = `${beforeExt}_${width}x${ext}`
    return `${resized}${query}`
  } catch {
    return url
  }
}
