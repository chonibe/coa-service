import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { EDITION_STATES_MAX_IDS_PER_REQUEST } from '@/lib/shop/street-edition-states'
import { queryEditionStatesByProductIds } from '@/lib/shop/query-edition-states'

export const dynamic = 'force-dynamic'

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
      return NextResponse.json({ items: [] })
    }

    try {
      const items = await queryEditionStatesByProductIds(numericIds)
      return NextResponse.json({ items })
    } catch (err) {
      console.error('[edition-states]', err)
      return NextResponse.json({ error: 'Failed to load edition state' }, { status: 500 })
    }
  } catch (e) {
    console.error('[edition-states]', e)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
