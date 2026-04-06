import { NextResponse } from 'next/server'
import {
  getExperienceSeasonsVendorCatalogMerged,
  isStorefrontConfigured,
} from '@/lib/shopify/storefront-client'

const SEASON_1_HANDLE = 'season-1'
const SEASON_2_HANDLE = '2025-edition'

/**
 * GET /api/shop/experience/collection-vendors
 *
 * Paginates both season collections with minimal fields and returns every vendor
 * with artwork counts — used so filter UI is not limited to the first SSR page (e.g. 24 products).
 */
export async function GET() {
  if (!isStorefrontConfigured()) {
    return NextResponse.json({ artists: [] as [string, number][] })
  }

  try {
    const artists = await getExperienceSeasonsVendorCatalogMerged(SEASON_1_HANDLE, SEASON_2_HANDLE)
    return NextResponse.json(
      { artists },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    )
  } catch (error) {
    console.error('[API] collection-vendors failed:', error)
    return NextResponse.json({ artists: [] as [string, number][] }, { status: 200 })
  }
}
