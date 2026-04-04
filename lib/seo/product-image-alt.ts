/**
 * Rich default alt when Shopify image alt is empty (strategy template).
 */
export function buildProductImageAlt(
  productTitle: string,
  vendor: string | undefined,
  existingAlt: string | null | undefined
): string {
  const t = existingAlt?.trim()
  if (t) return t
  const v = vendor?.trim() || 'Artist'
  return `${productTitle} by ${v} — Limited edition street art print on vinyl`
}
