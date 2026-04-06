/**
 * Extract a Shopify Admin numeric collection id or a storefront collection handle from pasted URLs or raw input.
 *
 * Supported:
 * - https://admin.shopify.com/store/my-store/collections/686811218306
 * - https://{shop}.myshopify.com/admin/collections/686811218306
 * - Raw digits: 686811218306
 * - Storefront: https://example.com/collections/saturn-png → handle only
 */

export type ParsedCollectionRef =
  | { kind: 'id'; id: string }
  | { kind: 'handle'; handle: string }

const ADMIN_COLLECTION_ID = /\/collections\/(\d+)(?:\?|$|\/)/i

export function parseShopifyCollectionReference(input: string): ParsedCollectionRef | null {
  const raw = input.trim()
  if (!raw) return null

  if (/^\d+$/.test(raw)) {
    return { kind: 'id', id: raw }
  }

  try {
    const u = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
    const path = u.pathname

    const adminMatch = path.match(ADMIN_COLLECTION_ID)
    if (adminMatch) {
      return { kind: 'id', id: adminMatch[1] }
    }

    const storefront = path.match(/\/collections\/([^/?#]+)/i)
    if (storefront?.[1]) {
      const handle = decodeURIComponent(storefront[1]).trim()
      if (handle) return { kind: 'handle', handle }
    }
  } catch {
    const fallback = raw.match(ADMIN_COLLECTION_ID)
    if (fallback) return { kind: 'id', id: fallback[1] }
  }

  return null
}
