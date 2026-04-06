import type { SupabaseClient } from '@supabase/supabase-js'
import {
  getStreetPricingStageDisplay,
  streetSeasonFromTotalEditions,
} from '@/lib/shop/street-collector-pricing-stages'

/**
 * Load current Street ladder buy-now USD per product from `products` (edition_counter / edition_size).
 * Keys are numeric Shopify product id strings, matching `/api/shop/edition-states`.
 */
export async function fetchStreetLadderUsdByNumericProductIds(
  supabase: SupabaseClient,
  idStrings: string[]
): Promise<Record<string, number>> {
  const numericIds = Array.from(
    new Set(
      idStrings
        .map((s) => parseInt(String(s).replace(/\D/g, ''), 10))
        .filter((n) => Number.isFinite(n) && n > 0)
    )
  )
  if (numericIds.length === 0) return {}

  const { data: rows, error } = await supabase
    .from('products')
    .select('product_id, edition_counter, edition_size')
    .in('product_id', numericIds)

  if (error || !rows?.length) return {}

  const out: Record<string, number> = {}
  for (const r of rows) {
    const productId = String(r.product_id ?? '')
    const sold = Math.max(0, Math.floor(Number(r.edition_counter ?? 0)))
    const totalParsed = r.edition_size != null ? parseInt(String(r.edition_size), 10) : NaN
    const editionTotal = Number.isFinite(totalParsed) ? totalParsed : null
    const season = streetSeasonFromTotalEditions(editionTotal ?? 90)
    const display = getStreetPricingStageDisplay(season, sold)
    if (display.priceUsd != null && display.priceUsd > 0) {
      out[productId] = display.priceUsd
    }
  }
  return out
}
