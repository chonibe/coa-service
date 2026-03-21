/**
 * Normalize Shopify product id to numeric admin id string for storage and webhooks.
 */
export function normalizeShopifyProductId(id: string | null | undefined): string | null {
  if (id == null || id === '') return null
  const gidMatch = id.match(/\/Product\/(\d+)$/)
  if (gidMatch) return gidMatch[1]
  const digits = id.replace(/\D/g, '')
  return digits.length > 0 ? digits : id
}
