import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { normalizeShopifyProductId } from './shopify-product-id'

/**
 * Use `detailProductFull` only when it matches the open `detailProduct`.
 * Otherwise a previous sheet's full product can leak (wrong gallery / no video for lamp).
 */
export function resolveArtworkDetailProduct(
  detailProduct: ShopifyProduct | null | undefined,
  detailProductFull: ShopifyProduct | null | undefined
): ShopifyProduct | null {
  if (!detailProduct) return null
  if (!detailProductFull) return detailProduct
  const a = normalizeShopifyProductId(detailProduct.id)
  const b = normalizeShopifyProductId(detailProductFull.id)
  if (a && b && a === b) return detailProductFull
  return detailProduct
}
