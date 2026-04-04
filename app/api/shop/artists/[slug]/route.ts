import { NextRequest, NextResponse } from 'next/server'
import { fetchArtistProfile } from '@/lib/shop/fetch-artist-profile'

export const dynamic = 'force-dynamic'

/**
 * Artist/Vendor Profile API — thin wrapper around shared `fetchArtistProfile`.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const vendor = new URL(request.url).searchParams.get('vendor')

  try {
    const artist = await fetchArtistProfile(slug, { vendor })
    if (!artist) {
      return NextResponse.json({ error: 'Artist not found', products: [] }, { status: 404 })
    }

    return NextResponse.json({
      ...artist,
      profile: artist.profile ?? {},
      stats: artist.stats ?? {
        editionCount: artist.products?.length ?? 0,
        remainingCount: 0,
      },
      products: artist.products ?? [],
    })
  } catch (error) {
    console.error('[Artist API] Error for slug', slug, ':', error)
    return NextResponse.json({ error: 'Failed to fetch artist', products: [] }, { status: 500 })
  }
}
