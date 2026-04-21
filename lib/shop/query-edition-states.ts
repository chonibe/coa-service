import { createClient } from '@/lib/supabase/server'
import {
  getStreetNextPriceBump,
  getStreetPricingStageDisplay,
  streetSeasonFromTotalEditions,
} from '@/lib/shop/street-collector-pricing-stages'
import {
  EDITION_STATES_MAX_IDS_PER_REQUEST,
  type StreetEditionStatesRow,
} from '@/lib/shop/street-edition-states'

export type EditionStateItem = {
  productId: string
  editionsSold: number
  editionTotal: number | null
  season: 1 | 2
} & StreetEditionStatesRow

/**
 * Server-side edition ladder rows (same shape as GET /api/shop/edition-states).
 */
export async function queryEditionStatesByProductIds(
  numericIds: number[]
): Promise<EditionStateItem[]> {
  const unique = Array.from(
    new Set(numericIds.filter((n) => Number.isFinite(n) && n > 0))
  ).slice(0, EDITION_STATES_MAX_IDS_PER_REQUEST)

  if (unique.length === 0) return []

  const supabase = createClient()
  const { data: rows, error } = await supabase
    .from('products')
    .select('product_id, edition_counter, edition_size')
    .in('product_id', unique)

  if (error) {
    console.error('[queryEditionStatesByProductIds]', error)
    throw new Error(error.message || 'edition_states_query_failed')
  }

  return (rows || []).map((r) => {
    const productId = String(r.product_id ?? '')
    const sold = Math.max(0, Math.floor(Number(r.edition_counter ?? 0)))
    const totalParsed = r.edition_size != null ? parseInt(String(r.edition_size), 10) : NaN
    const editionTotal = Number.isFinite(totalParsed) ? totalParsed : null
    const season = streetSeasonFromTotalEditions(editionTotal ?? 90)
    const display = getStreetPricingStageDisplay(season, sold)
    const bump = getStreetNextPriceBump(season, sold)
    let nextBump: EditionStateItem['nextBump'] = null
    if (bump) {
      if (bump.kind === 'price_rise') {
        nextBump = {
          kind: 'price_rise',
          nextPriceUsd: bump.nextPriceUsd,
          afterSales: bump.salesUntilBump,
        }
      } else {
        nextBump = { kind: 'edition_end', afterSales: bump.salesUntilBump }
      }
    }
    return {
      productId,
      editionsSold: sold,
      editionTotal,
      season,
      stageKey: display.stageKey,
      label: display.label,
      priceUsd: display.priceUsd,
      subcopy: display.subcopy,
      nextBump,
    }
  })
}
