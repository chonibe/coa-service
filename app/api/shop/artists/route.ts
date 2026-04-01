import { NextRequest, NextResponse } from 'next/server'
import { getShopArtistsList } from '@/lib/shop/artists-list'

/**
 * Artists/Vendors List API
 *
 * Returns all unique vendors/artists from Shopify products,
 * enriched with Supabase vendor profile data (profile images, bios).
 */

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    const artists = await getShopArtistsList()
    return NextResponse.json({ artists })
  } catch (error) {
    console.error('[Artists API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch artists', artists: [] },
      { status: 500 }
    )
  }
}
