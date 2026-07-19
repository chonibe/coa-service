import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { normalizeShopifyProductId } from '@/lib/shop/shopify-product-id'

/** Persists the last previewed artwork on Experience (independent of cart). */
export const EXPERIENCE_LAST_VIEWED_ARTWORK_KEY = 'sc-experience-last-viewed-artwork'

export type ExperienceLastViewedArtwork = {
  productId: string
  handle?: string
}

export function loadLastViewedArtwork(): ExperienceLastViewedArtwork | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(EXPERIENCE_LAST_VIEWED_ARTWORK_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const productId = typeof parsed.productId === 'string' ? parsed.productId.trim() : ''
    if (!productId) return null
    const handle = typeof parsed.handle === 'string' ? parsed.handle.trim() : undefined
    return { productId, handle: handle || undefined }
  } catch {
    return null
  }
}

export function saveLastViewedArtwork(product: Pick<ShopifyProduct, 'id' | 'handle'> | null): void {
  if (typeof window === 'undefined') return
  try {
    if (!product?.id) {
      localStorage.removeItem(EXPERIENCE_LAST_VIEWED_ARTWORK_KEY)
      return
    }
    const productId = normalizeShopifyProductId(product.id) ?? product.id
    const handle = product.handle?.trim() || undefined
    localStorage.setItem(
      EXPERIENCE_LAST_VIEWED_ARTWORK_KEY,
      JSON.stringify({ productId, handle } satisfies ExperienceLastViewedArtwork)
    )
  } catch {
    // ignore quota / private mode
  }
}

/**
 * Resolve a saved last-viewed record against loaded product pools
 * (by normalized id, then handle).
 */
export function findProductByLastViewed(
  lastViewed: ExperienceLastViewedArtwork | null | undefined,
  pools: Array<ShopifyProduct[] | null | undefined>
): ShopifyProduct | null {
  if (!lastViewed?.productId && !lastViewed?.handle) return null
  const targetId = normalizeShopifyProductId(lastViewed.productId) ?? lastViewed.productId
  const targetHandle = lastViewed.handle?.trim().toLowerCase()

  for (const pool of pools) {
    if (!pool?.length) continue
    for (const product of pool) {
      const id = normalizeShopifyProductId(product.id) ?? product.id
      if (targetId && id === targetId) return product
    }
  }

  if (targetHandle) {
    for (const pool of pools) {
      if (!pool?.length) continue
      for (const product of pool) {
        if (product.handle?.trim().toLowerCase() === targetHandle) return product
      }
    }
  }

  return null
}
