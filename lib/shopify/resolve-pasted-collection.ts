import { fetchShopifyCollectionRestByHandle, fetchShopifyCollectionRestById, type RestCollectionRow } from '@/lib/shopify/fetch-collection-rest-by-id'
import { parseShopifyCollectionReference } from '@/lib/shopify/parse-shopify-collection-url'

/**
 * Resolve a pasted Admin URL, storefront /collections/handle URL, or raw id to REST collection row.
 */
export async function resolveShopifyCollectionFromPastedInput(input: string): Promise<RestCollectionRow | null> {
  const ref = parseShopifyCollectionReference(input)
  if (!ref) return null
  if (ref.kind === 'id') return fetchShopifyCollectionRestById(ref.id)
  return fetchShopifyCollectionRestByHandle(ref.handle)
}

export type { RestCollectionRow }
