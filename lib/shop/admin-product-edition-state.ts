import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from '@/lib/env'
import { extractEditionSize } from '@/lib/shopify/product-description-generator'
import {
  buildEditionMetrics,
  getEditionStageKey,
  type EditionStageKey,
} from '@/lib/shop/edition-stages'

export type AdminProductEditionState = {
  shopifyProductId: string
  totalEditions: number
  quantityAvailable: number
  editionSold: number
  stage: EditionStageKey
}

/**
 * Fetches product from Shopify Admin REST API and derives edition stage from inventory + edition_size metafield.
 */
export async function fetchAdminProductEditionState(
  productId: string
): Promise<AdminProductEditionState | null> {
  if (!SHOPIFY_SHOP || !SHOPIFY_ACCESS_TOKEN) {
    console.warn('[admin-product-edition-state] Shopify not configured')
    return null
  }
  const url = `https://${SHOPIFY_SHOP}/admin/api/2024-01/products/${productId}.json`
  const res = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    console.error('[admin-product-edition-state] Shopify error:', res.status)
    return null
  }
  const data = await res.json()
  const product = data?.product
  if (!product) return null

  let metafields = product.metafields ?? []
  if (!Array.isArray(metafields) || metafields.length === 0) {
    const mfRes = await fetch(
      `https://${SHOPIFY_SHOP}/admin/api/2024-01/products/${productId}/metafields.json`,
      {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json',
        },
      }
    )
    if (mfRes.ok) {
      const mfJson = await mfRes.json()
      metafields = mfJson.metafields ?? []
    }
  }
  const editionRaw = extractEditionSize(metafields)
  const totalEditions = editionRaw != null ? parseInt(String(editionRaw), 10) : NaN
  if (!Number.isFinite(totalEditions) || totalEditions < 2) return null

  const variants = product.variants ?? []
  const totalFromVariants = variants.reduce(
    (sum: number, v: { inventory_quantity?: number }) => sum + (v.inventory_quantity ?? 0),
    0
  )
  const hasVariantInventoryData = variants.some(
    (v: { inventory_quantity?: number }) => typeof v.inventory_quantity === 'number'
  )
  let quantityAvailable: number | null = hasVariantInventoryData ? totalFromVariants : null

  if (quantityAvailable === null && variants.length > 0) {
    const inventoryItemIds = variants
      .map((v: { inventory_item_id?: number }) => v.inventory_item_id)
      .filter((id: unknown): id is number => typeof id === 'number')
    if (inventoryItemIds.length > 0) {
      const levelsUrl = `https://${SHOPIFY_SHOP}/admin/api/2024-01/inventory_levels.json?inventory_item_ids=${inventoryItemIds.join(',')}`
      const levelsRes = await fetch(levelsUrl, {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json',
        },
      })
      if (levelsRes.ok) {
        const levelsData = await levelsRes.json()
        const levels = levelsData?.inventory_levels ?? []
        quantityAvailable = levels.reduce(
          (sum: number, l: { available?: number; inventory_quantity?: number }) =>
            sum + (l.available ?? l.inventory_quantity ?? 0),
          0
        )
      }
    }
  }

  if (typeof quantityAvailable !== 'number') return null

  const metrics = buildEditionMetrics(totalEditions, quantityAvailable)
  const stage = getEditionStageKey(metrics.editionNumberSold, metrics.totalEditions)
  if (!stage) return null

  return {
    shopifyProductId: String(product.id),
    totalEditions: metrics.totalEditions,
    quantityAvailable,
    editionSold: metrics.editionNumberSold,
    stage,
  }
}
