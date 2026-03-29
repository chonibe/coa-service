import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
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

export const dynamic = 'force-dynamic'

type EditionStateRow = {
  productId: string
  editionsSold: number
  editionTotal: number | null
  season: 1 | 2
} & StreetEditionStatesRow

/**
 * GET /api/shop/edition-states?ids=123,456
 * Public read: sold counts + Street Collector ladder copy from `products` (edition_counter, edition_size).
 */
export async function GET(request: NextRequest) {
  try {
    const raw = request.nextUrl.searchParams.get('ids') || ''
    const parts = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const numericIds = Array.from(
      new Set(
        parts
          .map((p) => parseInt(p.replace(/\D/g, ''), 10))
          .filter((n) => Number.isFinite(n) && n > 0)
      )
    ).slice(0, EDITION_STATES_MAX_IDS_PER_REQUEST)

    if (numericIds.length === 0) {
      return NextResponse.json({ items: [] as EditionStateRow[] })
    }

    const supabase = createClient()
    const { data: rows, error } = await supabase
      .from('products')
      .select('product_id, edition_counter, edition_size')
      .in('product_id', numericIds)

    if (error) {
      console.error('[edition-states]', error)
      return NextResponse.json({ error: 'Failed to load edition state' }, { status: 500 })
    }

    const items: EditionStateRow[] = (rows || []).map((r) => {
      const productId = String(r.product_id ?? '')
      const sold = Math.max(0, Math.floor(Number(r.edition_counter ?? 0)))
      const totalParsed = r.edition_size != null ? parseInt(String(r.edition_size), 10) : NaN
      const editionTotal = Number.isFinite(totalParsed) ? totalParsed : null
      const season = streetSeasonFromTotalEditions(editionTotal ?? 90)
      const display = getStreetPricingStageDisplay(season, sold)
      const bump = getStreetNextPriceBump(season, sold)
      let nextBump: EditionStateRow['nextBump'] = null
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
        label: display.label,
        priceUsd: display.priceUsd,
        subcopy: display.subcopy,
        nextBump,
      }
    })

    return NextResponse.json({ items })
  } catch (e) {
    console.error('[edition-states]', e)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
